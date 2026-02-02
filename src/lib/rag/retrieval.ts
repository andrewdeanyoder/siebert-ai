import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { desc, gt, sql } from "drizzle-orm";
import { db } from "#/db";
import { chunks, documents } from "#/db/schema";
import {
  EMBEDDING_MODEL,
  SIMILARITY_THRESHOLD,
  MAX_RETRIEVAL_CHUNKS,
} from "#/lib/constants";
import type { RetrievedChunk } from "./types";

export async function retrieveRelevantChunks(
  query: string
): Promise<RetrievedChunk[]> {
  // Generate embedding for the query
  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: query,
  });

  // Query for similar chunks using cosine similarity
  // pgvector uses cosine distance (1 - similarity), so we convert
  const similarityExpr = sql<number>`1 - (${chunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

  const results = await db
    .select({
      id: chunks.id,
      documentId: chunks.documentId,
      content: chunks.content,
      embedding: chunks.embedding,
      chunkIndex: chunks.chunkIndex,
      pageNumber: chunks.pageNumber,
      lineStart: chunks.lineStart,
      lineEnd: chunks.lineEnd,
      metadata: chunks.metadata,
      createdAt: chunks.createdAt,
      similarity: similarityExpr,
      documentName: documents.originalName,
    })
    .from(chunks)
    .innerJoin(documents, sql`${chunks.documentId} = ${documents.id}`)
    .where(gt(similarityExpr, SIMILARITY_THRESHOLD))
    .orderBy(desc(similarityExpr))
    .limit(MAX_RETRIEVAL_CHUNKS);

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
