import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { EMBEDDING_MODEL } from "#/lib/constants";
import type { Chunk, ChunkWithEmbedding } from "./types";

export async function generateEmbeddings(
  chunks: Chunk[]
): Promise<ChunkWithEmbedding[]> {
  if (chunks.length === 0) {
    return [];
  }

  const texts = chunks.map((chunk) => chunk.content);

  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: texts,
  });

  return chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index] ?? [],
  }));
}
