import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { EMBEDDING_MODEL } from "#/lib/constants";
import { querySimilarChunks, queryTopChunksForDebug } from "#/db/queries";
import type { RetrievedChunk } from "./types";

export async function retrieveRelevantChunks(
  query: string
): Promise<RetrievedChunk[]> {
  console.log("[RAG] retrieveRelevantChunks called with query:", query.substring(0, 100));

  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: query,
  });
  console.log("[RAG] Query embedding generated, dimensions:", queryEmbedding.length);

  const results = await querySimilarChunks(queryEmbedding);

  console.log("[RAG] Database query returned", results.length, "chunks above threshold");
  if (results.length > 0) {
    console.log("[RAG] Top results:", results.map(r => ({
      documentName: r.documentName,
      similarity: r.similarity,
      contentPreview: r.content.substring(0, 50) + "..."
    })));
  } else {
    const debugResults = await queryTopChunksForDebug(queryEmbedding);
    console.log("[RAG] DEBUG - No chunks above threshold. Top 3 chunks by similarity:", debugResults);
  }

  return results.map((row) => {
    const chunk: RetrievedChunk = {
      id: row.id,
      documentId: row.documentId,
      content: row.content,
      embedding: row.embedding,
      chunkIndex: row.chunkIndex,
      createdAt: row.createdAt,
      similarity: row.similarity,
      documentName: row.documentName,
    };
    if (row.pageNumber !== null) {
      chunk.pageNumber = row.pageNumber;
    }
    if (row.lineStart !== null) {
      chunk.lineStart = row.lineStart;
    }
    if (row.lineEnd !== null) {
      chunk.lineEnd = row.lineEnd;
    }
    if (row.metadata !== null) {
      chunk.metadata = row.metadata as Record<string, unknown>;
    }
    return chunk;
  });
}
