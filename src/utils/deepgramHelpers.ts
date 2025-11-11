

import { createClient, ListenLiveClient, LiveTranscriptionEvent, LiveTranscriptionEvents } from '@deepgram/sdk';

let deepGramConnection: ListenLiveClient | null = null;
let mediaStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let processor: ScriptProcessorNode | null = null;
let microphone: MediaRecorder | null = null;

const setUpMicrophone = async (): Promise<MediaRecorder | null> => {
  try {
    const userMedia = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
      },
    });
    // todo: does creating a new MediaRecorder each time deepgram is started lead to a memory leak?
    // what happens if Deepgram closes because of it's own timeout?
    microphone = new MediaRecorder(userMedia);

    console.log('Microphone set up successfully', microphone);

    return microphone;
  } catch (error: unknown) {
    console.error('Error getting microphone:', error);
    throw error;
  }
};

const setUpDeepgram = async (setIsRecording: (isRecording: boolean) => void) => {
  const tokenResponse = await fetch('/api/token', {cache: 'no-store'});
  const {access_token} = await tokenResponse.json();
  if (!access_token) {
    throw new Error('Failed to get Deepgram token');
  }
  let deepgramLiveConnection: ListenLiveClient | null = null;

  return new Promise<ListenLiveClient | null>((resolve, reject) => {
    try {
      const deepgram = createClient({accessToken: access_token});
      deepgramLiveConnection = deepgram.listen.live({
        model: "nova-3",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
      });

      deepgramLiveConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
        setIsRecording(true);
        resolve(deepgramLiveConnection);
      });

      deepgramLiveConnection.on(LiveTranscriptionEvents.Error, (error: unknown) => {
        console.error('Deepgram error:', error);
        setIsRecording(false);
        reject(error);
      });

      deepgramLiveConnection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        // todo: deepgram will close on it's own. Do I need to clear the microphone?
        setIsRecording(false);
        resolve(null);
      });
    } catch (error: unknown) {
      console.error('Error setting up Deepgram:', error);
      setIsRecording(false);
      throw error;
    }
  });
}

export const startDeepgramRecording = async (
  setIsRecording: (isRecording: boolean) => void,
  onTranscript: (transcript: string) => void
) => {
  try {
    console.log('Starting Deepgram recording...');

    microphone = await setUpMicrophone();
    deepGramConnection = await setUpDeepgram(setIsRecording);

    if(deepGramConnection && microphone) {
      deepGramConnection.addListener(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
        const { is_final: isFinal, speech_final: speechFinal } = data;
        const thisCaption = data.channel.alternatives[0]?.transcript;

        console.log("thisCaption", thisCaption);
        if (thisCaption && thisCaption !== "") {
          console.log('thisCaption !== ""', thisCaption);
          onTranscript(thisCaption);
        } else {
          console.warn('invalid thisCaption:', `${thisCaption}`, typeof thisCaption === 'string');
        }

        if (isFinal && speechFinal) {
          // todo: do I need to do something else when it's final?
          console.log({isFinal, speechFinal})
        }

      });

      microphone.addEventListener('dataavailable', (e: BlobEvent) => {
        // iOS SAFARI FIX:
        // Prevent packetZero from being sent. If sent at size 0, the connection will close.
        console.log('dataavailable', e.data.size);
        if (e.data.size > 0) {
          deepGramConnection?.send(e.data);
        }
      });

      if (microphone?.state === "paused") {
        microphone.resume();
      } else {
        microphone?.start(250);
      }
    }
    // Set up audio processing - use default sample rate to match MediaStream
    // audioContext = new AudioContext();
    // const source = audioContext.createMediaStreamSource(mediaStream);

    // // Create script processor to capture audio data
    // processor = audioContext.createScriptProcessor(4096, 1, 1);

    // processor.onaudioprocess = (event) => {
    //   if (deepgramLive && deepgramLive.getReadyState() === 1) {
    //     const inputData = event.inputBuffer.getChannelData(0);
    //     // Convert Float32Array to Int16Array for Deepgram
    //     const int16Array = new Int16Array(inputData.length);
    //     for (let i = 0; i < inputData.length; i++) {
    //       const value = inputData[i];
    //       if (value !== undefined) {
    //         int16Array[i] = Math.max(-32768, Math.min(32767, value * 32768));
    //       }
    //     }
    //     if (deepgramLive) {
    //       deepgramLive.send(int16Array.buffer);
    //     }
    //   }
    // };

    // Connect audio nodes
    // source.connect(processor);
    // processor.connect(audioContext.destination);

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
    if (deepGramConnection) {
      deepGramConnection.requestClose();
      deepGramConnection = null;
    }

    if (microphone) {
      microphone.stop();
      microphone = null;
    }

    setIsRecording(false);
    console.log('Deepgram recording stopped successfully');

  } catch (error) {
    console.error('Error stopping Deepgram recording:', error);
    setIsRecording(false);
  }
};

