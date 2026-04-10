import { useMemo } from "react";
import {
  SoundAnalysis,
  SoundMonitoring,
  CreatorTier,
} from "@/types/soundIntelligence";
import { formatNumber, timeAgo } from "@/utils/soundIntelligenceApi";
import { Music } from "lucide-react";
import MonitoringBadge from "./MonitoringBadge";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  analysis: SoundAnalysis;
  monitoring?: SoundMonitoring | null;
  userCount?: number | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  accelerating: {
    label: "Accelerating",
    bg: "rgba(48,209,88,0.12)",
    color: "#30D158",
  },
  active: { label: "Active", bg: "rgba(255,214,10,0.12)", color: "#FFD60A" },
  declining: {
    label: "Declining",
    bg: "rgba(255,69,58,0.12)",
    color: "#FF453A",
  },
};

function getPhaseLabel(phase: string): string {
  const lower = phase.toLowerCase();
  if (lower.includes("ignit")) return "Ignition";
  if (lower.includes("break")) return "Breakout";
  return "Sustain";
}

function deriveCreatorCount(tiers?: CreatorTier[]): number | null {
  if (!tiers || tiers.length === 0) return null;
  return tiers.reduce((sum, t) => sum + t.count, 0);
}

export default function VerdictStrip({
  analysis,
  monitoring,
  userCount,
}: Props) {
  const status = STATUS_CONFIG[analysis.status] ?? STATUS_CONFIG.active;

  const organicPct = analysis.intent_breakdown?.find(
    (i) => i.intent === "organic",
  )?.pct;

  const totalCreators =
    deriveCreatorCount(analysis.creator_tiers) ?? analysis.videos_analyzed;

  const topGeo = analysis.geography?.[0];
  const geoLabel = topGeo ? `${topGeo.pct}% ${topGeo.country}` : null;

  // Current velocity = average of last 7 days
  const velocity7d = useMemo(() => {
    const last7 = analysis.velocity.slice(-7);
    if (last7.length === 0) return 0;
    return Math.round(last7.reduce((s, d) => s + d.videos, 0) / last7.length);
  }, [analysis.velocity]);

  // Days active = length of velocity array
  const daysActive = analysis.velocity.length;

  // 7-day sparkline data
  const sparkData = useMemo(() => {
    return analysis.velocity.slice(-7).map((d) => ({ v: d.videos }));
  }, [analysis.velocity]);

  const lifecyclePhase = getPhaseLabel(analysis.lifecycle.current_phase);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        borderTop: "0.5px solid var(--card-edge)",
        overflow: "hidden",
      }}
    >
      {/* Top bar: identity + status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 0",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {analysis.cover_url ? (
            <img
              src={analysis.cover_url}
              alt={analysis.track_name}
              crossOrigin="anonymous"
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
                background: "var(--border-subtle)",
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                flexShrink: 0,
                background: "var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Music size={20} color="var(--ink-tertiary)" />
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--ink)",
                  margin: 0,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                {analysis.track_name}
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 9px",
                  borderRadius: 100,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  background: status.bg,
                  color: status.color,
                  flexShrink: 0,
                }}
              >
                {status.label}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--ink-tertiary)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "var(--overlay-subtle)",
                }}
              >
                {lifecyclePhase}
              </span>
            </div>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-tertiary)",
                margin: "2px 0 0",
              }}
            >
              {analysis.artist_name} · {analysis.album_name}
            </p>
          </div>
        </div>

        <MonitoringBadge monitoring={monitoring ?? null} size="md" />
      </div>

      {/* Metrics strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          padding: "16px 24px",
          marginTop: 4,
        }}
      >
        {/* Metric cells */}
        {[
          {
            label: "Velocity",
            value: `${velocity7d}/day`,
            accent: true,
          },
          {
            label: "Creators",
            value: formatNumber(totalCreators),
          },
          {
            label: "Organic",
            value: organicPct != null ? `${organicPct}%` : "—",
          },
          {
            label: "Days Active",
            value: String(daysActive),
          },
        ].map((m, i) => (
          <div
            key={m.label}
            style={{
              flex: "0 0 auto",
              paddingRight: 24,
              marginRight: 24,
              borderRight: i < 3 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-faint)",
                marginBottom: 2,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: m.accent ? "var(--accent)" : "var(--ink)",
                letterSpacing: "-0.03em",
              }}
            >
              {m.value}
            </div>
          </div>
        ))}

        {/* 7-day sparkline */}
        <div style={{ width: 80, height: 32, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--accent)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Geo context */}
        {geoLabel && (
          <div
            style={{
              marginLeft: 24,
              paddingLeft: 24,
              borderLeft: "1px solid var(--border)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {topGeo!.flag} {geoLabel}
          </div>
        )}

        {/* Platform badge */}
        <div
          style={{
            marginLeft: 24,
            paddingLeft: 24,
            borderLeft: "1px solid var(--border)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {analysis.reels_count != null && analysis.reels_count > 0 ? (
            <>
              <span>TikTok: {formatNumber(analysis.videos_analyzed)}</span>
              <span style={{ color: "var(--ink-faint)" }}>|</span>
              <span>Reels: {formatNumber(analysis.reels_count)}</span>
            </>
          ) : (
            <span>TikTok Only</span>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div
        style={{
          padding: "0 24px 20px",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--overlay-subtle)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-secondary)",
            lineHeight: 1.55,
            borderLeft: "3px solid var(--accent)",
          }}
        >
          {analysis.ai_summary ??
            `Accelerating in ${topGeo?.country ?? "key markets"} via ${analysis.winner.format}. Monitor velocity for breakout timing.`}
        </div>
        {analysis.ai_summary_updated_at && (
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              color: "var(--ink-faint)",
              marginTop: 4,
              textAlign: "right",
            }}
          >
            Summary updated {timeAgo(analysis.ai_summary_updated_at)}
          </div>
        )}
      </div>
    </div>
  );
}
