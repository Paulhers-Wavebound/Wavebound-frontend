import {
  Film,
  Flame,
  Heart,
  Link as LinkIcon,
  Mic,
  Scissors,
  Smile,
  Sparkles,
} from "lucide-react";
import type { OutputType } from "./types";

export type PresetStatus = "live" | "soon";

export interface PresetConfig {
  key: OutputType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  status: PresetStatus;
}

export const PRESETS: PresetConfig[] = [
  // Live presets — real generation pipelines wired. Surfaced first.
  {
    key: "cartoon",
    label: "Cartoon",
    description: "60s Image-Zoom cartoon — script + VO + render",
    icon: Smile,
    status: "live",
  },
  {
    key: "link_video",
    label: "Lyric Overlay",
    description: "9:16 lyric video from a TikTok / YT ref",
    icon: LinkIcon,
    status: "live",
  },
  {
    key: "fan_brief",
    label: "Fan brief edit",
    description: "From a pending fan-submitted brief",
    icon: Sparkles,
    status: "live",
  },
  // Coming-soon presets — UI scaffolding only, no backend yet. Cards stay
  // visible (so users see the roadmap) but the Generate path is replaced
  // with a request-access copy block in CreateView.
  {
    key: "short_form",
    label: "Short-form clip",
    description: "15-60s vertical cut — Reels / TikTok / Shorts",
    icon: Scissors,
    status: "soon",
  },
  {
    key: "mini_doc",
    label: "Mini-doc",
    description: "1-20 min long-form — YouTube, editorial tone",
    icon: Film,
    status: "soon",
  },
  {
    key: "sensational",
    label: "Sensational angle",
    description: "High-hook narrative edit — sourced stories only",
    icon: Flame,
    status: "soon",
  },
  {
    key: "self_help",
    label: "Self-help tie-in",
    description: "Follow-friendly edit with a takeaway",
    icon: Heart,
    status: "soon",
  },
  {
    key: "tour_recap",
    label: "Tour recap",
    description: "Post-show recap from crowd or BTS footage",
    icon: Mic,
    status: "soon",
  },
];

export const MOCKED_PRESETS = new Set<OutputType>(
  PRESETS.filter((p) => p.status === "soon").map((p) => p.key),
);
