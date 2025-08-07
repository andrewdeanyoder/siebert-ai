"use client";
import { useState } from "react";
import { Message } from "ai/react";
import Image from "next/image";
import Chat from "#/components/Chat";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Banner */}
        <div className="flex flex-col items-center w-full mb-8">
          <Image
            src="/memory-lab-brain.png"
            alt="Memory Lab Brain"
            width={200}
            height={50}
            className="w-auto h-auto max-w-full rounded-full"
            priority
          />
          <h1 className="text-3xl font-bold text-white mt-4">A&P Memory Lab Tutor</h1>
        </div>

        {/* Chat functionality integrated here */}
        <div className="w-full max-w-4xl">
          <Chat
            input={input}
            handleInputChange={handleInputChange}
            handleMessageSubmit={handleSubmit}
            messages={messages}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}