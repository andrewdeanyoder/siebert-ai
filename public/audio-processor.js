// AudioWorklet processor for capturing and converting audio to PCM
class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];

    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0];

    // Convert Float32Array to Int16Array (PCM format)
    const pcmData = new Int16Array(inputChannel.length);
    for (let i = 0; i < inputChannel.length; i++) {
      const sample = inputChannel[i] ?? 0; // isn't this a bug? can inputChannel[i] be undefined or null,
      const s = Math.max(-1, Math.min(1, sample));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Send PCM data to the main thread
    this.port.postMessage(pcmData);

    return true; // Keep processor alive
  }
}

// todo: 'audio-capture-processor' is used elsewhere. Make a constant
registerProcessor('audio-capture-processor', AudioCaptureProcessor);
