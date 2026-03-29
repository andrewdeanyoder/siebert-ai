# Plan: Expose RAG Pipeline as an AI Tool

## Context

Currently, the RAG pipeline runs unconditionally before every AI call: `retrieveRelevantChunks` is invoked with the last user message, and the results are injected as a system message into the `generateText` call. This means retrieval always fires, even for greetings or non-A&P messages.

The goal is to expose RAG as an AI SDK tool (`searchCourseContent`) so the model decides when to retrieve course materials, with the system prompt directing it to call the tool whenever explaining A&P concepts. This gives the model control over retrieval and avoids unnecessary DB calls.

## Files to Modify

1. `package.json` — upgrade AI SDK
2. `src/db/queries.ts` — new file: extracted DB query helpers
3. `src/lib/rag/retrieval.ts` — use new DB helpers
4. `src/app/api/chat/route.ts` — core logic
5. `src/app/prompts.ts` — system prompt addition
6. `tests/integration/chat-rag.test.ts` — test rewrite

## Implementation

### 1. `package.json`

Upgrade the AI SDK packages:

```bash
pnpm add ai@^5 @ai-sdk/openai@^1
```

### 2. `src/app/api/chat/route.ts`

Add `tool` and `stepCountIs` to the `ai` import and add `zod`:

```typescript
import { generateText, tool, stepCountIs } from "ai";
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
  inputSchema: z.object({
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
  stopWhen: stepCountIs(2),
});

const references: Reference[] = chunksToReferences(retrievedChunks);
```

The `references` and `ragError` response fields stay unchanged.

**Design notes:**
- Closure capture: `retrievedChunks` and `ragError` are declared in the outer `POST` scope and mutated inside the tool's `execute`. After `generateText` resolves (all steps complete), the outer scope reads the captured values.
- `stopWhen: stepCountIs(2)`: Step 1 = model calls the tool; Step 2 = model generates the final response using the tool result. Equivalent to the v4 `maxSteps: 2`.
- Graceful degradation preserved: the tool catches its own errors internally and never throws, so `generateText` always completes.

### 2. `src/app/prompts.ts`

Add one bullet to the `### Special Notes` section (after the "Foster metacognitive awareness" line, before the closing backtick):

```
- **Course material search**: You have access to a \`searchCourseContent\` tool that searches uploaded course materials. Call it whenever a student asks about an A&P concept, term, structure, or process. Do not mention the tool to the student.
```

### 3. `src/db/queries.ts` (new file)

Extract the two DB query blocks from `retrieval.ts` into named helpers:

```typescript
// Wraps lines 28-47 of retrieval.ts
export async function querySimilarChunks(queryEmbedding: number[]): Promise<...> { ... }

// Wraps lines 58-69 of retrieval.ts
export async function queryTopChunksForDebug(queryEmbedding: number[]): Promise<...> { ... }
```

### 4. `src/lib/rag/retrieval.ts`

Replace the inline DB query blocks with calls to the new helpers from `#/db/queries`.

### 5. `tests/integration/chat-rag.test.ts`

Mock at the `#/db/queries` level — the DB helpers are replaced, while `retrieveRelevantChunks` runs for real. `embed` must still be mocked since it calls OpenAI; keep `mockEmbed`/`mockEmbedding` in the hoisted block and `vi.mock("ai", ...)` as before.

Key changes:
- Remove all DB chain mocks and `mockEmbed`/`mockEmbedding` from hoisted block
- Add `mockQuerySimilarChunks` and `mockQueryTopChunksForDebug` to the hoisted block
- Add `vi.mock("#/db/queries", ...)` with those mocks
- Add `tool: (t) => t` to the `ai` mock (it's a pass-through in the real SDK)
- In tests that verify chunk/reference behavior, use `mockGenerateText.mockImplementation` to simulate the model calling the tool — this exercises the closure capture path:

```typescript
mockGenerateText.mockImplementation(async ({ tools }) => {
  await tools.searchCourseContent.execute({ query: "How many chambers does the heart have?" });
  return { text: "The heart has four chambers..." };
});
```

- The graceful degradation test: `mockQuerySimilarChunks.mockRejectedValue(new Error(...))`, assert `data.ragError` is set and `data.references` is empty.
- Add a structural test asserting `generateText` is called with `tools` containing `searchCourseContent` and `stopWhen: stepCountIs(2)`.
- Remove the "sort chunks by relevance and limit to MAX_RETRIEVAL_CHUNKS" test — that behavior lives in `retrieval.ts` and belongs in a unit test there, not the route integration test.

## Verification

1. Write failing tests first, then implement
2. `pnpm test` — all tests pass
3. `pnpm types` — no TypeScript errors
4. `pnpm lint` — no lint errors
5. Manual smoke test: send a chat message about a cardiac concept → tool fires, response includes references; send a greeting → no crash
