import type { Chunk, PageContent, ParsedDocument } from "./types";
import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from "../constants";

export function chunkDocument(
  document: ParsedDocument,
): Chunk[] {
  const chunkSize = DEFAULT_CHUNK_SIZE;
  const chunkOverlap = DEFAULT_CHUNK_OVERLAP;

  const { content, pages } = document;

  if (!content.trim()) {
    return [];
  }

  const lines = content.split("\n");

  // Try semantic chunking first (by paragraphs/sections)
  const semanticChunks = splitBySemanticBoundaries(content);

  let chunks: Chunk[];
  if (semanticChunks.length > 1) {
    // Use semantic chunks if we found meaningful boundaries
    chunks = createChunksFromSegments(semanticChunks, lines, chunkSize, chunkOverlap);
  } else {
    // Fall back to size-based chunking
    chunks = createSizeBasedChunks(content, lines, chunkSize, chunkOverlap);
  }

  // Add page numbers for PDFs (and remove line numbers since they don't apply)
  if (pages && pages.length > 0) {
    return chunks.map((chunk) => {
      const pdfChunk: Chunk = {
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        pageNumber: findPageNumber(chunk.content, pages),
      };
      if (chunk.metadata) {
        pdfChunk.metadata = chunk.metadata;
      }
      return pdfChunk;
    });
  }

  return chunks;
}

function splitBySemanticBoundaries(content: string): string[] {
  // Split by double newlines (paragraphs) or chapter/section markers
  const sectionPattern = /\n\n+|(?=^(?:Chapter|Section|\d+\.)\s)/gim;
  const segments = content.split(sectionPattern).filter((s) => s.trim());

  return segments;
}

function createChunksFromSegments(
  segments: string[],
  allLines: string[],
  maxSize: number,
  overlap: number
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const segment of segments) {
    if (currentChunk.length + segment.length > maxSize && currentChunk.length > 0) {
      // Save current chunk
      const lineInfo = findLineNumbers(currentChunk, allLines);
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex,
        lineStart: lineInfo.start,
        lineEnd: lineInfo.end,
      });
      chunkIndex++;

      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, overlap);
      currentChunk = overlapText + segment;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + segment;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    const lineInfo = findLineNumbers(currentChunk, allLines);
    chunks.push({
      content: currentChunk.trim(),
      chunkIndex,
      lineStart: lineInfo.start,
      lineEnd: lineInfo.end,
    });
  }

  return chunks;
}

function createSizeBasedChunks(
  content: string,
  allLines: string[],
  chunkSize: number,
  overlap: number
): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < content.length) {
    let end = Math.min(start + chunkSize, content.length);

    // Try to break at a sentence or word boundary
    if (end < content.length) {
      const lastPeriod = content.lastIndexOf(".", end);
      const lastSpace = content.lastIndexOf(" ", end);

      if (lastPeriod > start + chunkSize / 2) {
        end = lastPeriod + 1;
      } else if (lastSpace > start + chunkSize / 2) {
        end = lastSpace;
      }
    }

    const chunkContent = content.slice(start, end).trim();
    if (chunkContent) {
      const lineInfo = findLineNumbers(chunkContent, allLines);
      chunks.push({
        content: chunkContent,
        chunkIndex,
        lineStart: lineInfo.start,
        lineEnd: lineInfo.end,
      });
      chunkIndex++;
    }

    start = end - overlap;
    if (start >= content.length - overlap) break;
  }

  return chunks;
}

function findLineNumbers(
  chunk: string,
  allLines: string[]
): { start: number; end: number } {
  const chunkFirstLine = chunk.split("\n")[0]?.trim();
  const chunkLines = chunk.split("\n");
  const chunkLastLine = chunkLines[chunkLines.length - 1]?.trim();

  let start = 1;
  let end = allLines.length;

  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i]?.trim().includes(chunkFirstLine ?? "")) {
      start = i + 1;
      break;
    }
  }

  for (let i = allLines.length - 1; i >= 0; i--) {
    if (allLines[i]?.trim().includes(chunkLastLine ?? "")) {
      end = i + 1;
      break;
    }
  }

  return { start, end };
}

function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) return text;
  return text.slice(-overlapSize);
}

function findPageNumber(chunkContent: string, pages: PageContent[]): number {
  // Find the first line of the chunk to search for
  const firstLine = chunkContent.split("\n")[0]?.trim();
  if (!firstLine) return 1;

  // Search for which page contains this content
  for (const page of pages) {
    if (page.text.includes(firstLine)) {
      return page.pageNumber;
    }
  }

  // Fallback: return page 1 if not found
  return 1;
}
