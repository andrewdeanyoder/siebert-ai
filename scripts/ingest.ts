import * as path from "path";
import { ingestDocument } from "#/lib/rag/ingest";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: pnpm ingest <file-path> [file-path...]");
    console.error("Supported file types: .txt, .pdf");
    process.exit(1);
  }

  console.log(`Ingesting ${args.length} document(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const filePath of args) {
    const absolutePath = path.resolve(filePath);
    console.log(`Processing: ${path.basename(absolutePath)}`);

    try {
      const result = await ingestDocument(absolutePath);

      if (result.success) {
        console.log(`  ✓ Created ${result.chunksCreated} chunks`);
        console.log(`  ✓ Document ID: ${result.documentId}`);
        successCount++;
      } else {
        console.error(`  ✗ Failed: ${result.error}`);
        failCount++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error: ${message}`);
      failCount++;
    }

    console.log();
  }

  console.log(`\nDone! ${successCount} succeeded, ${failCount} failed.`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
