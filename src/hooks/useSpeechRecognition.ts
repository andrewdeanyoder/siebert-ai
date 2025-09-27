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
    if (isRecording) {
      stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
      stopWebSpeechRecording(webSpeechRef);
      setIsRecording(false);
    }

    if (ttsMethod === 'vosk') {
      setSpeechSupported(false);
    } else {
      setSpeechSupported(isWebSpeechSupported());
    }

    // Cleanup on unmount
    return () => {
      if (ttsMethod === 'vosk') {
        stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
      } else {
        stopWebSpeechRecording(webSpeechRef);
      }
    };
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
      stopVoskRecording(audioContextRef, recognizerNodeRef, mediaStreamRef);
    } else {
      stopWebSpeechRecording(webSpeechRef);
    }
    setIsRecording(false);
  };

  const toggleRecording = (): void => {
    if (!speechSupported) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    speechSupported,
    toggleRecording,
  };
};
