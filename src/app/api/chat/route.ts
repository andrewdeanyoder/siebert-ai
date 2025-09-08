import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "../../prompts";
import { MODEL } from "../../../lib/constants";

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

    // Ask OpenAI for a complete chat completion given the prompt
    const response = await generateText({
      model: openai(MODEL),
      messages: [
        SYSTEM_PROMPT,
        ...messages,
      ],
    });

    // Return the complete response as JSON
    return Response.json({
      id: Date.now().toString(),
      role: "assistant",
      content: response.text
    });
  } catch (e) {
    console.error('error in chat route', e);
    return Response.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}