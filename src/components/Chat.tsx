"use client"
import React, { useState } from "react";
import Messages from "./Messages";
import type { Message } from "ai/react";
import { MODEL } from "../lib/constants";
import { LAST_UPDATED } from "../app/prompts";
import submitMessages from "../lib/http/submitMessages";
import MicrophoneButton from "./MicrophoneButton";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // todo: move this into the upper scope
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // TODO: can we get rid of the form, if we're not using the standard form submit actions?
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

    // todo: move this into a http helper that returns parsed data or an error message
    const newMessage = await submitMessages(messages, userMessage, setMessages, setIsLoading);
    setMessages(prev => [...prev, newMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
      e.currentTarget.style.height = 'auto';
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
            <textarea
              className="w-full px-4 py-3 pr-28 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black resize-none overflow-y-auto"
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
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = Math.min(target.scrollHeight, 240) + 'px';
              }}
              onKeyDown={handleKeyDown}
            />
            <MicrophoneButton
              isLoading={isLoading}
              onTranscript={(transcript: string) => {
                setInput(prev => (prev + (prev ? " " : "") + transcript).trim());
              }}
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


