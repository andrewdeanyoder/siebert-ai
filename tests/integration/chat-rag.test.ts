import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Hoist mock functions
const {
  mockGenerateText,
  mockEmbed,
  mockEmbedding,
  mockQuerySimilarChunks,
  mockQueryTopChunksForDebug,
} = vi.hoisted(() => {
  return {
    mockGenerateText: vi.fn(),
    mockEmbed: vi.fn(),
    mockEmbedding: vi.fn().mockReturnValue("mocked-embedding-model"),
    mockQuerySimilarChunks: vi.fn(),
    mockQueryTopChunksForDebug: vi.fn(),
  };
});

vi.mock("ai", () => ({
  generateText: mockGenerateText,
  embed: mockEmbed,
  tool: (t: unknown) => t,
  stepCountIs: vi.fn((n: number) => `stepCountIs-${n}`),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: Object.assign(vi.fn().mockReturnValue("mocked-chat-model"), {
    embedding: mockEmbedding,
  }),
}));

vi.mock("#/db/queries", () => ({
  querySimilarChunks: mockQuerySimilarChunks,
  queryTopChunksForDebug: mockQueryTopChunksForDebug,
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

  it("should retrieve chunks via tool and return references", async () => {
    const queryEmbedding = new Array(1536).fill(0.5);
    mockEmbed.mockResolvedValue({ embedding: queryEmbedding });

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
    mockQuerySimilarChunks.mockResolvedValue(mockChunks);
    mockQueryTopChunksForDebug.mockResolvedValue([]);

    mockGenerateText.mockImplementation(async ({ tools }: { tools: { searchCourseContent: { execute: (args: { query: string }) => Promise<unknown> } } }) => {
      await tools.searchCourseContent.execute({ query: "How many chambers does the heart have?" });
      return { text: "The heart has four chambers: two atria and two ventricles." };
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "user", content: "How many chambers does the heart have?" },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe("The heart has four chambers: two atria and two ventricles.");
    expect(data.references).toHaveLength(2);
    expect(data.references[0]).toMatchObject({
      documentName: "anatomy-textbook.pdf",
      pageNumber: 1,
      snippet: "The heart has four chambers.",
      similarity: 0.85,
    });

    expect(mockEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "How many chambers does the heart have?",
      })
    );
  });

  it("should return empty references when tool finds no matching chunks", async () => {
    mockEmbed.mockResolvedValue({ embedding: new Array(1536).fill(0.5) });
    mockQuerySimilarChunks.mockResolvedValue([]);
    mockQueryTopChunksForDebug.mockResolvedValue([]);

    mockGenerateText.mockImplementation(async ({ tools }: { tools: { searchCourseContent: { execute: (args: { query: string }) => Promise<unknown> } } }) => {
      await tools.searchCourseContent.execute({ query: "Hello!" });
      return { text: "I can help you with anatomy questions." };
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello!" }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe("I can help you with anatomy questions.");
    expect(data.references).toEqual([]);
  });

  it("should degrade gracefully when retrieval fails", async () => {
    mockEmbed.mockResolvedValue({ embedding: new Array(1536).fill(0.5) });
    mockQuerySimilarChunks.mockRejectedValue(new Error("Database unavailable"));

    mockGenerateText.mockImplementation(async ({ tools }: { tools: { searchCourseContent: { execute: (args: { query: string }) => Promise<unknown> } } }) => {
      await tools.searchCourseContent.execute({ query: "What is a cell?" });
      return { text: "I can still help you, though I cannot access course materials right now." };
    });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is a cell?" }],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBeDefined();
    expect(data.references).toEqual([]);
    expect(data.ragError).toBeDefined();
    expect(mockGenerateText).toHaveBeenCalled();
  });

  it("should call generateText with searchCourseContent tool and stopWhen", async () => {
    mockGenerateText.mockResolvedValue({ text: "Hello! How can I help?" });

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.objectContaining({
          searchCourseContent: expect.any(Object),
        }),
        stopWhen: "stepCountIs-2",
      })
    );
  });
});
