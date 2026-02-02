import type { Chunk, ParsedDocument } from "./types";

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export function chunkDocument(
  document: ParsedDocument,
  options: ChunkingOptions = {}
): Chunk[] {
  const { chunkSize = DEFAULT_CHUNK_SIZE, chunkOverlap = DEFAULT_CHUNK_OVERLAP } =
    options;

  const { content } = document;

  if (!content.trim()) {
    return [];
  }

  const lines = content.split("\n");

  // Try semantic chunking first (by paragraphs/sections)
  const semanticChunks = splitBySemanticBoundaries(content);

  if (semanticChunks.length > 1) {
    // Use semantic chunks if we found meaningful boundaries
    return createChunksFromSegments(semanticChunks, lines, chunkSize, chunkOverlap);
  }

  // Fall back to size-based chunking
  return createSizeBasedChunks(content, lines, chunkSize, chunkOverlap);
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
