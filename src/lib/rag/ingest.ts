import * as fs from "fs/promises";
import * as path from "path";
import { db } from "#/db";
import { documents, chunks } from "#/db/schema";
import { parseDocument } from "./parse";
import { chunkDocument } from "./chunking";
import { generateEmbeddings } from "./embeddings";

export type IngestSuccess = {
  success: true;
  documentId: string;
  chunksCreated: number;
}

export type IngestError = {
  success: false,
  error: string;
}

export type IngestResult = IngestSuccess | IngestError;

export async function ingestDocument(filePath: string): Promise<IngestResult> {
  const parsed = await parseDocument(filePath);

  const fileStats = await fs.stat(filePath);
  const filename = path.basename(filePath);

  const documentChunks = chunkDocument(parsed);

  if (documentChunks.length === 0) {
    return {
      success: false,
      error: 'zero chunks created'
    };
  }

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
      fileSize: fileStats.size,
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
