import { Message } from "ai";
import { useRef } from "react";

export default function Messages({ messages }: { messages: Message[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="...">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`${
            msg.role === "assistant" ? "text-green-300" : "text-blue-300"
          } ... `}
        >
          <div className="...">{msg.role === "assistant" ? "🤖" : "🧑‍💻"}</div>
          <div className="...">{msg.content}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}