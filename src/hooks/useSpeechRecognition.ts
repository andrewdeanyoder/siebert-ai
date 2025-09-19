import { useEffect, useRef, useState } from "react";
import * as Vosk from "vosk-browser";
import { startWebSpeechRecording, stopWebSpeechRecording, isWebSpeechSupported } from "../utils/webSpeechHelpers";

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


  const startVoskRecording = async (): Promise<void> => {
    try {
      const model = await Vosk.createModel('model.tar.gz');
      const recognizer = new model.KaldiRecognizer(16000);

      // Set up event listeners
      recognizer.on("result", (message) => {
        if ('result' in message && 'text' in message.result) {
          onTranscript(message.result.text);
        }
      });

      // Get microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        },
      });

      // Create audio processing pipeline
      const audioContext = new AudioContext();
      const recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);

      recognizerNode.onaudioprocess = (event) => {
        try {
          recognizer.acceptWaveform(event.inputBuffer);
        } catch (error) {
          console.error('acceptWaveform failed', error);
        }
      };

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(recognizerNode);
      recognizerNode.connect(audioContext.destination);

      // Store refs for cleanup
      audioContextRef.current = audioContext;
      recognizerNodeRef.current = recognizerNode;
      mediaStreamRef.current = mediaStream;

      // Start processing
      await audioContext.resume();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start Vosk recording:', error);
      setIsRecording(false);
    }
  };

  const stopVoskRecording = (): void => {
    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.suspend();
      audioContextRef.current = null;
    }

    // Disconnect and cleanup audio nodes
    if (recognizerNodeRef.current) {
      recognizerNodeRef.current.disconnect();
      recognizerNodeRef.current = null;
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
  };

  const startRecording = (): void => {
    if (ttsMethod === 'vosk') {
      startVoskRecording();
    } else {
      startWebSpeechRecording(onTranscript, setIsRecording, webSpeechRef);
    }
  };

  const stopRecording = (): void => {
    if (ttsMethod === 'vosk') {
      stopVoskRecording();
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
        stopVoskRecording();
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
