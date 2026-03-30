import lamejs from '@breezystack/lamejs';

const MAX_DIRECT_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Returns true if the file needs compression before upload.
 */
export function needsCompression(file: File): boolean {
  const isMp3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
  return !(isMp3 && file.size <= MAX_DIRECT_UPLOAD_SIZE);
}

/**
 * Compress any browser-supported audio file to MP3 in-browser.
 * Uses Web Audio API to decode + lamejs to encode.
 */
export async function compressAudioToMp3(
  file: File,
  bitrate: number = 192
): Promise<File> {
  // 1. Decode audio to raw PCM via Web Audio API
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = Math.min(audioBuffer.numberOfChannels, 2); // stereo max

  // 2. Extract PCM samples as Int16
  const left = float32ToInt16(audioBuffer.getChannelData(0));
  const right = numChannels === 2
    ? float32ToInt16(audioBuffer.getChannelData(1))
    : left;

  // 3. Encode to MP3 using lamejs
  const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate);
  const mp3Chunks: Int8Array[] = [];
  const frameSize = 1152;

  for (let i = 0; i < left.length; i += frameSize) {
    const leftChunk = left.subarray(i, i + frameSize);
    const rightChunk = right.subarray(i, i + frameSize);

    const mp3buf = numChannels === 1
      ? mp3Encoder.encodeBuffer(leftChunk)
      : mp3Encoder.encodeBuffer(leftChunk, rightChunk);

    if (mp3buf.length > 0) {
      mp3Chunks.push(new Int8Array(mp3buf));
    }
  }

  const finalBuf = mp3Encoder.flush();
  if (finalBuf.length > 0) {
    mp3Chunks.push(new Int8Array(finalBuf));
  }

  // 4. Build output File
  const mp3Blob = new Blob(mp3Chunks.map(c => c.buffer as ArrayBuffer), { type: 'audio/mpeg' });
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([mp3Blob], `${baseName}.mp3`, { type: 'audio/mpeg' });
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}
