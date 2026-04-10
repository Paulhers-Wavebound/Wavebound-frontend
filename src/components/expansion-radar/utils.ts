import type { Velocity, Urgency, WindowConfidence, SignalType } from "./types";

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

export function formatDollar(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1_000_000) return "$" + (amount / 1_000_000).toFixed(1) + "M";
  if (amount >= 1_000) return "$" + (amount / 1_000).toFixed(1) + "K";
  return "$" + amount.toFixed(0);
}

// Per-market streaming rates (approximate $/stream)
const MARKET_RATES: Record<string, number> = {
  US: 0.006,
  CA: 0.006,
  GB: 0.006,
  AU: 0.006,
  NZ: 0.006,
  SE: 0.007,
  NO: 0.007,
  DK: 0.006,
  FI: 0.006,
  IS: 0.006,
  CH: 0.007,
  LU: 0.006,
  DE: 0.005,
  FR: 0.005,
  NL: 0.005,
  BE: 0.005,
  AT: 0.005,
  IE: 0.005,
  IT: 0.004,
  ES: 0.004,
  PT: 0.004,
  PL: 0.003,
  CZ: 0.003,
  HU: 0.003,
  RO: 0.002,
  BG: 0.002,
  HR: 0.003,
  SK: 0.003,
  SI: 0.003,
  RS: 0.002,
  UA: 0.002,
  BY: 0.002,
  RU: 0.002,
  EE: 0.003,
  LV: 0.003,
  LT: 0.003,
  GR: 0.003,
  TR: 0.002,
  IL: 0.004,
  BR: 0.002,
  MX: 0.003,
  AR: 0.002,
  CL: 0.003,
  CO: 0.002,
  PE: 0.002,
  EC: 0.002,
  VE: 0.001,
  BO: 0.002,
  PY: 0.002,
  UY: 0.003,
  CR: 0.002,
  PA: 0.002,
  GT: 0.002,
  DO: 0.002,
  SA: 0.003,
  AE: 0.004,
  QA: 0.004,
  KW: 0.004,
  JO: 0.003,
  LB: 0.003,
  OM: 0.003,
  EG: 0.002,
  MA: 0.002,
  DZ: 0.002,
  TN: 0.002,
  BH: 0.003,
  JP: 0.005,
  KR: 0.004,
  TW: 0.003,
  HK: 0.004,
  SG: 0.004,
  MY: 0.002,
  TH: 0.002,
  VN: 0.001,
  PH: 0.001,
  ID: 0.001,
  IN: 0.001,
  PK: 0.001,
  CN: 0.002,
  KZ: 0.002,
  ZA: 0.002,
  NG: 0.001,
  KE: 0.001,
  GH: 0.001,
  TZ: 0.001,
  UG: 0.001,
  SN: 0.001,
};

const DEFAULT_RATE = 0.003;

export function perStreamRate(countryCode: string): number {
  return MARKET_RATES[countryCode] ?? DEFAULT_RATE;
}

export function formatRevenue(streams: number, countryCode?: string): string {
  const rate = countryCode ? perStreamRate(countryCode) : DEFAULT_RATE;
  const revenue = streams * rate;
  if (revenue >= 1000) return "$" + (revenue / 1000).toFixed(1) + "K/mo";
  return "$" + revenue.toFixed(0) + "/mo";
}

export function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

export function signalColor(temp: "hot" | "warm" | "cold" | "none"): string {
  switch (temp) {
    case "hot":
      return "#e8430a";
    case "warm":
      return "#f59e0b";
    case "cold":
      return "#6366f1";
    default:
      return "transparent";
  }
}

// --- V2 utilities ---

export function velocityArrow(v: Velocity): string {
  switch (v) {
    case "surging":
      return "\u21c8"; // ⇈
    case "rising":
      return "\u2191"; // ↑
    case "stable":
      return "\u2014"; // —
    case "declining":
      return "\u2193"; // ↓
    case "exiting":
      return "\u2717"; // ✗
  }
}

