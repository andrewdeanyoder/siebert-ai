import { useEffect, useRef, useState } from "react";
import { startWebSpeechRecording, stopWebSpeechRecording, isWebSpeechSupported } from "../utils/webSpeechHelpers";
import { startVoskRecording, stopVoskRecording } from "../utils/voskHelpers";

export const useSpeechRecognition = (onTranscript: (transcript: string) => void, ttsMethod: 'browser' | 'vosk') => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Web Speech API refs
  const webSpeechRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Vosk refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognizerNodeRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (ttsMethod === 'vosk') {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(isWebSpeechSupported());
  }, [ttsMethod]);



  const startRecording = (): void => {
    if (ttsMethod === 'vosk') {
      startVoskRecording(onTranscript, setIsRecording, audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else {
      startWebSpeechRecording(onTranscript, setIsRecording, webSpeechRef);
    }
  };

  const stopRecording = (): void => {
    if (ttsMethod === 'vosk') {
      stopVoskRecording(setIsRecording, audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else {
      stopWebSpeechRecording(webSpeechRef);
    }
  };

  const toggleRecording = (): void => {
    if (!speechSupported) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsMethod === 'vosk') {
        stopVoskRecording(setIsRecording, audioContextRef, recognizerNodeRef, mediaStreamRef);
      } else {
        stopWebSpeechRecording(webSpeechRef);
      }
    };
  }, [ttsMethod]);

  return {
    isRecording,
    speechSupported,
    toggleRecording,
  };
};
