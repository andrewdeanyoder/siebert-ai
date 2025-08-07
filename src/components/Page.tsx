
"use client";
// import Header from "./Header";
import Chat from "./Chat";
import { useChat } from "ai/react";

const Page: React.FC = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="...">
      {/* <Header className="..." /> */}
      <div className="...">
        <Chat
          input={input}
          handleInputChange={handleInputChange}
          handleMessageSubmit={handleSubmit}
          messages={messages}
        />
      </div>
    </div>
  );
};

export default Page;