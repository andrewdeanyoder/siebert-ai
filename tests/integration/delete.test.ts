import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DeleteSuccess, DeleteError } from "../../src/lib/rag/delete.ts";

const { mockSelectWhere, mockSelectFrom, mockSelect, mockDeleteWhere, mockDelete } =
  vi.hoisted(() => {
    const mockSelectWhere = vi.fn();
    const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
    const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
    const mockDeleteWhere = vi.fn();
    const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));
    return { mockSelectWhere, mockSelectFrom, mockSelect, mockDeleteWhere, mockDelete };
  });

vi.mock("#/db", () => ({
  db: {
    select: mockSelect,
    delete: mockDelete,
  },
}));

import { deleteDocument } from "#/lib/rag/delete";
import { documents, chunks } from "#/db/schema";

describe("deleteDocument", () => {
  beforeEach(() => {
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockDelete.mockReturnValue({ where: mockDeleteWhere });
  });

  afterEach(()=> vi.clearAllMocks());

  it("should delete document and return originalName and chunksDeleted on success", async () => {
    const documentId = "550e8400-e29b-41d4-a716-446655440000";
    const mockDoc = {
      id: documentId,
      originalName: "anatomy-notes.txt",
      filename: "anatomy-notes.txt",
      storagePath: "/path/to/file",
      mimeType: "text/plain",
      fileSize: 1024,
      uploadedAt: new Date(),
      uploadedBy: null,
    };

    // First select: document lookup → returns doc
    // Second select: chunk count → returns count
    mockSelectWhere
      .mockResolvedValueOnce([mockDoc])
      .mockResolvedValueOnce([{ count: 5 }]);

    mockDeleteWhere.mockResolvedValue(undefined);

    const result = await deleteDocument(documentId);

    const success = result as DeleteSuccess;
    expect(success.success).toBe(true);
    expect(success.originalName).toBe("anatomy-notes.txt");
    expect(success.chunksDeleted).toBe(5);

    // document lookup
    expect(mockSelect).toHaveBeenNthCalledWith(1);
    expect(mockSelectFrom).toHaveBeenNthCalledWith(1, documents);

    // count lookup
    expect(mockSelect).toHaveBeenNthCalledWith(2, { count: expect.anything() });
    expect(mockSelectFrom).toHaveBeenNthCalledWith(2, chunks);

    // delete
    expect(mockDelete).toHaveBeenCalledWith(documents);
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
  });

  it("should return error when document is not found", async () => {
    const documentId = "nonexistent-id";

    mockSelectWhere.mockResolvedValueOnce([]);

    const result = await deleteDocument(documentId);

    const error = result as DeleteError;
    expect(error.success).toBe(false);
    expect(error.error).toMatch(/not found/i);

    // delete should never be called
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should handle document with zero chunks", async () => {
    const documentId = "550e8400-e29b-41d4-a716-446655440001";
    const mockDoc = {
      id: documentId,
      originalName: "empty.txt",
      filename: "empty.txt",
      storagePath: "/path/to/empty.txt",
      mimeType: "text/plain",
      fileSize: 0,
      uploadedAt: new Date(),
      uploadedBy: null,
    };

    mockSelectWhere
      .mockResolvedValueOnce([mockDoc])
      .mockResolvedValueOnce([{ count: 0 }]);

    mockDeleteWhere.mockResolvedValue(undefined);

    const result = await deleteDocument(documentId);

    const success = result as DeleteSuccess;
    expect(success.success).toBe(true);
    expect(success.originalName).toBe("empty.txt");
    expect(success.chunksDeleted).toBe(0);
  });
});
