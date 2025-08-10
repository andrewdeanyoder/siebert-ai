import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { Message } from "ai/react";
import { MODEL } from "../constants";

interface Chat {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => void;
  messages: Message[];
  isLoading?: boolean;
}

const Chat: React.FC<Chat> = ({
  input,
  handleInputChange,
  handleMessageSubmit,
  messages,
  isLoading = false,
}) => {
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
              className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Type your message..."
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
          </div>
        </div>
      </form>
    </div>
  );
};

export default Chat;