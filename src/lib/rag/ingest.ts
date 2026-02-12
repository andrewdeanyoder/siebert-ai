import * as fs from "fs/promises";
import * as path from "path";
import { db } from "#/db";
import { documents, chunks } from "#/db/schema";
import { parseDocument } from "./parse";
import { chunkDocument } from "./chunking";
import { generateEmbeddings } from "./embeddings";

type InjestSuccess = {
  success: true;
  documentId: string;
  chunksCreated: number;
}

type InjestError = {
  success: false,
  error: string;
}

export type IngestResult = InjestSuccess | InjestError;

export async function ingestDocument(filePath: string): Promise<IngestResult> {
  // Parse the document
  const parsed = await parseDocument(filePath);

  // Get file stats
  const stats = await fs.stat(filePath);
  const filename = path.basename(filePath);

  // Chunk the document
  const documentChunks = chunkDocument(parsed);

  if (documentChunks.length === 0) {
    return {
      success: false, // TODO: is this really a success????
      error: 'zero chunks created'
    };
  }

  // Generate embeddings
  const chunksWithEmbeddings = await generateEmbeddings(documentChunks);

  // Insert document record
  // TODO: if the document already exists, replace it instead
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
    return {
      success: false,
      error: "Failed to insert document record"
    }
  }

  const documentId = documentRecord.id;

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

  // todo: what about error handling on chunk insertion?

  return {
    success: true,
    documentId,
    chunksCreated: chunksWithEmbeddings.length,
  };
}
