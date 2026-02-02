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
  console.log("[RAG] retrieveRelevantChunks called with query:", query.substring(0, 100));
  console.log("[RAG] Config - SIMILARITY_THRESHOLD:", SIMILARITY_THRESHOLD, "MAX_RETRIEVAL_CHUNKS:", MAX_RETRIEVAL_CHUNKS);

  // Generate embedding for the query
  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: query,
  });
  console.log("[RAG] Query embedding generated, dimensions:", queryEmbedding.length);

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

  console.log("[RAG] Database query returned", results.length, "chunks above threshold");
  if (results.length > 0) {
    console.log("[RAG] Top results:", results.map(r => ({
      documentName: r.documentName,
      similarity: r.similarity,
      contentPreview: r.content.substring(0, 50) + "..."
    })));
  } else {
    // Debug: check what chunks exist and their max similarity
    const debugResults = await db
      .select({
        id: chunks.id,
        similarity: similarityExpr,
        documentName: documents.originalName,
        contentPreview: sql<string>`LEFT(${chunks.content}, 50)`,
      })
      .from(chunks)
      .innerJoin(documents, sql`${chunks.documentId} = ${documents.id}`)
      .orderBy(desc(similarityExpr))
      .limit(3);
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
