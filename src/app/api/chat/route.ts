import { Message, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "../../prompts";
// import { getContext } from "@/utils/context";

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
    console.log('messages', SYSTEM_PROMPT, messages);

    // Ask OpenAI for a complete chat completion given the prompt
    const response = await generateText({
      model: openai("gpt-4o"),
      messages: [
        SYSTEM_PROMPT,
        // todo: why only send user messages?
        ...messages.filter((message: Message) => message.role === "user"),
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