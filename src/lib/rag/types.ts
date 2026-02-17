export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  content: string;
  pages?: PageContent[];
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  filename: string;
  mimeType: string;
  pageCount?: number;
}

export interface Chunk {
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  lineStart?: number;
  lineEnd?: number;
  metadata?: Record<string, unknown>;
}

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[];
}

export interface DocumentRecord {
  id: string;
  filename: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  content: string;
  embedding: number[] | null;
  chunkIndex: number;
  pageNumber?: number;
  lineStart?: number;
  lineEnd?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface RetrievedChunk extends ChunkRecord {
  similarity: number;
  documentName: string;
}

export interface Reference {
  documentName: string;
  pageNumber?: number;
  lineStart?: number;
  lineEnd?: number;
  snippet: string;
  similarity: number;
}
