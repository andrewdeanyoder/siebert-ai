import { useEffect, useRef, useState } from "react";
import { startWebSpeechRecording, stopWebSpeechRecording, isWebSpeechSupported } from "../utils/webSpeechHelpers";
import { startVoskRecording, stopVoskRecording } from "../utils/voskHelpers";
import { startDeepgramRecording, stopDeepgramRecording, pauseMicrophone, resumeDeepgramMicrophone } from "../utils/deepgramHelpers";
import { TtsMethod } from "../components/Chat";

export enum RecordingState {
  Stopped = 'stopped',
  Loading = 'loading',
  Recording = 'recording',
  Paused = 'paused',
  Error = 'error',
}

export const useSpeechRecognition = (onTranscript: (transcript: string) => void, ttsMethod: TtsMethod) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Stopped);
  const [speechSupported, setSpeechSupported] = useState(false);

  // For backward compatibility with browser/vosk methods
  const isRecordingOrLoading = recordingState === RecordingState.Recording || recordingState === RecordingState.Loading;

  // Tracks whether mic was paused for a submit (avoids stale closure in resumeAfterResponse)
  const isPausedRef = useRef(false);

  // Web Speech API refs
  const webSpeechRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Vosk refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognizerNodeRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecordingOrLoading) {
      stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
      stopWebSpeechRecording(webSpeechRef);
      stopDeepgramRecording();
      setRecordingState(RecordingState.Stopped);
    }

    if (ttsMethod === TtsMethod.Vosk) {
      setSpeechSupported(false);
    } else if (ttsMethod === TtsMethod.Deepgram || ttsMethod === TtsMethod.DeepgramMedical) {
      setSpeechSupported(true);
    } else {
      setSpeechSupported(isWebSpeechSupported());
    }

    return () => {
      if (ttsMethod === TtsMethod.Vosk) {
        stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
      } else if (ttsMethod === TtsMethod.Deepgram || ttsMethod === TtsMethod.DeepgramMedical) {
        stopDeepgramRecording();
      } else {
        stopWebSpeechRecording(webSpeechRef);
      }
    };
  // only listen to ttsMethod here. Otherwise recording will never start.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsMethod]);


  const startRecording = (): void => {
    if (ttsMethod === TtsMethod.Vosk) {
      startVoskRecording(onTranscript, (recording) => {
        setRecordingState(recording ? RecordingState.Recording : RecordingState.Stopped);
      }, audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else if (ttsMethod === TtsMethod.Deepgram || ttsMethod === TtsMethod.DeepgramMedical) {
      setRecordingState(RecordingState.Loading);
      startDeepgramRecording(setRecordingState, onTranscript, ttsMethod);
    } else {
      startWebSpeechRecording(onTranscript, (recording) => {
        setRecordingState(recording ? RecordingState.Recording : RecordingState.Stopped);
      }, webSpeechRef);
    }
  };

  const stopRecording = (): void => {
    if (ttsMethod === TtsMethod.Vosk) {
      stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else if (ttsMethod === TtsMethod.Deepgram || ttsMethod === TtsMethod.DeepgramMedical) {
      stopDeepgramRecording();
    } else {
      stopWebSpeechRecording(webSpeechRef);
    }
    setRecordingState(RecordingState.Stopped);
  };

  const pauseForSubmit = (): void => {
    if (!isRecordingOrLoading) return;
    if (ttsMethod === TtsMethod.Deepgram || ttsMethod === TtsMethod.DeepgramMedical) {
      pauseMicrophone();
      setRecordingState(RecordingState.Paused);
      isPausedRef.current = true;
    } else {
      stopRecording();
    }
  };

  const resumeAfterResponse = async (): Promise<void> => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    await resumeDeepgramMicrophone();
    setRecordingState(RecordingState.Recording);
  };

  const toggleRecording = (): void => {
    if (!speechSupported) return;
    if (isRecordingOrLoading) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    recordingState,
    speechSupported,
    toggleRecording,
    pauseForSubmit,
    resumeAfterResponse,
  };
};
