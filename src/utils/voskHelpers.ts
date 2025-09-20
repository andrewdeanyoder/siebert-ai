import React from "react";
import * as Vosk from "vosk-browser";

export const startVoskRecording = async (
  onTranscript: (transcript: string) => void,
  setIsRecording: (recording: boolean) => void,
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  recognizerNodeRef: React.MutableRefObject<ScriptProcessorNode | null>,
  mediaStreamRef: React.MutableRefObject<MediaStream | null>
): Promise<void> => {
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

export const stopVoskRecording = (
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  recognizerNodeRef: React.MutableRefObject<ScriptProcessorNode | null>,
  mediaStreamRef: React.MutableRefObject<MediaStream | null>
): void => {
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
};
