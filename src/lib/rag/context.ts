import type { RetrievedChunk, Reference } from "./types";

export function formatContextMessage(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const contextParts = chunks.map((chunk, index) => {
    const locationInfo = chunk.pageNumber
      ? `Page ${chunk.pageNumber}`
      : chunk.lineStart && chunk.lineEnd
        ? `Lines ${chunk.lineStart}-${chunk.lineEnd}`
        : "";

    const source = locationInfo
      ? `[${chunk.documentName}, ${locationInfo}]`
      : `[${chunk.documentName}]`;

    return `[${index + 1}] ${source}\n${chunk.content}`;
  });

  return `The following excerpts from course materials may be relevant to the student's question. Use them to inform your response when applicable, but continue to apply Socratic teaching methods.

---
${contextParts.join("\n\n---\n")}
---`;
}

export function chunksToReferences(chunks: RetrievedChunk[]): Reference[] {
  return chunks.map((chunk) => {
    const ref: Reference = {
      documentName: chunk.documentName,
      snippet: chunk.content,
    };
    if (chunk.pageNumber !== undefined) {
      ref.pageNumber = chunk.pageNumber;
    }
    if (chunk.lineStart !== undefined) {
      ref.lineStart = chunk.lineStart;
    }
    if (chunk.lineEnd !== undefined) {
      ref.lineEnd = chunk.lineEnd;
    }
    return ref;
  });
}
