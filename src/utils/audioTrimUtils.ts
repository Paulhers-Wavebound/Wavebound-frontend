/**
 * Downsample an AudioBuffer to a fixed number of peak values for waveform rendering.
 */
export function getWaveformPeaks(buffer: AudioBuffer, numBars: number): number[] {
  const channelData = buffer.getChannelData(0);
  const samplesPerBar = Math.floor(channelData.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < numBars; i++) {
    let max = 0;
    const offset = i * samplesPerBar;
    for (let j = 0; j < samplesPerBar; j++) {
      const abs = Math.abs(channelData[offset + j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  return peaks;
}

/**
 * Extract a segment from an AudioBuffer and return it as a WAV File.
 */
export function extractAudioSegment(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number,
  originalName: string
): File {
  const sampleRate = buffer.sampleRate;
  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const startSample = Math.floor(startSec * sampleRate);
  const endSample = Math.min(Math.floor(endSec * sampleRate), buffer.length);
  const numSamples = endSample - startSample;

  // Interleave channels into Int16
  const int16Length = numSamples * numChannels;
  const int16 = new Int16Array(int16Length);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][startSample + i]));
      int16[i * numChannels + c] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  // Build WAV
  const dataSize = int16.length * 2;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
  view.setUint16(32, numChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const output = new Int16Array(wavBuffer, 44);
  output.set(int16);

  const baseName = originalName.replace(/\.[^.]+$/, '');
  return new File([wavBuffer], `${baseName}_trimmed.wav`, { type: 'audio/wav' });
}

/**
 * Format seconds to M:SS string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
