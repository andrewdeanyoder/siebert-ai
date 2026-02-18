import { Message } from "ai";
import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import References from "./References";
import type { Reference, RagError } from "#/lib/rag/types";

export interface MessageWithReferences extends Message {
  references?: Reference[];
  ragError?: RagError;
}

export default function Messages({ messages }: { messages: MessageWithReferences[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          {msg.role === "assistant" && ((msg.references && msg.references.length > 0) || msg.ragError) && (
            <References references={msg.references ?? []} {...(msg.ragError ? { ragError: msg.ragError } : {})} />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}