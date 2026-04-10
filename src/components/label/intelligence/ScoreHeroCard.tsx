import { useMemo, useRef, useEffect, useState } from "react";
import type { ArtistCard } from "@/types/artistIntelligence";
import { TIER_CONFIG, TREND_CONFIG } from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";

function SubScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            borderRadius: 3,
            background: color,
            transition: "width 600ms ease-out",
          }}
        />
      </div>
    </div>
  );
}

function MiniSparkline({
  data,
}: {
  data: Array<{ date: string; score: number; direction: string }>;
}) {
  const lineRef = useRef<SVGPathElement>(null);
  const [revealed, setRevealed] = useState(false);

  const { path, area } = useMemo(() => {
    if (!data.length) return { path: "", area: "" };
    const w = 200;
    const h = 40;
    const pad = 2;
    const min = Math.min(...data.map((d) => d.score));
    const max = Math.max(...data.map((d) => d.score));
    const range = max - min || 1;

    const points = data.map((d, i) => ({
      x: pad + (i / (data.length - 1)) * (w - pad * 2),
      y: h - pad - ((d.score - min) / range) * (h - pad * 2),
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");
    const areaPath = `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

    return { path: linePath, area: areaPath };
  }, [data]);

  // Animate stroke-dashoffset on mount
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    // Trigger reflow then animate
    void el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1s ease-out";
    el.style.strokeDashoffset = "0";
    // Fade in area fill after line draws
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [path]);

  if (!data.length) return null;

  return (
    <svg
      viewBox="0 0 200 40"
      style={{ width: "100%", maxWidth: 200, height: 40 }}
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={area}
        fill="url(#sparkGrad)"
        style={{
          opacity: revealed ? 1 : 0,
          transition: "opacity 400ms ease-in",
        }}
      />
      <path
        ref={lineRef}
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ScoreHeroCard({ card }: { card: ArtistCard }) {
  const tier = TIER_CONFIG[card.tier] ?? TIER_CONFIG.new;
  const trend = TREND_CONFIG[card.trend] ?? TREND_CONFIG.stable;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 28,
      }}
    >
      {/* Top row: score + tier + trend + rank */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        {/* Score cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Big score */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              {card.artist_score}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginTop: 4,
              }}
            >
              Artist Score{" "}
              <InfoTooltip text="Composite 0-100 score combining health (streaming + social), momentum (growth trends), discovery (platform coverage), and catalog (streaming depth). Rebuilt nightly from cross-platform chart data." />
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: 20,
                background: tier.bg,
                color: tier.color,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {tier.label}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                color: trend.color,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 14 }}>{trend.arrow}</span>
              {trend.label}
            </span>
          </div>
        </div>

        {/* Right side: rank + sparkline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 13,
              color: "var(--ink-secondary)",
            }}
          >
            Global Rank{" "}
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              #{card.global_rank}
            </span>
          </div>
          <MiniSparkline data={card.sparkline} />
        </div>
      </div>

      {/* Sub-scores */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        <SubScoreBar
          label="Health"
          value={card.sub_scores.health}
          color="#30D158"
        />
        <SubScoreBar
          label="Momentum"
          value={card.sub_scores.momentum}
          color="#0A84FF"
        />
        <SubScoreBar
          label="Discovery"
          value={card.sub_scores.discovery}
          color="#BF5AF2"
        />
        <SubScoreBar
          label="Catalog"
          value={card.sub_scores.catalog}
          color="#FF9F0A"
        />
      </div>

      {/* Bottom row: momentum delta + ATH proximity */}
      {(card.momentum || card.listeners_peak_ratio != null) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-tertiary)",
          }}
        >
          {card.momentum ? (
            <span>
              Momentum{" "}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 600,
                  color:
                    card.momentum.direction === "up"
                      ? "#30D158"
                      : card.momentum.direction === "down"
                        ? "#FF453A"
                        : "var(--ink-secondary)",
                }}
              >
                {card.momentum.direction === "up" ? "+" : ""}
                {card.momentum.acceleration_7d.toFixed(1)}
              </span>
              /7d
              {card.momentum.zone === "negative" && (
                <span style={{ color: "#FF453A", marginLeft: 6 }}>
                  negative zone
                </span>
              )}
            </span>
          ) : (
            <span />
          )}
          {card.listeners_peak_ratio != null && (
            <span>
              {card.listeners_peak_ratio >= 0.9
                ? "Near all-time high"
                : `${Math.round(card.listeners_peak_ratio * 100)}% of peak listeners`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
