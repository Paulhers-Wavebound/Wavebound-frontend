export interface ExtractedVideo {
  url: string;
  description: string;
  stats: string;
}

/**
 * Extract TikTok video references from assistant markdown text.
 * Matches: **description** ([Watch on TikTok](URL)) — stats
 */
export function extractTikTokVideos(text: string): ExtractedVideo[] {
  const videos: ExtractedVideo[] = [];
  const regex = /\*\*([^*]+)\*\*\s*\(\[Watch on TikTok\]\((https:\/\/www\.tiktok\.com\/[^)]+)\)\)\s*[—–-]?\s*([^\n]*)/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    videos.push({
      url: match[2],
      description: match[1].trim(),
      stats: match[3].trim(),
    });
  }

  // Second pass: catch bare TikTok video URLs not already captured
  const bareUrlRegex = /https:\/\/www\.tiktok\.com\/@[\w.]+\/video\/\d+/g;
  let bareMatch;
  while ((bareMatch = bareUrlRegex.exec(text)) !== null) {
    const url = bareMatch[0];
    if (!videos.some(v => v.url === url)) {
      videos.push({ url, description: '', stats: '' });
    }
  }

  return videos;
}
