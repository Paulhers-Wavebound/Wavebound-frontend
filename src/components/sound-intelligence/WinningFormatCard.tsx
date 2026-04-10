import {
  WinnerFormat,
  HookAnalysis,
  DurationAnalysis,
} from "@/types/soundIntelligence";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import { Trophy, Clock, Scissors } from "lucide-react";
import InfoPopover from "./InfoPopover";

interface Props {
  winner: WinnerFormat;
  hookAnalysis: HookAnalysis;
  duration: DurationAnalysis;
  postingHours?: number[];
}

function getPeakWindow(hours: number[]): string {
  if (!hours || hours.length === 0) return "—";
  let bestStart = 0;
  let bestSum = 0;
  for (let i = 0; i < 24; i++) {
    const sum = hours[i] + hours[(i + 1) % 24] + hours[(i + 2) % 24];
    if (sum > bestSum) {
      bestSum = sum;
      bestStart = i;
    }
  }
  const fmt = (h: number) => {
    const suffix = h >= 12 ? "pm" : "am";
    const hr = h % 12 || 12;
    return `${hr}${suffix}`;
  };
  return `${fmt(bestStart)}–${fmt((bestStart + 3) % 24)} UTC`;
}

export default function WinningFormatCard({
  winner,
  hookAnalysis,
  duration,
  postingHours,
}: Props) {
  const peakWindow = postingHours ? getPeakWindow(postingHours) : null;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(232,67,10,0.06) 0%, var(--surface) 100%)",
        borderRadius: 16,
        padding: 24,
        border: "1px solid rgba(232,67,10,0.15)",
        position: "relative",
        flex: "1 1 40%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top edge glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(232,67,10,0.3), transparent)",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 1,
            background:
              "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
            flexShrink: 0,
          }}
        />
        <Trophy size={14} color="var(--accent)" />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            color: "var(--accent)",
          }}
        >
          Winning Format
        </span>
        <InfoPopover text="The single best-performing video format for your sound. Includes optimal clip window, video duration, and best posting time." />
      </div>

      {/* Format name + multiplier */}
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 24,
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1.2,
        }}
      >
        {winner.format}
      </div>
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          color: "var(--ink-secondary)",
          margin: "4px 0 16px",
        }}
      >
        {winner.multiplier}x outperformance vs other formats
      </p>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Videos", value: formatNumber(winner.video_count) },
          { label: "Avg Views", value: formatNumber(winner.avg_views) },
          { label: "Engagement", value: `${winner.share_rate}%` },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                color: "var(--ink-tertiary)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink)",
                marginTop: 2,
                letterSpacing: "-0.03em",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick facts — clip window, duration, posting time */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        {hookAnalysis.optimal_snippet && (
          <div style={factRowStyle}>
            <Scissors
              size={13}
              color="var(--ink-tertiary)"
              style={{ flexShrink: 0 }}
            />
            <span style={factLabelStyle}>Clip Window</span>
            <span style={factValueStyle}>{hookAnalysis.optimal_snippet}</span>
            <span style={factSubStyle}>
              ({hookAnalysis.snippet_appearance_pct}% of creators)
            </span>
          </div>
        )}
        <div style={factRowStyle}>
          <Clock
            size={13}
            color="var(--ink-tertiary)"
            style={{ flexShrink: 0 }}
          />
          <span style={factLabelStyle}>Optimal Duration</span>
          <span style={factValueStyle}>{duration.top10_avg}s</span>
          <span style={factSubStyle}>
            (top 10 avg vs {duration.bottom10_avg}s bottom 10)
          </span>
        </div>
        {peakWindow && (
          <div style={factRowStyle}>
            <Clock
              size={13}
              color="var(--ink-tertiary)"
              style={{ flexShrink: 0 }}
            />
            <span style={factLabelStyle}>Best Posting</span>
            <span style={factValueStyle}>{peakWindow}</span>
          </div>
        )}
      </div>

      {/* Recommendation */}
      <div
        style={{
          background: "rgba(232,67,10,0.08)",
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "var(--ink-secondary)",
          lineHeight: 1.55,
          marginTop: 12,
        }}
      >
        {winner.recommendation}
      </div>
    </div>
  );
}

const factRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: '"DM Sans", sans-serif',
};

const factLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--ink-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  minWidth: 100,
};

const factValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink)",
};

const factSubStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-faint)",
};
