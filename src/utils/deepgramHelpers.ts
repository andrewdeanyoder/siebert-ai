

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

// Type for Deepgram live connection
interface DeepgramLiveConnection {
  on: (event: string, callback: (data: unknown) => void) => void;
  send: (buffer: ArrayBuffer) => void;
  finish: () => void;
  getReadyState: () => number;
}

// Global variables to manage Deepgram connection and audio stream
let deepgramLive: DeepgramLiveConnection | null = null;
let mediaStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let processor: ScriptProcessorNode | null = null;

export const startDeepgramRecording = async (
  setIsRecording: (isRecording: boolean) => void,
  onTranscript: (transcript: string) => void
) => {
  try {
    console.log('Starting Deepgram recording...');

    // Get temporary token from our API
    // todo: factor our token fetching to its own function
    const tokenResponse = await fetch('/api/token', {cache: 'no-store'});
    const {access_token} = await tokenResponse.json();

    if (!access_token) {
      throw new Error('Failed to get Deepgram token');
    }

    // Create Deepgram client with temporary token
    const deepgram = createClient({accessToken: access_token});

    // Create live transcription connection
    deepgramLive = deepgram.listen.live({
      model: "nova-3",
      interim_results: true,
      smart_format: true,
      filler_words: true,
      utterance_end_ms: 3000,
    });

    // Handle transcription events
    deepgramLive.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened');
      setIsRecording(true);
    });

    // todo: type data properly here
    deepgramLive.on(LiveTranscriptionEvents.Transcript, (data) => {
      const thisCaption = data.channel?.alternatives?.[0]?.transcript;
      if (thisCaption && data.is_final) {
        console.log('Final transcript:', thisCaption);
        onTranscript(thisCaption);
      }
    });

    deepgramLive.on(LiveTranscriptionEvents.Error, (error: unknown) => {
      console.error('Deepgram error:', error);
      setIsRecording(false);
    });

    deepgramLive.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
      setIsRecording(false);
    });

    // Get user media for audio capture
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      }
    });

    // Set up audio processing
    audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(mediaStream);

    // Create script processor to capture audio data
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (deepgramLive && deepgramLive.getReadyState() === 1) {
        const inputData = event.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array for Deepgram
        const int16Array = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const value = inputData[i];
          if (value !== undefined) {
            int16Array[i] = Math.max(-32768, Math.min(32767, value * 32768));
          }
        }
        if (deepgramLive) {
          deepgramLive.send(int16Array.buffer);
        }
      }
    };

    // Connect audio nodes
    source.connect(processor);
    processor.connect(audioContext.destination);

    setIsRecording(true);
    console.log('Deepgram recording started successfully');

  } catch (error) {
    console.error('Error starting Deepgram recording:', error);
    setIsRecording(false);
  }
};

export const stopDeepgramRecording = (setIsRecording: (isRecording: boolean) => void) => {
  console.log('Stopping Deepgram recording...');

  try {
    // Stop audio processing
    if (processor) {
      processor.disconnect();
      processor = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    // Stop media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    // Close Deepgram connection
    if (deepgramLive) {
      deepgramLive.finish();
      deepgramLive = null;
    }

    setIsRecording(false);
    console.log('Deepgram recording stopped successfully');

  } catch (error) {
    console.error('Error stopping Deepgram recording:', error);
    setIsRecording(false);
  }
};

