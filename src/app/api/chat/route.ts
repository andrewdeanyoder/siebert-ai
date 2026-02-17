import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "../../prompts";
import { MODEL } from "../../../lib/constants";
import { retrieveRelevantChunks } from "#/lib/rag/retrieval";
import { formatContextMessage, chunksToReferences } from "#/lib/rag/context";
import type { RagError, Reference, RetrievedChunk } from "#/lib/rag/types";

export async function POST(req: Request) {
  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not configured');
    return Response.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    // Get the latest user message for RAG retrieval
    // todo: this will get inefficient in long conversations; why not just use a reversed for loop?
    const lastUserMessage = [...messages].reverse().find(
      (m: { role: string }) => m.role === "user"
    );

    // Retrieve relevant chunks (gracefully degrade on error)
    let relevantChunks: RetrievedChunk[] = [];
    let references: Reference[] = [];
    let ragError: RagError | undefined;

    if (lastUserMessage?.content) {
      console.log("[CHAT] Starting RAG retrieval for user message:", lastUserMessage.content.substring(0, 100));
      try {
        relevantChunks = await retrieveRelevantChunks(lastUserMessage.content);
        references = chunksToReferences(relevantChunks);
        console.log("[CHAT] RAG retrieval complete. Chunks:", relevantChunks.length, "References:", references.length);
      } catch (error) {
        console.error('RAG retrieval failed, continuing without context:', error);
        ragError = {
          message: error instanceof Error ? error.message : String(error),
        };
      }
    } else {
      console.log("[CHAT] No user message found for RAG retrieval");
    }

    // Build messages with optional context injection
    const contextMessage = formatContextMessage(relevantChunks);
    const messagesWithContext = [
      SYSTEM_PROMPT,
      ...(contextMessage ? [{ role: "system" as const, content: contextMessage }] : []),
      ...messages,
    ];

    // Ask OpenAI for a complete chat completion given the prompt
    const response = await generateText({
      model: openai(MODEL),
      messages: messagesWithContext,
    });

    // Return the complete response as JSON with references
    return Response.json({
      id: Date.now().toString(),
      role: "assistant",
      content: response.text,
      references,
      ...(ragError && { ragError }),
    });
  } catch (e) {
    console.error('error in chat route', e);
    return Response.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}