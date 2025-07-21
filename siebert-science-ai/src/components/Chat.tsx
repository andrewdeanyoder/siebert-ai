import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { Message } from "ai/react";

interface Chat {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  messages: Message[];
}

const Chat: React.FC<Chat> = ({
  input,
  handleInputChange,
  handleMessageSubmit,
  messages,
}) => {
  return (
    <div id="chat" className="...">
      <Messages messages={messages} />
      <>
        <form onSubmit={handleMessageSubmit} className="...">
          <input
            type="text"
            className="..."
            value={input}
            onChange={handleInputChange}
          />

          <span className="...">Press ⮐ to send</span>
        </form>
      </>
    </div>
  );
};

export default Chat;