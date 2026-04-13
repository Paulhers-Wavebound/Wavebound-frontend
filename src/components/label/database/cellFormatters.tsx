import {
  TIER_CONFIG,
  TREND_CONFIG,
  SIGNAL_CONFIG,
  TIKTOK_GRADE_CONFIG,
} from "@/types/artistIntelligence";
import type { FormatterType } from "./columns";

const POSTING_COLORS: Record<string, { color: string; bg: string }> = {
  daily: { color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  regular: { color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  sporadic: { color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  inactive: { color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  dormant: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
};

const compactNum = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainNum = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function scoreColor(v: number): string {
  if (v >= 70) return "#30D158";
  if (v >= 40) return "#FFD60A";
  return "#FF453A";
}

function changeColor(v: number): string {
  if (v > 0) return "#30D158";
  if (v < 0) return "#FF453A";
  return "rgba(255,255,255,0.55)";
}

// ---------------------------------------------------------------------------
// Individual formatters
// ---------------------------------------------------------------------------

function textCell(value: unknown): React.ReactNode {
  if (value == null || value === "")
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  return (
    <span style={{ color: "rgba(255,255,255,0.87)" }}>{String(value)}</span>
  );
}

function scoreCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const n = Number(value);
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: scoreColor(n),
        fontWeight: 600,
      }}
    >
      {Math.round(n)}
    </span>
  );
}

function numberCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: "rgba(255,255,255,0.87)",
      }}
    >
      {plainNum.format(Number(value))}
    </span>
  );
}

function bigNumberCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: "rgba(255,255,255,0.87)",
      }}
    >
      {compactNum.format(Number(value))}
    </span>
  );
}

function percentCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const n = Number(value);
  // Values from DB might be 0-1 or 0-100 — display as percentage
  const display = n > 1 ? n : n * 100;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: "rgba(255,255,255,0.87)",
      }}
    >
      {display.toFixed(1)}%
    </span>
  );
}

function percentChangeCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const n = Number(value);
  const prefix = n > 0 ? "+" : "";
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: changeColor(n),
        fontWeight: 500,
      }}
    >
      {prefix}
      {n.toFixed(1)}%
    </span>
  );
}

function rankCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: "rgba(255,255,255,0.55)",
      }}
    >
      {plainNum.format(Number(value))}
    </span>
  );
}

function tierCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const cfg = TIER_CONFIG[String(value)];
  if (!cfg) return textCell(value);
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function trendCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const cfg = TREND_CONFIG[String(value)];
  if (!cfg) return textCell(value);
  return (
    <span style={{ color: cfg.color, fontWeight: 500, whiteSpace: "nowrap" }}>
      {cfg.arrow} {cfg.label}
    </span>
  );
}

function signalCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const cfg = SIGNAL_CONFIG[String(value)];
  if (!cfg) return textCell(value);
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function tiktokGradeCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const cfg = TIKTOK_GRADE_CONFIG[String(value)];
  if (!cfg) return textCell(value);
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {String(value)}
    </span>
  );
}

function postingConsistencyCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const key = String(value).toLowerCase();
  const cfg = POSTING_COLORS[key];
  if (!cfg) return textCell(value);
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {key}
    </span>
  );
}

function platformTrendCell(value: unknown): React.ReactNode {
  if (value == null)
    return <span style={{ color: "rgba(255,255,255,0.20)" }}>—</span>;
  const n = Number(value);
  const arrow = n > 0 ? "▲" : n < 0 ? "▼" : "•";
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        color: changeColor(n),
        fontWeight: 500,
      }}
    >
      {arrow} {Math.abs(n).toFixed(1)}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const FORMATTERS: Record<FormatterType, (v: unknown) => React.ReactNode> = {
  text: textCell,
  score: scoreCell,
  number: numberCell,
  bigNumber: bigNumberCell,
  percent: percentCell,
  percentChange: percentChangeCell,
  rank: rankCell,
  tier: tierCell,
  trend: trendCell,
  signal: signalCell,
  tiktokGrade: tiktokGradeCell,
  postingConsistency: postingConsistencyCell,
  platformTrend: platformTrendCell,
};

export function formatCell(
  formatter: FormatterType,
  value: unknown,
): React.ReactNode {
  return FORMATTERS[formatter](value);
}
