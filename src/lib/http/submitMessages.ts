import type { MessageWithReferences } from "#/components/Messages";
import type { Reference, RagError } from "#/lib/rag/types";

export default async function submitMessages(
  messages: MessageWithReferences[],
  userMessage: MessageWithReferences,
  onChunk: (text: string) => void,
  onComplete: (references: Reference[], ragError?: RagError) => void
): Promise<void> {
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

    if (!response.ok || !response.body) {
      throw new Error("Failed to get response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let references: Reference[] = [];
    let ragError: RagError | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("0:")) {
          onChunk(JSON.parse(line.slice(2)));
        } else if (line.startsWith("2:")) {
          const items: Array<{ references?: Reference[]; ragError?: RagError }> =
            JSON.parse(line.slice(2));
          for (const item of items) {
            if (item.references) references = item.references;
            if (item.ragError) ragError = item.ragError;
          }
        }
      }
    }

    onComplete(references, ragError);
  } catch (error) {
    console.error("Error sending message:", error);
    onChunk("Sorry, I encountered an error. Please try again.");
    onComplete([]);
  }
}
