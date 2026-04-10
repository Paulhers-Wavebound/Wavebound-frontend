import { PLATFORM_COLORS } from "./constants";

export function relativeTime(iso: string | null): string {
  if (!iso) return "\u2014";
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) {
    const d = new Date(iso);
    return `yesterday ${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
  }
  return `${days}d ago`;
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "\u2014";
  if (ms < 1000) return `${ms}ms`;
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return n.toLocaleString();
}

export function formatPct(n: number): string {
  return n.toFixed(1) + "%";
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] || "#9CA3AF";
}

/** Returns the fraction of the UTC day elapsed (0.0 at midnight, 1.0 at 23:59). */
export function getUtcDayFraction(): number {
  const now = new Date();
  return (
    (now.getUTCHours() * 3600 +
      now.getUTCMinutes() * 60 +
      now.getUTCSeconds()) /
    86400
  );
}

/**
 * Returns pace percentage: 100 = exactly on track for the day.
 * Returns null if dailyTarget is 0/undefined or it's too early to judge.
 */
export function getPacePercent(
  todayActual: number,
  dailyTarget: number,
): number | null {
  if (!dailyTarget) return null;
  const fraction = getUtcDayFraction();
  if (fraction < 0.01) return null; // too early to judge
  const expectedNow = dailyTarget * fraction;
  return Math.round((todayActual / expectedNow) * 100);
}

/** Returns progress bar color based on pace percentage. */
export function getPaceColor(pacePercent: number): string {
  if (pacePercent >= 90) return "#22c55e";
  if (pacePercent >= 60) return "#f59e0b";
  return "#ef4444";
}

/** Formats a number in compact notation: 300K, 2.5M, etc. */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return v % 1 === 0 ? `${v}M` : `${v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return v % 1 === 0 ? `${v}K` : `${v.toFixed(1)}K`;
  }
  return n.toLocaleString();
}
