import { Message } from "ai";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function Messages({ messages }: { messages: Message[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="space-y-4 mb-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={"p-4 rounded-lg bg-black text-white border border-gray-600"}
        >
          <div className="flex items-start gap-3">
            <div className="text-lg">
              {msg.role === "assistant" ? "🤖" : "🧑‍💻"}
            </div>
            <div className="flex-1 prose prose-sm max-w-none prose-invert">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}