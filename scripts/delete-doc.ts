import { deleteDocument } from "#/lib/rag/delete";

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

main();
