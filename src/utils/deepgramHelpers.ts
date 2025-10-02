interface DeepgramTranscriptMessage {
  type: 'transcript';
  text: string;
  confidence: number;
  is_final: boolean;
  speech_final: boolean;
}

interface DeepgramMetadataMessage {
  type: 'metadata';
  data: unknown;
}

type DeepgramMessage = DeepgramTranscriptMessage | DeepgramMetadataMessage;

// Module-scoped variables for managing Deepgram connection state
let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let mediaStream: MediaStream | null = null;
let abortController: AbortController | null = null;
let isConnected = false;

export const isDeepgramModelLoaded = (): boolean => {
  return isConnected && audioContext !== null;
};

const DEEPGRAM_SAMPLE_RATE = 16000;
export const startDeepgramRecording = async (
  onTranscript: (transcript: string) => void,
  setIsRecording: (recording: boolean) => void
): Promise<void> => {
  try {
    // Get microphone access with Deepgram-optimized settings
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1,
        sampleRate: DEEPGRAM_SAMPLE_RATE
      }
    });

    // Create audio processing pipeline with AudioWorklet
    audioContext = new AudioContext({ sampleRate: DEEPGRAM_SAMPLE_RATE });

    // Load the AudioWorklet processor
    await audioContext.audioWorklet.addModule('/audio-processor.js');

    // Create the AudioWorklet node
    workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor');
    const source = audioContext.createMediaStreamSource(mediaStream);

    // Create a ReadableStream to send audio data to the server
    const audioStream = new ReadableStream({
      start(controller) {
        // Listen for audio data from the AudioWorklet processor
        if (workletNode) {
          workletNode.port.onmessage = (event) => {
            const pcmData: Int16Array = event.data;
            controller.enqueue(pcmData);
          };
        }
      },
      cancel() {
        // Stream cancelled - cleanup handled in stop function
        console.log('Audio stream cancelled');
      }
    });

    // Connect audio nodes (no need to connect to destination for capture-only)
    source.connect(workletNode);

    // Start audio processing
    await audioContext.resume();

    // Create abort controller for request cancellation
    abortController = new AbortController();

    // Connect to Deepgram API via Next.js proxy route
    const response = await fetch('/api/deepgram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: audioStream,
      signal: abortController.signal,
    });

    if (!response.ok) {
      // todo: where do we catch this?
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    isConnected = true;
    setIsRecording(true);

    // Process Server-Sent Events from the response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      // todo: where do we catch this?
      throw new Error('Response body is not readable');
    }

    // Read the streaming response
    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Deepgram stream ended');
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });

          // Parse Server-Sent Events format (data: {...}\n\n)
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const message: DeepgramMessage = JSON.parse(jsonStr);

                // Only process final transcripts to avoid duplication
                if (message.type === 'transcript' && message.is_final && message.text) {
                  onTranscript(message.text);
                }
              } catch (parseError) {
                console.error('Error parsing Deepgram message:', parseError);
              }
            }
          }
        }
      } catch (readError) {
        // Don't log errors if we intentionally aborted
        if (readError instanceof Error && readError.name !== 'AbortError') {
          console.error('Error reading Deepgram stream:', readError);
        }
      } finally {
        isConnected = false;
        setIsRecording(false);
      }
    };

    // Start reading the stream (don't await - let it run in background)
    readStream();

  } catch (error) {
    console.error('Failed to start Deepgram recording:', error);
    isConnected = false;
    setIsRecording(false);

    // Clean up any partially created resources
    stopDeepgramRecording();
  }
};

export const stopDeepgramRecording = (): void => {
  // Abort the fetch request (this closes the connection)
  if (abortController) {
    abortController.abort();
    abortController = null;
  }

  // Stop and close audio context
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  // Disconnect audio worklet node
  if (workletNode) {
    workletNode.disconnect();
    workletNode.port.close();
    workletNode = null;
  }

  // Stop all media stream tracks (releases microphone)
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // Mark as disconnected
  isConnected = false;
};
