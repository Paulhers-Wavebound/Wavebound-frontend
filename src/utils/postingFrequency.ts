/**
 * Compute average posting frequency (days between posts) from an array of posting dates.
 * The `posting_dates` column is JSONB: array of objects with a date field.
 * Accepts formats: [{date: "2025-01-01"}, ...] or ["2025-01-01", ...] or [{posted_at: "..."}, ...]
 */

export type FrequencyWindow = 7 | 30 | 90;

export function parsePostingDates(raw: unknown): Date[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      const str = typeof item === 'string' ? item : item?.date || item?.posted_at || item?.created_at;
      if (!str) return null;
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    })
    .filter(Boolean) as Date[];
}

/**
 * Returns average days between posts within the given window (last N days).
 * Returns null if fewer than 2 posts in the window.
 */
export function calcFrequency(dates: Date[], windowDays: FrequencyWindow): number | null {
  const now = Date.now();
  const cutoff = now - windowDays * 86400000;
  const inWindow = dates.filter(d => d.getTime() >= cutoff).sort((a, b) => a.getTime() - b.getTime());
  if (inWindow.length < 2) return inWindow.length === 1 ? windowDays : null;
  const span = inWindow[inWindow.length - 1].getTime() - inWindow[0].getTime();
  return span / ((inWindow.length - 1) * 86400000);
}

/**
 * Derive last_post_date from posting dates array.
 */
export function getLastPostDate(dates: Date[]): string | null {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  return sorted[0].toISOString();
}
