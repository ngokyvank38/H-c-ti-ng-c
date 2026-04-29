
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const playBase64Audio = async (base64Data: string, sampleRate: number = 24000) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Stop any current playback
    if (currentSource) {
      currentSource.stop();
      currentSource = null;
    }

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Int16Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      // Assuming 16-bit PCM Little Endian
      bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
    }

    // Convert Int16 PCM to Float32 [-1, 1] for AudioContext
    const float32Data = new Float32Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      float32Data[i] = bytes[i] / 32768.0;
    }

    const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    currentSource = source;

    return new Promise<void>((resolve) => {
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null;
        }
        resolve();
      };
      source.start();
    });
  } catch (error) {
    console.error("Error playing audio:", error);
    throw error;
  }
};

export const stopAudio = () => {
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }
};
