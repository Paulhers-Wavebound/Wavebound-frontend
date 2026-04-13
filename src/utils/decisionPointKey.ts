import type { DecisionPoint } from "@/data/contentDashboardHelpers";

/**
 * Stable key for a decision point across brief regenerations.
 *
 * Prefers `dp.id` — a deterministic UUIDv5 assigned by
 * `edge-functions/generate-signal-report.ts` (backend commit d6033ff,
 * 2026-04-12), hashed off `label_id|brief_date|index|category|title|
 * sorted_artist_names|signal`.
 *
 * Falls back to a client-synthesized key for briefs generated before that
 * commit landed. Once no pre-UUID briefs remain in the lookback window
 * (~30 days after the backend deploy), the fallback can be deleted.
 */
export function decisionPointKey(dp: DecisionPoint, briefDate: string): string {
  if (dp.id) return dp.id;
  return `${briefDate}:${dp.artist_handle}:${dp.category}:${dp.urgency}`;
}

export interface SnoozePreset {
  label: string;
  /** ISO timestamp when the DP should reappear in the brief */
  resolve: () => string;
}

function atHour(daysFromNow: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const SNOOZE_PRESETS: SnoozePreset[] = [
  {
    label: "In 1 hour",
    resolve: () => new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
  {
    label: "In 4 hours",
    resolve: () => new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    label: "Tomorrow morning",
    resolve: () => atHour(1, 9),
  },
  {
    label: "In 3 days",
    resolve: () => atHour(3, 9),
  },
  {
    label: "Next week",
    resolve: () => atHour(7, 9),
  },
];
