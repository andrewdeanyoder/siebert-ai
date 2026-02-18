import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Hoist mock functions
const {
  mockGenerateText,
  mockEmbed,
  mockEmbedding,
  mockSelect,
  mockFrom,
  mockInnerJoin,
  mockWhere,
  mockOrderBy,
  mockLimit,
} = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockGenerateText = vi.fn();
  const mockEmbed = vi.fn();
  const mockEmbedding = vi.fn().mockReturnValue("mocked-embedding-model");
  return {
    mockGenerateText,
    mockEmbed,
    mockEmbedding,
    mockSelect,
    mockFrom,
    mockInnerJoin,
    mockWhere,
    mockOrderBy,
    mockLimit,
  };
});

vi.mock("ai", () => ({
  generateText: mockGenerateText,
  embed: mockEmbed,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: Object.assign(vi.fn().mockReturnValue("mocked-chat-model"), {
    embedding: mockEmbedding,
  }),
}));

vi.mock("#/db", () => ({
  db: {
    select: mockSelect,
  },
}));

// Import after mocks
import { POST } from "#/app/api/chat/route";

describe("Chat API with RAG", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should retrieve chunks, inject context, and return references when relevant chunks exist", async () => {
    // Arrange - mock embedding generation for query
    const queryEmbedding = new Array(1536).fill(0.5);
    mockEmbed.mockResolvedValue({ embedding: queryEmbedding });

    // Arrange - mock database returning relevant chunks
    const mockChunks = [
      {
        id: "chunk-1",
        documentId: "doc-1",
        content: "The heart has four chambers.",
        embedding: new Array(1536).fill(0.5),
        chunkIndex: 0,
        pageNumber: 1,
        lineStart: null,
        lineEnd: null,
        createdAt: new Date(),
        similarity: 0.85,
        documentName: "anatomy-textbook.pdf",
      },
      {
        id: "chunk-2",
        documentId: "doc-1",
        content: "The atria receive blood from veins.",
        embedding: new Array(1536).fill(0.4),
        chunkIndex: 1,
        pageNumber: 2,
        lineStart: null,
        lineEnd: null,
        createdAt: new Date(),
        similarity: 0.78,
        documentName: "anatomy-textbook.pdf",
      },
    ];
    mockLimit.mockResolvedValue(mockChunks);

    // Arrange - mock AI response
    mockGenerateText.mockResolvedValue({
      text: "The heart has four chambers: two atria and two ventricles.",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful tutor." },
          { role: "user", content: "Hi, I'm studying anatomy." },
          { role: "assistant", content: "Welcome! What topic would you like to explore?" },
          { role: "user", content: "How many chambers does the heart have?" },
        ],
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert - response includes content and references
    expect(response.status).toBe(200);
    expect(data.content).toBe("The heart has four chambers: two atria and two ventricles.");
    expect(data.references).toBeDefined();
    expect(data.references).toHaveLength(2);

    // Assert - references have correct structure
    expect(data.references[0]).toMatchObject({
      documentName: "anatomy-textbook.pdf",
      pageNumber: 1,
      snippet: "The heart has four chambers.",
      similarity: 0.85,
    });

    // Assert - embed was called with user query
    expect(mockEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "How many chambers does the heart have?",
      })
    );

    // Assert - generateText was called with context injected
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }), // SYSTEM_PROMPT
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("The heart has four chambers"),
          }), // Context
        ]),
      })
    );
  });

  it("should work normally without references when no chunks match above threshold", async () => {
    // Arrange - mock embedding generation
    mockEmbed.mockResolvedValue({ embedding: new Array(1536).fill(0.5) });

    // Arrange - mock database returning no relevant chunks (empty array)
    mockLimit.mockResolvedValue([]);

    // Arrange - mock AI response
    mockGenerateText.mockResolvedValue({
      text: "I can help you with anatomy questions.",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello!" }],
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert - response works normally
    expect(response.status).toBe(200);
    expect(data.content).toBe("I can help you with anatomy questions.");

    // Assert - no references or empty references array
    expect(data.references).toEqual([]);

    // Assert - generateText was called without context injection
    const generateTextCall = mockGenerateText.mock.calls[0]?.[0];
    expect(generateTextCall).toBeDefined();
    const systemMessages = generateTextCall.messages.filter(
      (m: { role: string }) => m.role === "system"
    );
    // Should only have the main SYSTEM_PROMPT, not additional context
    expect(systemMessages).toHaveLength(1);
  });

  it("should sort chunks by relevance and limit to MAX_RETRIEVAL_CHUNKS", async () => {
    // Arrange
    mockEmbed.mockResolvedValue({ embedding: new Array(1536).fill(0.5) });

    // Create 7 chunks - should only use top 5 (MAX_RETRIEVAL_CHUNKS)
    const mockChunks = Array.from({ length: 5 }, (_, i) => ({
      id: `chunk-${i}`,
      documentId: "doc-1",
      content: `Content for chunk ${i}`,
      embedding: new Array(1536).fill(0.5 - i * 0.05),
      chunkIndex: i,
      pageNumber: i + 1,
      lineStart: null,
      lineEnd: null,
      createdAt: new Date(),
      similarity: 0.95 - i * 0.05, // Descending similarity
      documentName: "textbook.pdf",
    }));
    mockLimit.mockResolvedValue(mockChunks);

    mockGenerateText.mockResolvedValue({ text: "Response text" });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Tell me about cells" }],
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert - only MAX_RETRIEVAL_CHUNKS (5) references returned
    expect(data.references).toHaveLength(5);

    // Assert - references are sorted by relevance (first should have highest similarity)
    expect(data.references[0].snippet).toContain("chunk 0");
  });

  it("should degrade gracefully when retrieval fails", async () => {
    // Arrange - mock embedding to throw error
    mockEmbed.mockRejectedValue(new Error("Embedding service unavailable"));

    // Arrange - mock AI response (should still work)
    mockGenerateText.mockResolvedValue({
      text: "I can still help you, though I cannot access course materials right now.",
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is a cell?" }],
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert - response still works
    expect(response.status).toBe(200);
    expect(data.content).toBeDefined();

    // Assert - no references due to error
    expect(data.references).toEqual([]);

    // Assert - generateText was still called (graceful degradation)
    expect(mockGenerateText).toHaveBeenCalled();
  });
});
