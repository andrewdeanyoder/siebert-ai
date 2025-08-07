import { Message, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
// import { getContext } from "@/utils/context";

export async function POST(req: Request) {
  console.log('chat route hit');
  try {
    const { messages } = await req.json();
    console.log('chat route messages', messages);

    // todo: export to another file
    // todo: update prompt
    const prompt = [
      {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      `,
      },
    ];

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        ...prompt,
        // todo: why only send user messages?
        ...messages.filter((message: Message) => message.role === "user"),
      ],
    });
    console.log('chat route response', response);
    // Convert the response into a friendly text-stream
    const stream = response.toDataStreamResponse();
    console.log('chat route stream', stream);
    return stream;
  } catch (e) {
    console.error('error in chat route', e);
    throw e;
  }
}