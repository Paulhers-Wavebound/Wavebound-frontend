import { useMemo, useRef, useEffect, useState } from "react";
import type { ArtistCard } from "@/types/artistIntelligence";
import type { BriefingData } from "@/types/artistBriefing";
import { TIER_CONFIG } from "@/types/artistIntelligence";
import {
  generateBriefingParagraph,
  computeMomentumLabel,
} from "@/utils/briefingGenerator";

// ─── Animated Momentum Bar ─────────────────────────────────────────

function MomentumBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div
      style={{
        height: 10,
        borderRadius: 5,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          borderRadius: 5,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

// ─── Mini Sparkline (30-day momentum) ──────────────────────────────

function Sparkline({
  data,
}: {
  data: Array<{ date: string; score: number; direction: string }>;
}) {
  const lineRef = useRef<SVGPathElement>(null);
  const [revealed, setRevealed] = useState(false);

  const { linePath, areaPath } = useMemo(() => {
    if (!data.length) return { linePath: "", areaPath: "" };
    const w = 160;
    const h = 32;
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
    el.style.transition = "stroke-dashoffset 1.2s ease-out";
    el.style.strokeDashoffset = "0";
    const t = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(t);
  }, [linePath]);

  if (!data.length) return null;

  return (
    <svg viewBox="0 0 160 32" style={{ width: 160, height: 32 }}>
      <defs>
        <linearGradient id="briefSparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill="url(#briefSparkGrad)"
        style={{
          opacity: revealed ? 1 : 0,
          transition: "opacity 400ms ease-in",
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

// ─── Stat Pill ─────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(255,255,255,0.87)",
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 500,
              color: delta.startsWith("+")
                ? "#30D158"
                : delta.startsWith("-")
                  ? "#FF453A"
                  : "rgba(255,255,255,0.35)",
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

interface BriefingHeroProps {
  data: BriefingData;
  artistLabel?: string;
  artistGenre?: string;
}

export default function BriefingHero({
  data,
  artistLabel,
  artistGenre,
}: BriefingHeroProps) {
  const { artistCard: card } = data;
  const momentum = computeMomentumLabel(card);
  const briefing = useMemo(() => generateBriefingParagraph(data), [data]);
  const tier = TIER_CONFIG[card.tier] ?? TIER_CONFIG.new;

  // Compute delta strings
  const accel = card.momentum?.acceleration_7d ?? 0;
  const marketsGrowing = data.marketsV2.filter(
    (m) => m.velocity === "surging" || m.velocity === "rising",
  ).length;
  const platformsDelta =
    card.signals.platforms_growing > 0
      ? `+${card.signals.platforms_growing}`
      : undefined;

  // Urgency border color
  const urgencyBorderColor =
    briefing.urgencyLevel === "critical"
      ? "rgba(255,69,58,0.3)"
      : briefing.urgencyLevel === "high"
        ? "rgba(255,159,10,0.3)"
        : "rgba(255,255,255,0.06)";

  // Format time ago for card date
  const updatedAgo = useMemo(() => {
    if (!card.date) return "";
    const mins = Math.floor(
      (Date.now() - new Date(card.date).getTime()) / 60000,
    );
    if (mins < 1) return "Updated just now";
    if (mins < 60) return `Updated ${mins}m ago`;
    if (mins < 1440) return `Updated ${Math.floor(mins / 60)}h ago`;
    return `Updated ${Math.floor(mins / 1440)}d ago`;
  }, [card.date]);

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* ─── Top: Name + Momentum ─── */}
      <div style={{ padding: "32px 32px 0" }}>
        {/* Artist name + subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 36,
                fontWeight: 700,
                color: "rgba(255,255,255,0.87)",
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
              }}
            >
              {card.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              {artistGenre && (
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {artistGenre}
                </span>
              )}
              {artistGenre && artistLabel && (
                <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              )}
              {artistLabel && (
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {artistLabel}
                </span>
              )}
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
                }}
              >
                {tier.label}
              </span>
            </div>
          </div>

          {/* Sparkline + rank */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <Sparkline data={card.sparkline} />
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              30-day momentum · #{card.global_rank} global
            </span>
          </div>
        </div>

        {/* ─── Momentum Score Bar ─── */}
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 8,
            }}
          >
            <MomentumBar score={card.artist_score} color={momentum.color} />
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Global Momentum:
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 22,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.87)",
                }}
              >
                {card.artist_score}
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                /100
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 10px",
                  borderRadius: 12,
                  background:
                    momentum.color === "#30D158"
                      ? "rgba(48,209,88,0.15)"
                      : momentum.color === "#FF453A"
                        ? "rgba(255,69,58,0.15)"
                        : momentum.color === "#0A84FF"
                          ? "rgba(10,132,255,0.15)"
                          : "rgba(142,142,147,0.15)",
                  color: momentum.color,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1px",
                }}
              >
                {momentum.label}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexWrap: "wrap",
          }}
        >
          <StatPill
            label="Active Markets"
            value={String(card.geo.total_markets)}
            delta={
              marketsGrowing > 0 ? `+${marketsGrowing} surging` : undefined
            }
          />
          <StatPill
            label="Platforms"
            value={String(card.signals.platforms_tracked)}
            delta={platformsDelta ? `${platformsDelta} growing` : undefined}
          />
          <StatPill
            label="Songs Tracked"
            value={String(data.songs.length || card.catalog?.total_songs || 0)}
            delta={
              card.catalog?.viral_songs
                ? `${card.catalog.viral_songs} viral`
                : card.catalog?.accelerating_songs
                  ? `${card.catalog.accelerating_songs} accelerating`
                  : undefined
            }
          />
          <StatPill
            label="Momentum 7d"
            value={
              accel > 0
                ? `+${accel.toFixed(1)}`
                : accel < 0
                  ? accel.toFixed(1)
                  : "0.0"
            }
            delta={
              card.momentum?.zone === "positive"
                ? "positive zone"
                : card.momentum?.zone === "negative"
                  ? "negative zone"
                  : undefined
            }
          />
        </div>
      </div>

      {/* ─── AI Briefing Paragraph ─── */}
      <div
        style={{
          margin: "24px 32px 0",
          padding: 24,
          background:
            briefing.urgencyLevel === "critical"
              ? "rgba(255,69,58,0.04)"
              : briefing.urgencyLevel === "high"
                ? "rgba(255,159,10,0.04)"
                : "rgba(255,255,255,0.02)",
          borderRadius: 12,
          border: `1px solid ${urgencyBorderColor}`,
        }}
      >
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.87)",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          "{briefing.text}"
        </p>
      </div>

      {/* ─── Footer: updated time ─── */}
      <div
        style={{
          padding: "16px 32px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {updatedAgo}
        </span>
        {briefing.keyDrivers.length > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            {briefing.keyDrivers.map((driver) => (
              <span
                key={driver}
                style={{
                  display: "inline-flex",
                  padding: "2px 8px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {driver}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
