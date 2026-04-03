import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Hoist mock functions and MockStreamData class
const {
  mockStreamText,
  mockEmbed,
  mockEmbedding,
  mockSelect,
  mockLimit,
  MockStreamData,
} = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockStreamText = vi.fn();
  const mockEmbed = vi.fn();
  const mockEmbedding = vi.fn().mockReturnValue("mocked-embedding-model");

  class MockStreamData {
    items: unknown[] = [];
    append(value: unknown) { this.items.push(value); }
    close() {}
  }

  return {
    mockStreamText,
    mockEmbed,
    mockEmbedding,
    mockSelect,
    mockFrom,
    mockInnerJoin,
    mockWhere,
    mockOrderBy,
    mockLimit,
    MockStreamData,
  };
});

vi.mock("ai", () => ({
  streamText: mockStreamText,
  StreamData: MockStreamData,
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

// Helper: parse a Vercel AI data stream response into text and data items
async function readDataStream(response: Response) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const data: unknown[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("0:")) text += JSON.parse(line.slice(2));
      else if (line.startsWith("2:")) data.push(...JSON.parse(line.slice(2)));
    }
  }
  return { text, data };
}

// Helper: build a mock stream response for a given text, calling onFinish
function buildStreamResponse(
  text: string,
  streamData: InstanceType<typeof MockStreamData>,
  onFinish?: () => void
): Response {
  onFinish?.();
  const dataLine = `2:${JSON.stringify(streamData.items)}\n`;
  const textLine = `0:${JSON.stringify(text)}\n`;
  const finishLine = `d:{"finishReason":"stop"}\n`;
  return new Response(dataLine + textLine + finishLine, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

describe("Chat API with RAG", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, OPENAI_API_KEY: "test-key" };

    mockStreamText.mockImplementation(
      ({ onFinish }: { onFinish?: () => void }) => ({
        toDataStreamResponse: ({ data }: { data: InstanceType<typeof MockStreamData> }) =>
          buildStreamResponse(
            "The heart has four chambers: two atria and two ventricles.",
            data,
            onFinish
          ),
      })
    );
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
    const { text, data } = await readDataStream(response);

    // Assert - response includes content and references
    expect(response.status).toBe(200);
    expect(text).toBe("The heart has four chambers: two atria and two ventricles.");
    const payload = data[0] as { references: Array<{ documentName: string; pageNumber: number; snippet: string; similarity: number }> };
    expect(payload.references).toHaveLength(2);

    // Assert - references have correct structure
    expect(payload.references[0]).toMatchObject({
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

    // Assert - streamText was called with context injected
    expect(mockStreamText).toHaveBeenCalledWith(
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

    mockStreamText.mockImplementation(
      ({ onFinish }: { onFinish?: () => void }) => ({
        toDataStreamResponse: ({ data }: { data: InstanceType<typeof MockStreamData> }) =>
          buildStreamResponse("I can help you with anatomy questions.", data, onFinish),
      })
    );

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello!" }],
      }),
    });

    // Act
    const response = await POST(request);
    const { text, data } = await readDataStream(response);

    // Assert - response works normally
    expect(response.status).toBe(200);
    expect(text).toBe("I can help you with anatomy questions.");

    // Assert - no references or empty references array
    const payload = data[0] as { references: unknown[] };
    expect(payload.references).toEqual([]);

    // Assert - streamText was called without context injection
    const streamTextCall = mockStreamText.mock.calls[0]![0];
    const systemMessages = streamTextCall.messages.filter(
      (m: { role: string }) => m.role === "system"
    );
    // Should only have the main SYSTEM_PROMPT, not additional context
    expect(systemMessages).toHaveLength(1);
  });

  it("should sort chunks by relevance and limit to MAX_RETRIEVAL_CHUNKS", async () => {
    // Arrange
    mockEmbed.mockResolvedValue({ embedding: new Array(1536).fill(0.5) });

    // Create 5 chunks at MAX_RETRIEVAL_CHUNKS limit
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

    mockStreamText.mockImplementation(
      ({ onFinish }: { onFinish?: () => void }) => ({
        toDataStreamResponse: ({ data }: { data: InstanceType<typeof MockStreamData> }) =>
          buildStreamResponse("Response text", data, onFinish),
      })
    );

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Tell me about cells" }],
      }),
    });

    // Act
    const response = await POST(request);
    const { data } = await readDataStream(response);

    // Assert - only MAX_RETRIEVAL_CHUNKS (5) references returned
    const payload = data[0] as { references: Array<{ snippet: string }> };
    expect(payload.references).toHaveLength(5);

    // Assert - references are sorted by relevance (first should have highest similarity)
    expect(payload.references[0]!.snippet).toContain("chunk 0");
  });

  it("should degrade gracefully when retrieval fails", async () => {
    // Arrange - mock embedding to throw error
    mockEmbed.mockRejectedValue(new Error("Embedding service unavailable"));

    mockStreamText.mockImplementation(
      ({ onFinish }: { onFinish?: () => void }) => ({
        toDataStreamResponse: ({ data }: { data: InstanceType<typeof MockStreamData> }) =>
          buildStreamResponse(
            "I can still help you, though I cannot access course materials right now.",
            data,
            onFinish
          ),
      })
    );

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is a cell?" }],
      }),
    });

    // Act
    const response = await POST(request);
    const { text, data } = await readDataStream(response);

    // Assert - response still works
    expect(response.status).toBe(200);
    expect(text).toBeTruthy();

    // Assert - no references due to error
    const payload = data[0] as { references: unknown[] };
    expect(payload.references).toEqual([]);

    // Assert - streamText was still called (graceful degradation)
    expect(mockStreamText).toHaveBeenCalled();
  });
});
