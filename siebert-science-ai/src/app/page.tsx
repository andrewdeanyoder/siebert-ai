"use client";
import { useState } from "react";
import { useChat } from "ai/react";
import VercelLinks from "#/components/VercelLinks";
import Chat from "#/components/Chat";

export default function Home() {
  const [context, setContext] = useState<string[] | null>(null);
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Chat functionality integrated here */}
        <div className="w-full max-w-4xl">
          <Chat
            input={input}
            handleInputChange={handleInputChange}
            handleMessageSubmit={handleSubmit}
            messages={messages}
          />
        </div>
        <VercelLinks />
      </main>
    </div>
  );
}