import React from "react";
import { ExternalLink } from "lucide-react";

const MUSIC_ID_PATTERN = /\(music[_ ]?id:\s*(\d{15,25})\)/gi;

const tiktokMusicUrl = (musicId: string) =>
  `https://www.tiktok.com/music/sound-${musicId}`;

/**
 * Render brief text where AI-embedded "(music_id: <id>)" mentions become
 * compact clickable TikTok-sound links instead of long raw IDs.
 */
export function renderBriefText(
  text: string | null | undefined,
): React.ReactNode {
  if (!text) return text ?? null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  MUSIC_ID_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MUSIC_ID_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const musicId = match[1];
    parts.push(
      <a
        key={`music-${match.index}-${musicId}`}
        href={tiktokMusicUrl(musicId)}
        target="_blank"
        rel="noopener noreferrer"
        title={`Open TikTok sound ${musicId}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center align-baseline gap-0.5 px-1 py-[1px] rounded text-[#e8430a] hover:text-[#e8430a] hover:bg-[#e8430a]/10 transition-colors no-underline"
      >
        <ExternalLink size={11} aria-hidden />
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}
