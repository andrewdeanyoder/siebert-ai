import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";

// Hoist mock functions so they're available in vi.mock factories
const { mockValues, mockReturning, mockInsert, mockEmbedding, mockEmbedMany } =
  vi.hoisted(() => {
    const mockValues = vi.fn();
    const mockReturning = vi.fn();
    const mockInsert = vi.fn(() => ({
      values: mockValues.mockReturnValue({
        returning: mockReturning,
      }),
    }));
    const mockEmbedding = vi.fn().mockReturnValue("mocked-embedding-model");
    const mockEmbedMany = vi.fn();
    return { mockValues, mockReturning, mockInsert, mockEmbedding, mockEmbedMany };
  });

vi.mock("#/db", () => ({
  db: {
    insert: mockInsert,
  },
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: {
    embedding: mockEmbedding,
  },
}));

vi.mock("ai", () => ({
  embed: vi.fn(),
  embedMany: mockEmbedMany,
}));

// Import after mocks are set up
import { ingestDocument } from "#/lib/rag/ingest";
import { documents, chunks } from "#/db/schema";

// Create a temp directory for test files
const TEST_DIR = path.join(
  process.cwd(),
  "tests",
  "integration",
  "test-fixtures"
);

describe("Document Ingestion Pipeline", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("text file ingestion", () => {
    it("should parse, chunk, embed, and store a text file using semantic markers", async () => {
      // Arrange - content with all semantic markers: Chapter, Section, numbered (1.)
      // Content is under 1000 chars so all segments merge into one chunk
      const textContent = `Chapter 1: Introduction

This is the introduction to anatomy.

Section A: Cell Biology

Cells are the basic unit of life.

1. Cell Membrane

The cell membrane surrounds the cell.

2. Nucleus

The nucleus contains DNA.`;

      // Expected: all segments merge into 1 chunk (total ~250 chars, under 1000 char limit)
      const expectedChunkContent = `Chapter 1: Introduction

This is the introduction to anatomy.

Section A: Cell Biology

Cells are the basic unit of life.

1. Cell Membrane

The cell membrane surrounds the cell.

2. Nucleus

The nucleus contains DNA.`;

      const testFilePath = path.join(TEST_DIR, "anatomy-notes.txt");
      await fs.writeFile(testFilePath, textContent);

      const mockDocumentId = "doc-123";
      mockReturning.mockResolvedValue([{ id: mockDocumentId }]);

      const mockEmbeddings = [new Array(1536).fill(0.1)];
      mockEmbedMany.mockResolvedValue({ embeddings: mockEmbeddings });

      // Act
      const result = await ingestDocument(testFilePath);

      // Assert - result
      expect(result.success).toBe(true);
      expect(result.documentId).toBe(mockDocumentId);
      expect(result.chunksCreated).toBe(1);

      // Assert - document insertion
      expect(mockInsert).toHaveBeenCalledWith(documents);
      const documentInsertCall = mockValues.mock.calls[0]?.[0];
      expect(documentInsertCall).toMatchObject({
        filename: "anatomy-notes.txt",
        originalName: "anatomy-notes.txt",
        mimeType: "text/plain",
      });
      expect(documentInsertCall.fileSize).toBeGreaterThan(0);
      expect(documentInsertCall.storagePath).toContain("anatomy-notes.txt");

      // Assert - embedMany called with correct model and content
      expect(mockEmbedding).toHaveBeenCalledWith("text-embedding-3-small");
      expect(mockEmbedMany).toHaveBeenCalledWith({
        model: "mocked-embedding-model",
        values: [expectedChunkContent],
      });

      // Assert - chunks insertion
      expect(mockInsert).toHaveBeenCalledWith(chunks);
      const chunksInsertCall = mockValues.mock.calls[1]?.[0];
      expect(Array.isArray(chunksInsertCall)).toBe(true);
      expect(chunksInsertCall.length).toBe(1);

      const firstChunk = chunksInsertCall[0];
      expect(firstChunk).toMatchObject({
        documentId: mockDocumentId,
        chunkIndex: 0,
        content: expectedChunkContent,
      });
      expect(firstChunk.embedding).toEqual(mockEmbeddings[0]);

      // Assert - text files have line numbers, not page numbers
      expect(firstChunk.lineStart).toBe(1);
      expect(firstChunk.lineEnd).toBe(15);
      expect(firstChunk.pageNumber).toBeUndefined();
      expect(firstChunk.metadata).toBeUndefined();
    });

    it("should create multiple chunks when content exceeds chunk size", async () => {
      // Arrange - create content with 2 large sections (each > 500 chars)
      // so they exceed the 1000 char limit when combined
      const section1 = "Chapter 1: Introduction\n\n" + "A".repeat(600);
      const section2 = "Chapter 2: Details\n\n" + "B".repeat(600);
      const textContent = `${section1}\n\n${section2}`;

      const testFilePath = path.join(TEST_DIR, "large-doc.txt");
      await fs.writeFile(testFilePath, textContent);

      const mockDocumentId = "doc-456";
      mockReturning.mockResolvedValue([{ id: mockDocumentId }]);

      // Expect 2 chunks (one per chapter since each exceeds size when combined)
      const mockEmbeddings = [
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ];
      mockEmbedMany.mockResolvedValue({ embeddings: mockEmbeddings });

      // Act
      const result = await ingestDocument(testFilePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(2);

      const chunksInsertCall = mockValues.mock.calls[1]?.[0];
      expect(chunksInsertCall.length).toBe(2);

      // First chunk should contain Chapter 1 content
      expect(chunksInsertCall[0].content).toContain("Chapter 1");
      expect(chunksInsertCall[0].content).toContain("AAA");
      expect(chunksInsertCall[0].chunkIndex).toBe(0);

      // Second chunk should contain Chapter 2 content (with some overlap from Chapter 1)
      expect(chunksInsertCall[1].content).toContain("Chapter 2");
      expect(chunksInsertCall[1].content).toContain("BBB");
      expect(chunksInsertCall[1].chunkIndex).toBe(1);
    });

    it("should track line numbers for text file chunks", async () => {
      // Arrange
      const textContent = `Line 1: Introduction
Line 2: More content
Line 3: Even more content
Line 4: Final content`;

      const testFilePath = path.join(TEST_DIR, "simple.txt");
      await fs.writeFile(testFilePath, textContent);

      mockReturning.mockResolvedValue([{ id: "doc-123" }]);
      mockEmbedMany.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
      });

      // Act
      await ingestDocument(testFilePath);

      // Assert - chunks should have line number information
      const chunksInsertCall = mockValues.mock.calls[1]?.[0];
      expect(Array.isArray(chunksInsertCall)).toBe(true);

      const firstChunk = chunksInsertCall[0];
      expect(firstChunk.lineStart).toBeDefined();
      expect(firstChunk.lineEnd).toBeDefined();
      expect(typeof firstChunk.lineStart).toBe("number");
      expect(typeof firstChunk.lineEnd).toBe("number");
      expect(firstChunk.lineStart).toBeGreaterThanOrEqual(1);
    });
  });

  describe("PDF file ingestion", () => {
    it("should parse, chunk, embed, and store a PDF file", async () => {
      // Arrange
      const pdfContent = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Hello PDF World) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
307
%%EOF`);

      const testFilePath = path.join(TEST_DIR, "test.pdf");
      await fs.writeFile(testFilePath, pdfContent);

      const mockDocumentId = "pdf-doc-123";
      mockReturning.mockResolvedValue([{ id: mockDocumentId }]);
      mockEmbedMany.mockResolvedValue({
        embeddings: [new Array(1536).fill(0.1)],
      });

      // Act
      const result = await ingestDocument(testFilePath);

      // Assert - result
      expect(result.success).toBe(true);
      expect(result.documentId).toBe(mockDocumentId);

      // Assert - document insertion with PDF mime type
      expect(mockInsert).toHaveBeenCalledWith(documents);
      const documentInsertCall = mockValues.mock.calls[0]?.[0];
      expect(documentInsertCall).toMatchObject({
        filename: "test.pdf",
        originalName: "test.pdf",
        mimeType: "application/pdf",
      });

      // Assert - chunks insertion for PDF
      expect(mockInsert).toHaveBeenCalledWith(chunks);
      const chunksInsertCall = mockValues.mock.calls[1]?.[0];
      expect(Array.isArray(chunksInsertCall)).toBe(true);
      expect(chunksInsertCall.length).toBeGreaterThan(0);

      const firstChunk = chunksInsertCall[0];
      expect(firstChunk).toMatchObject({
        documentId: mockDocumentId,
        chunkIndex: 0,
      });
      expect(firstChunk.content).toBeTruthy();
      expect(firstChunk.embedding).toEqual([...new Array(1536).fill(0.1)]);

      // Assert - PDFs have page numbers, not line numbers
      expect(firstChunk.pageNumber).toBe(1);
      expect(firstChunk.lineStart).toBeUndefined();
      expect(firstChunk.lineEnd).toBeUndefined();
      expect(firstChunk.metadata).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should reject invalid file types", async () => {
      // Arrange
      const testFilePath = path.join(TEST_DIR, "image.jpg");
      await fs.writeFile(testFilePath, "fake image content");

      // Act & Assert
      await expect(ingestDocument(testFilePath)).rejects.toThrow(
        /unsupported file type/i
      );

      // Assert - no database calls should be made
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockEmbedMany).not.toHaveBeenCalled();
    });

    it("should handle empty files gracefully", async () => {
      // Arrange
      const testFilePath = path.join(TEST_DIR, "empty.txt");
      await fs.writeFile(testFilePath, "");

      mockReturning.mockResolvedValue([{ id: "doc-123" }]);

      // Act
      const result = await ingestDocument(testFilePath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(0);

      // Assert - document should still be inserted
      expect(mockInsert).toHaveBeenCalledWith(documents);

      // Assert - embedMany should NOT be called for empty content
      expect(mockEmbedMany).not.toHaveBeenCalled();

      // Assert - chunks should NOT be inserted for empty content
      expect(mockInsert).toHaveBeenCalledTimes(1); // Only documents, not chunks
    });

    it("should handle non-existent files", async () => {
      // Arrange
      const testFilePath = path.join(TEST_DIR, "nonexistent.txt");

      // Act & Assert
      await expect(ingestDocument(testFilePath)).rejects.toThrow();

      // Assert - no database calls should be made
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });
});
