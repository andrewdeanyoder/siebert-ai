import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: uuid("uploaded_by"),
});

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    chunkIndex: integer("chunk_index").notNull(),
    pageNumber: integer("page_number"),
    lineStart: integer("line_start"),
    lineEnd: integer("line_end"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);

export const documentsRelations = relations(documents, ({ many }) => ({
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.id],
  }),
}));
