"use client"
import React, { useState } from "react";
import Messages, { type MessageWithReferences } from "./Messages";
import { MODEL } from "../lib/constants";
import { LAST_UPDATED } from "../app/prompts";
import submitMessages from "../lib/http/submitMessages";
import MicrophoneButton from "./MicrophoneButton";

export enum TtsMethod {
  Deepgram = 'deepgram',
  DeepgramMedical = 'deepgram-medical',
  Browser = 'browser',
  Vosk = 'vosk',
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<MessageWithReferences[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsMethod, setTtsMethod] = useState<TtsMethod>(TtsMethod.Deepgram);

  // todo: move this into the upper scope.
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: MessageWithReferences = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // todo: move this into a http helper that returns parsed data or an error message
    const newMessage = await submitMessages(messages, userMessage, setMessages, setIsLoading);
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div id="chat" className="w-full max-w-4xl mx-auto">
      <Messages messages={messages} />
      {isLoading && (
        <div className="text-center py-4 text-gray-600">
          <span>AI is thinking...</span>
        </div>
      )}
      <form onSubmit={handleMessageSubmit} className="w-full">
        <div className="w-full relative">
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 relative">
            <textarea
              className="w-full px-4 py-3 pr-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black text-base resize-none overflow-y-auto"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Type your message..."
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '240px', // ~10 lines at 24px line height
                height: 'auto',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 240) + 'px';
              }}
            />
            <MicrophoneButton
              isLoading={isLoading}
              onTranscript={(transcript: string) => {
                setInput(prev => {
                  const space = prev ? " " : "";

                  return (prev + space + transcript).trim()
                });
              }}
              ttsMethod={ttsMethod}
            />
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
          <div className="mt-3 flex justify-center items-center gap-2">
            <span className="text-white text-sm">Voice Recognition:</span>
            <select
              value={ttsMethod}
              onChange={(e) => setTtsMethod(e.target.value as TtsMethod)}
              className="px-2 py-1 bg-white border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              aria-label="TTS Method"
            >
              <option value={TtsMethod.Deepgram}>Deepgram</option>
              <option value={TtsMethod.DeepgramMedical}>Deepgram Medical</option>
              <option value={TtsMethod.Browser}>Browser</option>
              <option value={TtsMethod.Vosk}>Vosk (Does not work yet)</option>
            </select>
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


