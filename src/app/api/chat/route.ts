import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
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
