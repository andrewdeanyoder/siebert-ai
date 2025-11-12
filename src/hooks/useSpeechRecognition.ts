import { useEffect, useRef, useState } from "react";
import { startWebSpeechRecording, stopWebSpeechRecording, isWebSpeechSupported } from "../utils/webSpeechHelpers";
import { startVoskRecording, stopVoskRecording } from "../utils/voskHelpers";
import { startDeepgramRecording, stopDeepgramRecording } from "../utils/deepgramHelpers";

export enum RecordingState {
  Stopped = 'stopped',
  Loading = 'loading',
  Recording = 'recording',
  Error = 'error',
}

export const useSpeechRecognition = (onTranscript: (transcript: string) => void, ttsMethod: 'browser' | 'vosk' | 'deepgram') => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Stopped);
  const [speechSupported, setSpeechSupported] = useState(false);

  // For backward compatibility with browser/vosk methods
  const isRecordingOrLoading = recordingState === RecordingState.Recording || recordingState === RecordingState.Loading;

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

    if (ttsMethod === 'vosk') {
      setSpeechSupported(false);
    } else if (ttsMethod === 'deepgram') {
      setSpeechSupported(true);
    } else {
      setSpeechSupported(isWebSpeechSupported());
    }

    return () => {
      if (ttsMethod === 'vosk') {
        stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
      } else if (ttsMethod === 'deepgram') {
        stopDeepgramRecording();
      } else {
        stopWebSpeechRecording(webSpeechRef);
      }
    };
  // only listen to ttsMethod here. Otherwise recording will never start.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsMethod]);


  const startRecording = (): void => {
    if (ttsMethod === 'vosk') {
      startVoskRecording(onTranscript, (recording) => {
        setRecordingState(recording ? RecordingState.Recording : RecordingState.Stopped);
      }, audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else if (ttsMethod === 'deepgram') {
      setRecordingState(RecordingState.Loading);
      startDeepgramRecording(setRecordingState, onTranscript);
    } else {
      startWebSpeechRecording(onTranscript, (recording) => {
        setRecordingState(recording ? RecordingState.Recording : RecordingState.Stopped);
      }, webSpeechRef);
    }
  };

  const stopRecording = (): void => {
    if (ttsMethod === 'vosk') {
      stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else if (ttsMethod === 'deepgram') {
      stopDeepgramRecording();
    } else {
      stopWebSpeechRecording(webSpeechRef);
    }
    setRecordingState(RecordingState.Stopped);
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
  };
};
