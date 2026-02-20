# Plan: Expose RAG Pipeline as an AI Tool

## Context

Currently, the RAG pipeline runs unconditionally before every AI call: `retrieveRelevantChunks` is invoked with the last user message, and the results are injected as a system message into the `generateText` call. This means retrieval always fires, even for greetings or non-A&P messages.

The goal is to expose RAG as an AI SDK tool (`searchCourseContent`) so the model decides when to retrieve course materials, with the system prompt directing it to call the tool whenever explaining A&P concepts. This gives the model control over retrieval and avoids unnecessary DB calls.

## Files to Modify

1. `src/app/api/chat/route.ts` — core logic
2. `src/app/prompts.ts` — system prompt addition
3. `tests/integration/chat-rag.test.ts` — test rewrite

## Implementation

### 1. `src/app/api/chat/route.ts`

Add `tool` to the `ai` import and add `zod`:

```typescript
import { generateText, tool } from "ai";
import { z } from "zod";
```

Remove lines 23–55 (lastUserMessage extraction, RAG retrieval, context injection, messagesWithContext).

Replace with a tool definition using a closure to capture chunks for reference generation:

```typescript
let retrievedChunks: RetrievedChunk[] = [];
let ragError: RagError | undefined;

const searchCourseContent = tool({
  description:
    "Search the course materials for content relevant to the student's question. Call this tool whenever the student asks about an A&P concept, term, structure, or process.",
  parameters: z.object({
    query: z.string().describe("Search query based on the student's question"),
  }),
  execute: async ({ query }) => {
    console.log("[CHAT] Tool: searchCourseContent called with query:", query.substring(0, 100));
    try {
      retrievedChunks = await retrieveRelevantChunks(query);
      console.log("[CHAT] Tool: retrieved", retrievedChunks.length, "chunks");
      const contextMessage = formatContextMessage(retrievedChunks);
      return contextMessage || "No relevant course materials found for this query.";
    } catch (error) {
      console.error("[CHAT] Tool: retrieval failed:", error);
      ragError = {
        message: error instanceof Error ? error.message : String(error),
      };
      return "Course material search is temporarily unavailable.";
    }
  },
});

const response = await generateText({
  model: openai(MODEL),
  messages: [SYSTEM_PROMPT, ...messages],
  tools: { searchCourseContent },
  maxSteps: 2,
});

const references: Reference[] = chunksToReferences(retrievedChunks);
```

The `references` and `ragError` response fields stay unchanged.

**Design notes:**
- Closure capture: `retrievedChunks` and `ragError` are declared in the outer `POST` scope and mutated inside the tool's `execute`. After `generateText` resolves (all steps complete), the outer scope reads the captured values.
- `maxSteps: 2`: Step 1 = model calls the tool; Step 2 = model generates the final response using the tool result.
- Graceful degradation preserved: the tool catches its own errors internally and never throws, so `generateText` always completes.

### 2. `src/app/prompts.ts`

Add one bullet to the `### Special Notes` section (after the "Foster metacognitive awareness" line, before the closing backtick):

```
- **Course material search**: You have access to a \`searchCourseContent\` tool that searches uploaded course materials. Call it whenever a student asks about an A&P concept, term, structure, or process. Do not mention the tool to the student.
```

### 3. `tests/integration/chat-rag.test.ts`

The current tests mock the full DB chain (select → from → innerJoin → where → orderBy → limit) plus `embed`. With the tool approach, mock at `retrieveRelevantChunks` directly — much simpler.

Key changes:
- Remove all DB chain mocks and `mockEmbed`/`mockEmbedding` from hoisted block
- Add `mockRetrieveRelevantChunks` to the hoisted block
- Add `vi.mock("#/lib/rag/retrieval", ...)` with `mockRetrieveRelevantChunks`
- Add `tool: (t) => t` to the `ai` mock (it's a pass-through in the real SDK)
- In tests that verify chunk/reference behavior, use `mockGenerateText.mockImplementation` to simulate the model calling the tool — this exercises the closure capture path:

```typescript
mockGenerateText.mockImplementation(async ({ tools }) => {
  await tools.searchCourseContent.execute({ query: "How many chambers does the heart have?" });
  return { text: "The heart has four chambers..." };
});
```

- The graceful degradation test: `mockRetrieveRelevantChunks.mockRejectedValue(new Error(...))`, assert `data.ragError` is set and `data.references` is empty.
- Add a structural test asserting `generateText` is called with `tools` containing `searchCourseContent` and `maxSteps: 2`.
- Remove the "sort chunks by relevance and limit to MAX_RETRIEVAL_CHUNKS" test — that behavior lives in `retrieval.ts` and belongs in a unit test there, not the route integration test.

## Verification

1. Write failing tests first, then implement
2. `pnpm test` — all tests pass
3. `pnpm types` — no TypeScript errors
4. `pnpm lint` — no lint errors
5. Manual smoke test: send a chat message about a cardiac concept → tool fires, response includes references; send a greeting → no crash
