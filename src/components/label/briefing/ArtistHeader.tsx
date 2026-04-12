import { useMemo, useRef, useEffect, useState } from "react";
import type { ArtistCard } from "@/types/artistIntelligence";
import { TIER_CONFIG, TREND_CONFIG } from "@/types/artistIntelligence";
import { computeMomentumLabel } from "@/utils/briefingGenerator";

// ─── Mini Sparkline ──────────────────────────────────────────────

function Sparkline({
  data,
}: {
  data: Array<{ date: string; score: number; direction: string }>;
}) {
  const lineRef = useRef<SVGPathElement>(null);
  const [revealed, setRevealed] = useState(false);

  const { linePath, areaPath } = useMemo(() => {
    if (!data.length) return { linePath: "", areaPath: "" };
    const w = 120;
    const h = 28;
    const pad = 1;
    const min = Math.min(...data.map((d) => d.score));
    const max = Math.max(...data.map((d) => d.score));
    const range = max - min || 1;

    const points = data.map((d, i) => ({
      x: pad + (i / (data.length - 1)) * (w - pad * 2),
      y: h - pad - ((d.score - min) / range) * (h - pad * 2),
    }));

    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");
    const area = `${line} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

    return { linePath: line, areaPath: area };
  }, [data]);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    void el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1s ease-out";
    el.style.strokeDashoffset = "0";
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [linePath]);

  if (!data.length) return null;

  return (
    <svg viewBox="0 0 120 28" style={{ width: 120, height: 28 }}>
      <defs>
        <linearGradient id="headerSparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill="url(#headerSparkGrad)"
        style={{
          opacity: revealed ? 1 : 0,
          transition: "opacity 300ms ease-in",
        }}
      />
      <path
        ref={lineRef}
        d={linePath}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Stat Chip ───────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        color: color ?? "rgba(255,255,255,0.55)",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.30)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? "rgba(255,255,255,0.87)" }}>
        {value}
      </span>
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────

interface ArtistHeaderProps {
  card: ArtistCard;
  songsCount: number;
}

export default function ArtistHeader({ card, songsCount }: ArtistHeaderProps) {
  const tier = TIER_CONFIG[card.tier] ?? TIER_CONFIG.new;
  const trend = TREND_CONFIG[card.trend] ?? TREND_CONFIG.stable;
  const momentum = computeMomentumLabel(card);

  const marketsGrowing =
    card.geo.total_markets > 0 ? card.geo.total_markets : 0;
  const accel = card.momentum?.acceleration_7d ?? 0;
  const accelStr =
    accel > 0 ? `+${accel.toFixed(1)}` : accel < 0 ? accel.toFixed(1) : "0.0";

  const catalogHighlight = card.catalog?.viral_songs
    ? `${card.catalog.viral_songs} viral`
    : card.catalog?.accelerating_songs
      ? `${card.catalog.accelerating_songs} accelerating`
      : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {/* Left: Name + badges */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 32,
              fontWeight: 700,
              color: "rgba(255,255,255,0.87)",
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}
          >
            {card.name}
          </h1>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 10px",
              borderRadius: 12,
              background: tier.bg,
              color: tier.color,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              flexShrink: 0,
            }}
          >
            {tier.label}
          </span>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <StatChip
            label="Score"
            value={`${card.artist_score}`}
            color={momentum.color}
          />
          <span style={{ color: "rgba(255,255,255,0.10)" }}>|</span>
          <StatChip
            label=""
            value={`${trend.arrow} ${trend.label}`}
            color={trend.color}
          />
          <span style={{ color: "rgba(255,255,255,0.10)" }}>|</span>
          <StatChip label="Markets" value={String(marketsGrowing)} />
          <span style={{ color: "rgba(255,255,255,0.10)" }}>|</span>
          <StatChip label="7d" value={accelStr} color={accel > 0 ? "#30D158" : accel < 0 ? "#FF453A" : undefined} />
          {catalogHighlight && (
            <>
              <span style={{ color: "rgba(255,255,255,0.10)" }}>|</span>
              <StatChip
                label={`${songsCount} songs`}
                value={catalogHighlight}
                color="#FF9F0A"
              />
            </>
          )}
        </div>
      </div>

      {/* Right: Sparkline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <Sparkline data={card.sparkline} />
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          30d momentum
        </span>
      </div>
    </div>
  );
}
