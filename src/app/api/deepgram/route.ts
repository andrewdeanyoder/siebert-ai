import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client for authentication (only if env vars are available)
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    if (!supabase) {
      return new Response('Server configuration error', { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify the session token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Initialize Deepgram WebSocket connection
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

    const connection = deepgram.listen.live({
      model: 'nova-3',
      language: 'en-US',
      smart_format: true
    });

    // 3. Set up WebSocket event handlers
    connection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened');
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('Deepgram connection closed');
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error:', error);
    });

    // 4. Create a response stream to handle bidirectional communication
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
        // 5. Handle connection cleanup
        connection.finish();
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

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
