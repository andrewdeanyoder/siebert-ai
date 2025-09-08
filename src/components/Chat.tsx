"use client"
import React, { useEffect, useRef, useState } from "react";
import Messages from "./Messages";
import type { Message } from "ai/react";
import { MODEL } from "../constants";
import { LAST_UPDATED } from "../app/prompts";

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

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
};

const isSpeechSupported = (): boolean => {
  return getSpeechRecognitionConstructor() != null;
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
  }, []);

  // todo: move this into the upper scope
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // todo: move this into the upper scope- better readability
  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = (): void => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;

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
            setInput(prev => (prev + (prev ? " " : "") + transcript).trim());
          }
        }
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = (): void => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleMicToggle = (): void => {
    if (!speechSupported) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  return (
    <div id="chat" className="w-full max-w-4xl mx-auto">
      <Messages messages={messages} />
      {isLoading && (
        <div className="text-center py-4 text-gray-600">
          <span>AI is thinking...</span>
        </div>
      )}
      <form onSubmit={handleMessageSubmit} className="flex flex-col items-center w-full">
        <div className="w-[66.666667vw] relative">
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 relative">
            <input
              type="text"
              className="w-full px-4 py-3 pr-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Type your message..."
            />
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={isLoading || !speechSupported}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              title={speechSupported ? (isRecording ? "Stop recording" : "Start recording") : "Speech recognition not supported"}
              className={`absolute top-1/2 right-20 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
                isRecording ? "bg-red-500 hover:bg-red-600 border-red-600" : "bg-gray-200 hover:bg-gray-300 border-gray-300"
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3z" />
                <path d="M19 11a1 1 0 1 0-2 0 5 5 0 1 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 19 11z" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute top-1/2 right-6 transform -translate-y-1/2 w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-white text-sm">Powered by {MODEL}</span>
            <div className="text-white text-sm mt-1">
              System Prompt last updated {new Date(LAST_UPDATED).toLocaleDateString()}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Chat;