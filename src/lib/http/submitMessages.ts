import { Message } from "ai/react";

export default async function submitMessages(messages: Message[], userMessage: Message, setMessages: React.Dispatch<React.SetStateAction<Message[]>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
  let newMessage: Message;

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

    newMessage = await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    newMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: "Sorry, I encountered an error. Please try again.",
    };
  } finally {
    setIsLoading(false);
  }

  return newMessage;
}