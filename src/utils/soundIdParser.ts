/** Extract the numeric sound_id from a TikTok music URL. */
export function extractSoundId(input: string): string | null {
  const musicPath = input.match(/\/music\/([^/?#]+)/);
  if (musicPath) {
    const trailingDigits = musicPath[1].match(/(\d+)$/);
    if (trailingDigits) return trailingDigits[1];
  }
  return null;
}
