import {eq, count } from "drizzle-orm";
import { db } from "#/db";
import { documents, chunks } from "#/db/schema";
import { fileURLToPath } from "node:url";

export type DeleteSuccess = {
  success: true;
  originalName: string;
  chunksDeleted: number;
};

export type DeleteError = {
  success: false;
  error: string;
};

type DeleteResult = DeleteSuccess | DeleteError;

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

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error("Usage: pnpm delete-doc <document-id>");
    process.exit(1);
  }

  const documentId = args[0]!;
  console.log(`Deleting document ${documentId}...`);

  try {
    const result = await deleteDocument(documentId);

    if (result.success) {
      console.log(`  ✓ Deleted: ${result.originalName}`);
      console.log(`  ✓ Removed ${result.chunksDeleted} chunks`);
      console.log("Done!");
    } else {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
  }