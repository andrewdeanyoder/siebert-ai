import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { Message } from "ai/react";

interface Chat {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
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
    <div id="chat" className="...">
      <Messages messages={messages} />
      {isLoading && (
        <div className="...">
          <span>AI is thinking...</span>
        </div>
      )}
      <>
        <form onSubmit={handleMessageSubmit} className="...">
          <input
            type="text"
            className="..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
          />

          <span className="...">Press ⮐ to send</span>
        </form>
      </>
    </div>
  );
};

export default Chat;