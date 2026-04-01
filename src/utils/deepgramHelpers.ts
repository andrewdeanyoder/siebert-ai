

import { createClient, ListenLiveClient, LiveTranscriptionEvent, LiveTranscriptionEvents } from '@deepgram/sdk';
import { RecordingState } from '../hooks/useSpeechRecognition';
import { TtsMethod } from '../components/Chat';

let deepGramConnection: ListenLiveClient | null = null;
let microphone: MediaRecorder | null = null;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

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

const setUpDeepgram = async (setRecordingState: (state: RecordingState) => void, ttsMethod: TtsMethod) => {
  const microphonePromise = setUpMicrophone();
  const tokenPromise = fetch('/api/token', {cache: 'no-store'}).then(async res => await res.json());
  let access_token: string | undefined;

  [microphone, {access_token}] = await Promise.all([microphonePromise, tokenPromise]);

  if (!access_token) {
    stopMicrophone();
    throw new Error('Failed to get Deepgram token');
  }
  let deepgramLiveConnection: ListenLiveClient | null = null;

  return new Promise<ListenLiveClient | null>((resolve, reject) => {
    try {
      const deepgram = createClient({accessToken: access_token});

      const model = ttsMethod === TtsMethod.DeepgramMedical ? "nova-3-medical" : "nova-3";

      deepgramLiveConnection = deepgram.listen.live({
        model,
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

      deepgramLiveConnection.on(LiveTranscriptionEvents.Close, (event) => {
        console.log('Deepgram connection closed', event);
        setRecordingState(RecordingState.Stopped);
        stopMicrophone();
        resolve(null);
      });

    } catch (error: unknown) {
      console.error('Error setting up Deepgram:', error);
      setRecordingState(RecordingState.Error);
      throw error;
    }
  });
}

// iOS SAFARI FIX: Prevent packetZero from being sent. If sent at size 0, the connection will close.
const attachMicrophone = async (): Promise<void> => {
  if(!microphone){
    microphone = await setUpMicrophone();
  }
  if (microphone && deepGramConnection) {
    microphone.addEventListener('dataavailable', (e: BlobEvent) => {
      if (e.data.size > 0) {
        deepGramConnection?.send(e.data);
      }
    });
    microphone.start(250);
  }
};

export const startDeepgramRecording = async (
  setRecordingState: (state: RecordingState) => void,
  onTranscript: (transcript: string) => void,
  ttsMethod: TtsMethod
) => {
  try {
    console.log('Starting Deepgram recording...');

    deepGramConnection = await setUpDeepgram(setRecordingState, ttsMethod);

    if (deepGramConnection) {
      deepGramConnection.addListener(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
        const { is_final: isFinal } = data;
        const thisCaption = data.channel.alternatives[0]?.transcript;

        if (thisCaption && thisCaption !== "" && isFinal) {
          onTranscript(thisCaption);
        }
      });

      await attachMicrophone();
    }

    console.log('Deepgram recording started successfully');

  } catch (error) {
    console.error('Error starting Deepgram recording:', error);
    stopDeepgramRecording();
    setRecordingState(RecordingState.Error);
  }
};

const stopMicrophone = () => {
  console.log('Stopping microphone...', microphone);
  if (microphone) {
    microphone.stop();
    microphone.stream.getTracks().forEach(track => track.stop());
    microphone = null;
  }
};

const clearKeepAlive = (): void => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

export const pauseMicrophone = (): void => {
  stopMicrophone();
  keepAliveInterval = setInterval(() => {
    deepGramConnection?.keepAlive();
  }, 5000);
};

export const resumeDeepgramMicrophone = async (): Promise<void> => {
  if (!deepGramConnection) return;
  await attachMicrophone();
  clearKeepAlive();
};

export const stopDeepgramRecording = (): void => {
  console.log('Stopping Deepgram recording...');

  try {
    clearKeepAlive();
    stopMicrophone();

    if (deepGramConnection) {
      deepGramConnection.requestClose();
      deepGramConnection = null;
    }

    console.log('Deepgram recording stopped successfully');

  } catch (error) {
    console.error('Error stopping Deepgram recording:', error);
  }
};

