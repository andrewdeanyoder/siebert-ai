import { eq, count } from "drizzle-orm";
import { db } from "#/db";
import { documents, chunks } from "#/db/schema";

export type DeleteSuccess = {
  success: true;
  originalName: string;
  chunksDeleted: number;
};

export type DeleteError = {
  success: false;
  error: string;
};

export type DeleteResult = DeleteSuccess | DeleteError;

export async function deleteDocument(documentId: string): Promise<DeleteResult> {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));

  if (!doc) {
    return { success: false, error: `Document not found: ${documentId}` };
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(chunks)
    .where(eq(chunks.documentId, documentId));

  const chunksDeleted = Number(countResult?.count ?? 0);

  await db.delete(documents).where(eq(documents.id, documentId));

  return { success: true, originalName: doc.originalName, chunksDeleted };
}
