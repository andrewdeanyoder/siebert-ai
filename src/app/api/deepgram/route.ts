import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Initialize Deepgram WebSocket connection
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

    const connection = deepgram.listen.live({
      model: 'nova-3',
      language: 'en-US',
      smart_format: true
    });

    // Set up WebSocket event handlers
    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened');
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error:', error);
    });

    // Create a response stream to handle bidirectional communication
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Handle incoming audio data from client
        if (request.body) {
          try {
            const reader = request.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Send audio data to Deepgram
              connection.send(value.buffer);
            }
          } catch (error) {
            console.error('Error reading request body:', error);
          }
        }

        // Handle transcription results from Deepgram
        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          try {
            const transcript = data.channel.alternatives[0]?.transcript;
            if (transcript) {
              const message = JSON.stringify({
                type: 'transcript',
                text: transcript,
                confidence: data.channel.alternatives[0]?.confidence,
                is_final: data.is_final,
                speech_final: data.speech_final
              });

              controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            }
          } catch (error) {
            console.error('Error processing transcript:', error);
          }
        });

        connection.on(LiveTranscriptionEvents.Metadata, (data) => {
          try {
            const message = JSON.stringify({
              type: 'metadata',
              data: data
            });

            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          } catch (error) {
            console.error('Error processing metadata:', error);
          }
        });
      },

      cancel() {
        // Handle connection cleanup
        connection.requestClose();
        console.log('Deepgram connection cleaned up');
      }
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Deepgram API route error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
