import { desc, gt, sql } from "drizzle-orm";
import { db } from "#/db";
import { chunks, documents } from "#/db/schema";
import { SIMILARITY_THRESHOLD, MAX_RETRIEVAL_CHUNKS } from "#/lib/constants";

export async function querySimilarChunks(queryEmbedding: number[]) {
  const similarityExpr = sql<number>`1 - (${chunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

  return db
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
}

export async function queryTopChunksForDebug(queryEmbedding: number[]) {
  const similarityExpr = sql<number>`1 - (${chunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

  return db
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
}
