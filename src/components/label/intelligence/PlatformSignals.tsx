import type { ArtistCard } from "@/types/artistIntelligence";
import { SIGNAL_CONFIG } from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const PLATFORMS: Array<{
  key: "spotify_trend" | "tiktok_trend" | "youtube_trend" | "shazam_trend";
  label: string;
  color: string;
}> = [
  { key: "spotify_trend", label: "Spotify", color: "#1DB954" },
  { key: "tiktok_trend", label: "TikTok", color: "#FF004F" },
  { key: "youtube_trend", label: "YouTube", color: "#FF0000" },
  { key: "shazam_trend", label: "Shazam", color: "#0A84FF" },
];

function TrendBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const isPositive = value != null && value > 0;
  const isNegative = value != null && value < 0;
  const absVal = value != null ? Math.abs(value) : 0;
  // Cap visual at 50% for bar width
  const barWidth = Math.min(absVal, 50);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
      }}
    >
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ink)",
          width: 64,
          flexShrink: 0,
        }}
      >
        {label}
      </span>

      {/* Bar container — centered, negative goes left, positive goes right */}
      <div
        style={{
          flex: 1,
          height: 20,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        {value == null ? (
          <div
            style={{
              width: "100%",
              height: 4,
              borderRadius: 2,
              background: "var(--border)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              background: "var(--border)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Center line */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 1,
                background: "rgba(255,255,255,0.15)",
              }}
            />
            {/* The bar itself */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                ...(isPositive
                  ? { left: "50%", width: `${barWidth}%` }
                  : isNegative
                    ? {
                        right: "50%",
                        width: `${barWidth}%`,
                      }
                    : { left: "50%", width: 0 }),
                background: isPositive
                  ? color
                  : isNegative
                    ? "#FF453A"
                    : "transparent",
                borderRadius: 4,
                transition: "width 500ms ease-out",
                opacity: 0.8,
              }}
            />
          </div>
        )}
      </div>

      {/* Value */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          fontWeight: 600,
          width: 52,
          textAlign: "right",
          flexShrink: 0,
          color:
            value == null
              ? "var(--ink-tertiary)"
              : isPositive
                ? "#30D158"
                : isNegative
                  ? "#FF453A"
                  : "var(--ink-secondary)",
        }}
      >
        {value == null ? "—" : `${isPositive ? "+" : ""}${value.toFixed(1)}%`}
      </span>
    </div>
  );
}

export default function PlatformSignals({ card }: { card: ArtistCard }) {
  const sig =
    SIGNAL_CONFIG[card.signals.cross_platform] ?? SIGNAL_CONFIG.stable;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Platform Signals{" "}
          <InfoTooltip text={STAT_TOOLTIPS.intel.platformSignals} />
        </h3>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 12px",
            borderRadius: 20,
            background: sig.bg,
            color: sig.color,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {sig.label}
          <InfoTooltip text={STAT_TOOLTIPS.intel.crossPlatformBadge} />
        </span>
      </div>

      {/* Platform summary */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "var(--ink-tertiary)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#30D158", fontWeight: 600 }}>
            {card.signals.platforms_growing}
          </span>{" "}
          growing
          <InfoTooltip text={STAT_TOOLTIPS.intel.platformsGrowing} />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#FF453A", fontWeight: 600 }}>
            {card.signals.platforms_declining}
          </span>{" "}
          declining
          <InfoTooltip text={STAT_TOOLTIPS.intel.platformsDeclining} />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {card.signals.platforms_tracked} tracked
          <InfoTooltip text={STAT_TOOLTIPS.intel.platformsTracked} />
        </span>
      </div>

      {/* Trend bars */}
      <div>
        {PLATFORMS.map((p) => (
          <TrendBar
            key={p.key}
            label={p.label}
            value={card.signals[p.key]}
            color={p.color}
          />
        ))}
      </div>
    </div>
  );
}
