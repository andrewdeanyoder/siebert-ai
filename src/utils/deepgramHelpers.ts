

import { createClient, ListenLiveClient, LiveTranscriptionEvent, LiveTranscriptionEvents } from '@deepgram/sdk';
import { RecordingState } from '../hooks/useSpeechRecognition';

let deepGramConnection: ListenLiveClient | null = null;
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
    microphone = null;
    throw error;
  }
};

const setUpDeepgram = async (setRecordingState: (state: RecordingState) => void) => {
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
        setRecordingState(RecordingState.Recording);
        resolve(deepgramLiveConnection);
      });

      deepgramLiveConnection.on(LiveTranscriptionEvents.Error, (error: unknown) => {
        console.error('Deepgram error:', error);
        setRecordingState(RecordingState.Error);
        reject(error);
      });

      deepgramLiveConnection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        // todo: deepgram will close on it's own. Do I need to clear the microphone?
        setRecordingState(RecordingState.Stopped);
        resolve(null);
      });
    } catch (error: unknown) {
      console.error('Error setting up Deepgram:', error);
      setRecordingState(RecordingState.Error);
      throw error;
    }
  });
}

export const startDeepgramRecording = async (
  setRecordingState: (state: RecordingState) => void,
  onTranscript: (transcript: string) => void
) => {
  try {
    console.log('Starting Deepgram recording...');

    microphone = await setUpMicrophone();
    deepGramConnection = await setUpDeepgram(setRecordingState);

    if(deepGramConnection && microphone) {
      deepGramConnection.addListener(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
        const { is_final: isFinal } = data;
        const thisCaption = data.channel.alternatives[0]?.transcript;

        if (thisCaption && thisCaption !== "" && isFinal) {
          onTranscript(thisCaption);
        }
      });

      microphone.addEventListener('dataavailable', (e: BlobEvent) => {
        // iOS SAFARI FIX:
        // Prevent packetZero from being sent. If sent at size 0, the connection will close.
        if (e.data.size > 0) {
          deepGramConnection?.send(e.data);
        }
      });

       microphone?.start(250);
    }

    console.log('Deepgram recording started successfully');

  } catch (error) {
    console.error('Error starting Deepgram recording:', error);
    setRecordingState(RecordingState.Error);
  }
};

export const stopDeepgramRecording = () => {
  console.log('Stopping Deepgram recording...');

  try {
    if (microphone) {
      microphone.stop();
      microphone.stream.getTracks().forEach(track => track.stop());
      microphone = null;
    }

    if (deepGramConnection) {
      deepGramConnection.requestClose();
      deepGramConnection = null;
    }

    console.log('Deepgram recording stopped successfully');

  } catch (error) {
    console.error('Error stopping Deepgram recording:', error);
  }
};

