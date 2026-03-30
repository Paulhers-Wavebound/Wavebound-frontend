import { Mic2, Music, Guitar, Disc3, PenLine, Bot } from "lucide-react";

// ── Creator Roles ──────────────────────────────────────────────────────────────

export const CREATOR_ROLES = [
  { id: "singer", label: "Singer / Vocalist", icon: Mic2, description: "I sing or do vocal covers" },
  { id: "rapper", label: "Rapper / MC", icon: Music, description: "I rap or freestyle" },
  { id: "rock", label: "Rock / Band", icon: Guitar, description: "I play in a band or make rock music" },
  { id: "producer-dj", label: "Producer / DJ", icon: Disc3, description: "I make beats or mix music" },
  { id: "singer-songwriter", label: "Singer-Songwriter", icon: PenLine, description: "I write and perform my own songs" },
  { id: "ai-music", label: "AI Music", icon: Bot, description: "I create music with AI tools" },
] as const;

export type CreatorRoleId = (typeof CREATOR_ROLES)[number]["id"];

// ── Role → Genre Suggestions ───────────────────────────────────────────────────

export const ROLE_GENRE_SUGGESTIONS: Record<string, string[]> = {
  singer: ["Pop", "R&B", "Soul", "Indie-pop", "Hip Hop", "Alternative", "Ballad", "Latin", "Afrobeats", "Country"],
  rapper: ["Hip Hop", "Trap", "R&B", "Afrobeats", "Pop", "Latin", "Drill", "Grime", "Alternative", "Electronic"],
  rock: ["Rock", "Alternative", "Indie-rock", "Punk", "Metal", "Pop", "Blues", "Folk", "Funk", "Shoegaze"],
  "producer-dj": ["Electronic", "Hip Hop", "Pop", "House", "Techno", "Afrobeats", "R&B", "Ambient", "Trap", "Funk"],
  "singer-songwriter": ["Singer-Songwriter", "Folk", "Indie-pop", "Alternative", "Pop", "Acoustic", "Country", "R&B", "Ballad", "Blues"],
  "ai-music": ["Electronic", "Pop", "Hip Hop", "Ambient", "R&B", "Alternative", "Indie-pop", "Trap", "Lo-Fi", "Cinematic"],
};

// ── Role → Category Order ──────────────────────────────────────────────────────
// IDs must match the `id` field in CategorySectionList's baseOrder.
// Categories not listed here will appear after these in their default order.
// "story", "fan-activation", "ai-visual" are future-proofed — silently skipped if missing.

export const ROLE_CATEGORY_ORDER: Record<string, string[]> = {
  singer: [
    "selfie-performance", "selfie-lipsync", "hook-statement", "cover",
    "live-performance", "pro-camera-lipsync", "story", "fan-activation",
  ],
  rapper: [
    "selfie-performance", "hook-statement", "fast-pace-performance",
    "selfie-lipsync", "meme", "live-performance", "pro-camera-lipsync",
    "cinematic-edit", "transition",
  ],
  rock: [
    "selfie-performance", "instrument-performance", "cover",
    "fast-pace-performance", "hook-statement", "transition",
    "compilation-visuals", "selfie-lipsync", "live-performance",
  ],
  "producer-dj": [
    "production", "instrument-performance", "live-performance",
    "hook-statement", "transition", "cinematic-edit", "pro-camera-lipsync",
    "compilation-visuals", "lyric-video", "meme",
  ],
  "singer-songwriter": [
    "selfie-performance", "cover", "instrument-performance",
    "hook-statement", "lyric-video", "live-performance",
    "selfie-lipsync", "meme",
  ],
  "ai-music": [
    "compilation-visuals", "cinematic-edit", "lyric-video", "ai-visual",
    "production", "hook-statement", "selfie-lipsync",
    "pro-camera-lipsync", "meme",
  ],
};

// ── Role → Metadata Search Boosts (exported for future use) ────────────────────

export interface RoleSearchBoost {
  searchTerms?: string[];
  instruments?: string[];
  moods?: string[];
  styles?: string[];
  voicePresence?: string;
}

export const ROLE_SEARCH_BOOSTS: Record<string, RoleSearchBoost> = {
  singer: {
    voicePresence: "High",
    instruments: ["vocal"],
    moods: ["Romantic", "Energetic", "Sad"],
  },
  rapper: {
    searchTerms: ["rap", "bars", "flow", "freestyle"],
    moods: ["Aggressive", "Energetic"],
  },
  rock: {
    instruments: ["Electric Guitar", "Drum Kit", "Bass Guitar"],
    searchTerms: ["band", "rock", "live"],
    moods: ["Energetic", "Aggressive", "Epic"],
  },
  "producer-dj": {
    instruments: ["Synth", "Drum Kit", "Bass Guitar"],
    searchTerms: ["beat", "production", "mix", "drop"],
    styles: ["Production", "Compilation Visuals"],
  },
  "singer-songwriter": {
    instruments: ["Acoustic Guitar", "Piano"],
    moods: ["Sad", "Calm", "Romantic", "Chill"],
    voicePresence: "High",
  },
  "ai-music": {
    searchTerms: ["AI", "generated", "suno", "udio"],
    styles: ["AI Visual", "Compilation Visuals", "Cinematic Edit", "Lyric Video"],
    moods: ["Ethereal", "Epic", "Chill"],
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

export function getOrderedCategories(role: string | null | undefined): string[] | null {
  if (!role) return null;
  return ROLE_CATEGORY_ORDER[role] ?? null;
}

export function getRoleGenres(role: string | null | undefined): string[] | null {
  if (!role) return null;
  return ROLE_GENRE_SUGGESTIONS[role] ?? null;
}
