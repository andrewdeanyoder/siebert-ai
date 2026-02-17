# RAG Pipeline Implementation Plan

## Overview
Add Retrieval-Augmented Generation (RAG) to the Siebert Science AI chatbot, enabling the tutor to reference anatomy and physiology course materials.

## Decisions Made
- **Storage**: Supabase Storage for original files
- **Formats**: PDFs and text files only (images later)
- **Chunking**: Semantic (paragraphs/sections with page/line tracking)
- **Embeddings**: text-embedding-3-small (configurable in constants.ts)
- **Admin**: CLI script only
- **Access**: All authenticated users see all documents

---

## Database Schema (Drizzle + pgvector)

**documents table:**
- `id`, `filename`, `originalName`, `storagePath`, `mimeType`, `fileSize`, `uploadedAt`, `uploadedBy`

**chunks table:**
- `id`, `documentId` (FK), `content`, `embedding` (vector 1536), `chunkIndex`, `pageNumber`, `lineStart`, `lineEnd`, `metadata` (jsonb), `createdAt`

---

## Files to Create

| File | Purpose | Flow | Unit Tested |
|------|---------|------|------|
| `src/db/schema.ts` | Drizzle schema definitions | Setup | No |
| `src/db/index.ts` | Drizzle client initialization | Setup | No |
| `drizzle.config.ts` | Drizzle configuration | Setup | No |
| `src/lib/rag/types.ts` | TypeScript interfaces | Setup | No |
| `src/lib/rag/embeddings.ts` | OpenAI embedding generation | Ingestion, Retrieval |
| `src/lib/rag/chunking.ts` | Semantic chunking logic | Ingestion | Yes, part of injestion |
| `scripts/ingest.ts` | CLI ingestion script | Ingestion | Yes, part of injestion |
| `src/lib/rag/retrieval.ts` | Vector similarity search | Retrieval | Yes |
| `src/lib/rag/context.ts` | Context formatting for chat | Retrieval | Yes |
| `src/components/References.tsx` | Collapsible references UI | UI | Yes |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/constants.ts` | Add `EMBEDDING_MODEL`, `SIMILARITY_THRESHOLD`, `MAX_CHUNKS` |
| `src/app/api/chat/route.ts` | Add retrieval, inject context, return references |
| `src/lib/http/submitMessages.ts` | Handle references in response |
| `src/components/Messages.tsx` | Display References component |

---

## Dependencies to Add

```
drizzle-orm, pg, drizzle-kit, @types/pg, pdf-parse, tsx
```

---

## Implementation Phases

### Phase 1: Database Foundation DONE
1. Install Drizzle ORM dependencies
2. Create `drizzle.config.ts` and `src/db/schema.ts`
3. Enable pgvector extension in Supabase: `create extension if not exists vector;`
4. Run `pnpm drizzle-kit push` to create tables
5. Create Supabase Storage bucket for documents

### Phase 2: Ingestion CLI (TDD) DONE
1. Implement types in `src/lib/rag/types.ts`
2. Write a basic integration test for the ingestion pipeline that mocks only external dependencies and an empty `scripts/ingest.ts`.
3. Implement parsing logic in `parse.ts` using TDD.
4. Implement chunking logic in `chunking.ts` using TDD.
5. Implement embedding logic in `embeddings.ts` using TDD.
6. Print "OOOOGA, halfway there!" to the console.
7. Implement parse → chunk → embed → upload in `scripts/ingest.ts` to Supabase. Write failing tests and assertions first in the integration test file, then make them pass. Iterate until all tests pass.
8. Look for ways to refactor the code to reduce duplicate logic.
9. Reread the entire implementation. Look for ways to tighten up the code and deduplicate logic.
10. Add script: `"ingest": "tsx scripts/ingest.ts"`.
11. Print "OOOOOOOGA, ALL DONE!" to the console.

### Phase 3: Chat Integration (TDD) DONE
1. Write integration tests for chat with RAG (mocking OpenAI, Supabase)
2. Implement `retrieval.ts`, `context.ts`
3. Modify `/api/chat/route.ts`:
   - Retrieve relevant chunks for user query
   - Inject context as system message (after SYSTEM_PROMPT, before conversation)
   - Return references array with response
4. Iterate until tests pass

### Phase 4: References UI (TDD) DONE
1. Write a component test for `Messages.tsx` which asserts on the already implemented functionality. Make sure the test passes. DONE
2. Add assertions for the newly planned References functionality. Make sure only the new assertions fail (Red version of TDD) DONE
2. Create `src/components/References.tsx` (collapsible) DONE
3. Update `Messages.tsx` to render References for assistant messages DONE
4. Update Message type to include optional references DONE
5. Iterate until tests pass DONE

### Phase 5: Iterate
1. Reformat each markdown to include proper headings
2. Add similarity score to references
2. If no references are returned, send the top 3 chunks
3. If an error occurs, send that error in References property

### Phase 6: Admin Debugging Information
Provide detailed RAG operation visibility for admin users. Currently, RAG failures are silent (logged server-side only, UI receives empty references array indistinguishable from "no matches").

**Potential use cases (to be brainstormed):**
- RAG operation status (success, error, no matches)
- Error messages when retrieval fails
- Similarity scores for returned chunks
- Query embedding latency
- Database query latency
- Number of chunks searched vs returned
- Threshold/limit values used

**Implementation considerations (to be determined):**
- How to identify admin users
- Where to display debug info (UI panel, console, separate endpoint)
- Whether to persist debug logs
- Performance impact of collecting metrics

### Phase 6: Cleanup
- Check whether lint and types are running on the integration test files.
- Review tested use cases in Phase 4 & 5. Tighten up or add assertions, if necessary.

---

## Context Injection Strategy

Inject retrieved context as a separate system message **after** the main SYSTEM_PROMPT but **before** the conversation. This preserves the tutor's teaching methodology while providing reference material.

```typescript
messages: [
  SYSTEM_PROMPT,
  ...(chunks.length > 0 ? [{ role: "system", content: contextMessage }] : []),
  ...conversationMessages,
]
```

---

## Constants to Add (`src/lib/constants.ts`)

```typescript
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const SIMILARITY_THRESHOLD = 0.7;
export const MAX_RETRIEVAL_CHUNKS = 5;
```

---

## Unit Testing Strategy

Integration-style unit tests that test entire code flows, mocking only external services.

### Test: Ingestion Pipeline
**Files under test:** `scripts/ingest.ts`, `chunking.ts`, `embeddings.ts`
**Mocks:** OpenAI embeddings API, Supabase Storage, Supabase database
**Test cases:**
- PDF file → parsed → chunked semantically → embeddings generated → stored in DB
- Text file → parsed with line numbers → chunked → embeddings generated → stored
- Invalid file type → rejected with error
- Empty file → handled gracefully

### Test: Chat with RAG (Retrieval + Response)
**Files under test:** `src/app/api/chat/route.ts`, `retrieval.ts`, `embeddings.ts`, `context.ts`
**Mocks:** OpenAI (embeddings + chat), Supabase database (pgvector query)
**Test cases:**
- Message sent → query embedded → similar chunks retrieved → context injected → response includes references
- No matching chunks (below threshold) → chat works normally without references
- Multiple relevant chunks → sorted by relevance, limited to MAX_CHUNKS, all included in references
- Retrieval error → chat degrades gracefully (works without RAG)

### Test: Messages with References
**Files under test:** `src/components/Messages.tsx`, `src/components/References.tsx`
**Mocks:** None (pure UI components)
**Test cases:**
- Assistant message with references → renders "References" toggle below message content
- Assistant message without references → no References section rendered
- References section collapsed by default, shows count (e.g., "3 sources")
- Clicking toggle expands to show list of references
- Each reference displays: document name, page number (if available), line range (if available)
- Clicking a reference shows the source snippet
- Multiple assistant messages each render their own independent References section

---

## Verification

- `pnpm types` - no TypeScript errors
- `pnpm lint` - no linting errors
- `pnpm test:run` - all tests pass
- `pnpm build` - successful build
- Manual test: ingest a document, ask a related question, verify references appear

---

## Critical Files
- `src/app/api/chat/route.ts` - context injection point
- `src/lib/constants.ts` - configuration
- `src/components/Messages.tsx` - references display
- `src/app/prompts.ts` - DO NOT MODIFY (critical system prompt)
