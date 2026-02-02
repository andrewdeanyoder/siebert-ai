import * as fs from "fs/promises";
import * as path from "path";
import { db } from "#/db";
import { documents, chunks } from "#/db/schema";
import { parseDocument } from "./parse";
import { chunkDocument } from "./chunking";
import { generateEmbeddings } from "./embeddings";

export interface IngestResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  error?: string;
}

export async function ingestDocument(filePath: string): Promise<IngestResult> {
  // Parse the document
  const parsed = await parseDocument(filePath);

  // Get file stats
  const stats = await fs.stat(filePath);
  const filename = path.basename(filePath);

  // Insert document record
  const [documentRecord] = await db
    .insert(documents)
    .values({
      filename,
      originalName: filename,
      storagePath: filePath,
      mimeType: parsed.metadata.mimeType,
      fileSize: stats.size,
    })
    .returning({ id: documents.id });

  if (!documentRecord) {
    throw new Error("Failed to insert document record");
  }

  const documentId = documentRecord.id;

  // Chunk the document
  const documentChunks = chunkDocument(parsed);

  if (documentChunks.length === 0) {
    return {
      success: true,
      documentId,
      chunksCreated: 0,
    };
  }

  // Generate embeddings
  const chunksWithEmbeddings = await generateEmbeddings(documentChunks);

  // Insert chunks
  await db.insert(chunks).values(
    chunksWithEmbeddings.map((chunk) => ({
      documentId,
      content: chunk.content,
      embedding: chunk.embedding,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      lineStart: chunk.lineStart,
      lineEnd: chunk.lineEnd,
      metadata: chunk.metadata,
    }))
  );

  return {
    success: true,
    documentId,
    chunksCreated: chunksWithEmbeddings.length,
  };
}
