import type { FanBrief, PeakEvidence } from "@/types/fanBriefs";

export type VenueKey =
  | "grammys"
  | "tiny_desk"
  | "fallon"
  | "kimmel"
  | "colbert"
  | "live_lounge"
  | "snl"
  | "coachella"
  | "amas"
  | "vmas"
  | "colors"
  | "vevo"
  | "official"
  | "other";

export interface VenueStyle {
  bg: string;
  color: string;
  label: string;
}

/**
 * Muted palette per the design-system rule: venue chips should not compete
 * with the emerald confidence score or the burn-orange accent.
 */
export const VENUE_STYLES: Record<VenueKey, VenueStyle> = {
  grammys: { bg: "rgba(191,149,63,0.14)", color: "#BF953F", label: "Grammys" },
  tiny_desk: {
    bg: "rgba(201,107,63,0.14)",
    color: "#C96B3F",
    label: "Tiny Desk",
  },
  fallon: { bg: "rgba(102,104,181,0.16)", color: "#6668B5", label: "Fallon" },
  kimmel: { bg: "rgba(68,156,166,0.16)", color: "#449CA6", label: "Kimmel" },
  colbert: { bg: "rgba(62,144,101,0.16)", color: "#3E9065", label: "Colbert" },
  live_lounge: {
    bg: "rgba(225,118,105,0.16)",
    color: "#E17669",
    label: "Live Lounge",
  },
  snl: { bg: "rgba(192,72,72,0.16)", color: "#C04848", label: "SNL" },
  coachella: {
    bg: "rgba(200,130,150,0.16)",
    color: "#C88296",
    label: "Coachella",
  },
  amas: { bg: "rgba(150,120,180,0.16)", color: "#9678B4", label: "AMAs" },
  vmas: { bg: "rgba(170,110,160,0.16)", color: "#AA6EA0", label: "VMAs" },
  colors: { bg: "rgba(120,170,140,0.16)", color: "#78AA8C", label: "COLORS" },
  vevo: { bg: "rgba(255,140,50,0.16)", color: "#FF8C32", label: "VEVO" },
  official: {
    bg: "rgba(120,120,140,0.16)",
    color: "#8A8A9A",
    label: "Official Channel",
  },
  other: { bg: "rgba(120,120,128,0.16)", color: "#8A8A92", label: "Live" },
};

/**
 * Derive a canonical venue key from the DB live_venue value + the video title.
 * Many official-channel uploads have live_venue='official_channel' and the
 * actual venue (Grammys, Coachella) is only inferrable from the title.
 */
export function deriveVenue(
  liveVenue: string | null | undefined,
  title: string | null | undefined,
): VenueKey {
  const text = `${liveVenue ?? ""} ${title ?? ""}`;
  if (/grammy/i.test(text)) return "grammys";
  if (/tiny desk|npr music/i.test(text)) return "tiny_desk";
  if (/fallon|tonight show/i.test(text)) return "fallon";
  if (/kimmel/i.test(text)) return "kimmel";
  if (/colbert|late show/i.test(text)) return "colbert";
  if (/live lounge|bbc radio ?1/i.test(text)) return "live_lounge";
  if (/\bsnl\b|saturday night live/i.test(text)) return "snl";
  if (/coachella/i.test(text)) return "coachella";
  if (/\bamas?\b|american music award/i.test(text)) return "amas";
  if (/\bvmas?\b|mtv.*award/i.test(text)) return "vmas";
  if (/\bcolors\b/i.test(text)) return "colors";
  if (/\bvevo\b/i.test(text)) return "vevo";
  if (liveVenue === "official_channel") return "official";
  return "other";
}

export function venueFromBrief(brief: FanBrief): VenueKey {
  return deriveVenue(
    brief.content_segments?.content_catalog?.live_venue,
    brief.content_segments?.content_catalog?.title ?? brief.source_title,
  );
}

/**
 * A brief is considered live when fan_briefs.content_type says so, OR when
 * the joined segment has peak_evidence (the authoritative upstream signal).
 * The OR fallback matters because older rows may not have fan_briefs.content_type
 * backfilled even after the migration.
 */
export function isLiveBrief(brief: FanBrief): boolean {
  if (brief.content_type === "live_performance") return true;
  const evidence = brief.content_segments?.peak_evidence;
  return !!evidence && Array.isArray(evidence.top_comments);
}

export function peakEvidenceOf(brief: FanBrief): PeakEvidence | null {
  const ev = brief.content_segments?.peak_evidence;
  if (!ev || !Array.isArray((ev as PeakEvidence).top_comments)) return null;
  return ev;
}

/**
 * Transform a raw fan-comment string into a 60-char hook candidate.
 * Preserves fan voice — no sentence-casing, emoji, or re-punctuation.
 * Strips YouTube timestamps ("2:35", "3:12-3:30", "1:24:05") and dangling
 * "at" / "@" artifacts that read weirdly as on-screen text.
 */
export function truncateFanComment(raw: string): string {
  if (!raw) return "";
  let s = raw.replace(/[\r\n\t]+/g, " ").trim();
  // Strip timestamps — single or ranged (e.g. "2:35-2:50", "1:24:05")
  s = s
    .replace(
      /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*[–-]\s*\d{1,2}:\d{2}(?::\d{2})?)?\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
  // Trim dangling "at " / "@" / leftover connector punctuation
  s = s
    .replace(/[\s@]*\bat\b\s*$/i, "")
    .replace(/[\s@,;:\-–]+$/, "")
    .trim();
  if (s.length === 0) return "";
  if (s.length <= 60) return s;
  // Word-boundary truncate ≤ 60 chars
  const cut = s.slice(0, 60);
  const lastSpace = cut.lastIndexOf(" ");
  const chunk = lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
  return chunk.replace(/[\s@,;:\-–.]+$/, "").trim() + "…";
}

/**
 * Returns true when the brief's current modified_hook looks like it was
 * produced from one of the peak_evidence top_comments via truncateFanComment.
 * Used to render the "✍️ edited from fan comment" marker after a reload.
 */
export function hookCameFromFanComment(brief: FanBrief): boolean {
  if (!brief.modified_hook) return false;
  const ev = peakEvidenceOf(brief);
  if (!ev) return false;
  return ev.top_comments.some(
    (c) => truncateFanComment(c.content) === brief.modified_hook,
  );
}
