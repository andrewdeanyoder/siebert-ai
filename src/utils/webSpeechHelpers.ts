import React from "react";

interface ISpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResult[];
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
};

export const isWebSpeechSupported = (): boolean => {
  return getSpeechRecognitionConstructor() != null;
};

const createWebSpeechRecognition = (
  onTranscript: (transcript: string) => void,
  setIsRecording: (recording: boolean) => void,
  webSpeechRef: React.MutableRefObject<{ start: () => void; stop: () => void } | null>
): ISpeechRecognition | null => {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = false; // append only final results to avoid duplication
  recognition.lang = "en-US";

  recognition.onresult = (event: ISpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result) continue;
      if (result.isFinal) {
        const transcript = result[0]?.transcript ?? "";
        if (transcript) {
          onTranscript(transcript);
        }
      }
    }
  };

  recognition.onerror = () => {
    setIsRecording(false);
  };

  recognition.onend = () => {
    setIsRecording(false);
    webSpeechRef.current = null;
  };

  return recognition;
};

export const startWebSpeechRecording = (
  onTranscript: (transcript: string) => void,
  setIsRecording: (recording: boolean) => void,
  webSpeechRef: React.MutableRefObject<{ start: () => void; stop: () => void } | null>
): void => {
  const recognition = createWebSpeechRecognition(onTranscript, setIsRecording, webSpeechRef);

  if (!recognition) return;

  webSpeechRef.current = recognition;
  recognition.start();
  setIsRecording(true);
};

export const stopWebSpeechRecording = (
  webSpeechRef: React.MutableRefObject<{ start: () => void; stop: () => void } | null>
): void => {
  if (webSpeechRef.current) {
    webSpeechRef.current.stop();
  }
};