export function velocityColor(v: Velocity): string {
  switch (v) {
    case "surging":
      return "#34d399";
    case "rising":
      return "#6ee7b7";
    case "stable":
      return "rgba(255,255,255,0.4)";
    case "declining":
      return "#f59e0b";
    case "exiting":
      return "#ef4444";
  }
}

export function urgencyConfig(u: Urgency): {
  label: string;
  color: string;
  bg: string;
} {
  switch (u) {
    case "act_now":
      return { label: "ACT NOW", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    case "plan":
      return { label: "PLAN", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    case "monitor":
      return {
        label: "MONITOR",
        color: "rgba(255,255,255,0.4)",
        bg: "rgba(255,255,255,0.06)",
      };
  }
}

export function confidenceBorder(c: WindowConfidence): string {
  switch (c) {
    case "high":
      return "solid";
    case "medium":
      return "dashed";
    case "low":
      return "dotted";
  }
}

export function signalTypeBadge(s: SignalType): {
  label: string;
  color: string;
  bg: string;
  pulse?: boolean;
} {
  switch (s) {
    case "pre_breakout":
      return {
        label: "PRE-BREAKOUT",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.15)",
        pulse: true,
      };
    case "early_demand":
      return {
        label: "EARLY DEMAND",
        color: "#e8430a",
        bg: "rgba(232,67,10,0.12)",
      };
    case "discovery_only":
      return {
        label: "DISCOVERY ONLY",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.12)",
      };
    case "streaming_only":
      return {
        label: "STREAMING ONLY",
        color: "#6366f1",
        bg: "rgba(99,102,241,0.12)",
      };
    case "balanced":
      return {
        label: "BALANCED",
        color: "#34d399",
        bg: "rgba(52,211,153,0.12)",
      };
  }
}

export function discoveryDotColor(
  signalType: string,
  isPresent: boolean,
): string {
  if (signalType === "pre_breakout" || signalType === "early_demand")
    return "#0A84FF"; // blue glow
  if (isPresent) return "#34d399"; // green for active
  return "#e8430a"; // orange for expansion opportunity
}

export const PLATFORM_META: {
  key: string;
  label: string;
  color: string;
  short: string;
}[] = [
  { key: "spotify", label: "Spotify", color: "#1DB954", short: "SP" },
  { key: "tiktok", label: "TikTok", color: "#FF004F", short: "TK" },
  { key: "shazam", label: "Shazam", color: "#0088FF", short: "SZ" },
  { key: "apple_music", label: "Apple Music", color: "#FC3C44", short: "AM" },
  { key: "youtube", label: "YouTube", color: "#FF0000", short: "YT" },
  { key: "deezer", label: "Deezer", color: "#A238FF", short: "DZ" },
];

export function platformColor(platform: string): string {
  const p = platform.toLowerCase().replace(/\s+/g, "_");
  const found = PLATFORM_META.find(
    (m) => m.key === p || m.label.toLowerCase() === p,
  );
  return found?.color ?? "var(--ink-tertiary)";
}

export function trendLabel(trend: string): { label: string; color: string } {
  switch (trend) {
    case "rising_fast":
      return { label: "Rising Fast", color: "#34d399" };
    case "rising":
      return { label: "Rising", color: "#6ee7b7" };
    case "stable":
      return { label: "Stable", color: "rgba(255,255,255,0.5)" };
    case "falling":
      return { label: "Falling", color: "#f59e0b" };
    case "falling_fast":
      return { label: "Falling Fast", color: "#ef4444" };
    default:
      return { label: trend, color: "var(--ink-tertiary)" };
  }
}

export function crossPlatformBadge(signal: string): {
  label: string;
  color: string;
} {
  switch (signal) {
    case "breakout":
      return { label: "Breakout", color: "#ef4444" };
    case "surging":
      return { label: "Surging", color: "#e8430a" };
    case "rising":
      return { label: "Rising", color: "#34d399" };
    case "stable":
      return { label: "Stable", color: "rgba(255,255,255,0.5)" };
    case "dipping":
      return { label: "Dipping", color: "#f59e0b" };
    case "cooling":
      return { label: "Cooling", color: "#6366f1" };
    default:
      return { label: signal, color: "var(--ink-tertiary)" };
  }
}
