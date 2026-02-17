import * as fs from "fs/promises";
import * as path from "path";
import { PDFParse } from "pdf-parse";
import type { ParsedDocument } from "./types";

const SUPPORTED_MIME_TYPES = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
} as const;

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = SUPPORTED_MIME_TYPES[ext as keyof typeof SUPPORTED_MIME_TYPES];

  if (!mimeType) {
    throw new Error(
      `Unsupported file type: ${ext}. Supported types: ${Object.keys(SUPPORTED_MIME_TYPES).join(", ")}`
    );
  }

  const filename = path.basename(filePath);

  if (mimeType === "text/plain" || mimeType === "text/markdown") {
    return parseTextFile(filePath, filename, mimeType);
  }

  return parsePdfFile(filePath, filename);
}

async function parseTextFile(
  filePath: string,
  filename: string,
  mimeType: string
): Promise<ParsedDocument> {
  const content = await fs.readFile(filePath, "utf-8");

  return {
    content,
    metadata: {
      filename,
      mimeType,
    },
  };
}

async function parsePdfFile(
  filePath: string,
  filename: string
): Promise<ParsedDocument> {
  const buffer = await fs.readFile(filePath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse(uint8Array);
  const textResult = await parser.getText();

  // Extract per-page content for page number tracking
  const pages = textResult.pages.map((page, index) => ({
    pageNumber: index + 1,
    text: page.text,
  }));

  // todo: add support for extracting images from the Pdfs
  return {
    content: textResult.text,
    pages,
    metadata: {
      filename,
      mimeType: "application/pdf",
      pageCount: textResult.pages.length,
    },
  };
}
