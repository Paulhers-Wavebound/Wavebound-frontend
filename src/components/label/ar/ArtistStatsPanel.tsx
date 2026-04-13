/**
 * ArtistStatsPanel — Key metrics for the selected artist in Simulation Lab.
 * Shows the data that feeds deal algorithms (Bible §2/§4/§5).
 */
import { useState } from "react";
import type { ARProspect } from "@/types/arTypes";
import { getRiseProbabilityColor } from "@/types/arTypes";

/* ─── Threshold definitions (Bible §2) ─────────────────────── */

interface ThresholdDef {
  label: string;
  getValue: (m: ARProspect["metrics"]) => number | null;
  threshold: number;
  format: (v: number) => string;
}

const THRESHOLDS: ThresholdDef[] = [
  {
    label: "Spotify ML",
    getValue: (m) => m?.spotify_monthly_listeners ?? null,
    threshold: 50000,
    format: (v) => formatK(v),
  },
  {
    label: "Follower Growth",
    getValue: (m) => m?.spotify_follower_growth_mom ?? null,
    threshold: 15,
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
  },
  {
    label: "Save Rate",
    getValue: (m) => m?.spotify_save_rate ?? null,
    threshold: 10,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    label: "Engagement",
    getValue: (m) => m?.social_engagement_rate ?? null,
    threshold: 5,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    label: "30s Completion",
    getValue: (m) => m?.track_completion_rate_30s ?? null,
    threshold: 60,
    format: (v) => `${v.toFixed(0)}%`,
  },
  {
    label: "Social Reach",
    getValue: (m) =>
      (m?.tiktok_followers ?? 0) + (m?.instagram_followers ?? 0) || null,
    threshold: 10000,
    format: (v) => formatK(v),
  },
];

/* ─── Component ───────────────────────────────────────────── */

interface ArtistStatsPanelProps {
  prospect: ARProspect;
}

export default function ArtistStatsPanel({ prospect }: ArtistStatsPanelProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const m = prospect.metrics;
  const sig = prospect.signability;
  const gc = prospect.ghost_curve_match;
  const gv = prospect.growth_velocity;
  const rpColor = getRiseProbabilityColor(prospect.rise_probability);

  const initials = prospect.artist_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const passCount = THRESHOLDS.filter((t) => {
    const v = t.getValue(m);
    return v != null && v >= t.threshold;
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {prospect.avatar_url && !imgFailed ? (
          <img
            src={prospect.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full object-cover shrink-0"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-white/[0.06] text-white/40 font-semibold text-[14px]">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[15px] font-semibold truncate"
              style={{ color: "rgba(255,255,255,0.87)" }}
            >
              {prospect.artist_name}
            </span>
            <span
              className="text-[13px] font-bold tabular-nums shrink-0"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: rpColor,
              }}
            >
              {prospect.rise_probability.toFixed(1)}
            </span>
          </div>
          <span className="text-[11px] text-white/35 block truncate">
            {prospect.genre} · {prospect.origin_country}
          </span>
        </div>
      </div>

      {/* Threshold Check */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Threshold Check</SectionLabel>
          <span
            className="text-[10px] tabular-nums"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color:
                passCount >= 5
                  ? "#30D158"
                  : passCount >= 3
                    ? "#FFD60A"
                    : "#FF453A",
            }}
          >
            {passCount}/{THRESHOLDS.length} passed
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {THRESHOLDS.map((t) => {
            const val = t.getValue(m);
            const pass = val != null ? val >= t.threshold : null;
            return (
              <div key={t.label} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      pass === null
                        ? "rgba(255,255,255,0.15)"
                        : pass
                          ? "#30D158"
                          : "#FF453A",
                  }}
                />
                <span className="text-[9px] text-white/30 uppercase tracking-wider flex-1">
                  {t.label}
                </span>
                <span
                  className="text-[11px] font-medium tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color:
                      pass === null
                        ? "rgba(255,255,255,0.20)"
                        : pass
                          ? "#30D158"
                          : "#FF453A",
                  }}
                >
                  {val != null ? t.format(val) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signability */}
      <div>
        <SectionLabel>Signability</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <SigPill label="Creative" value={sig?.creative?.score} />
          <SigPill label="Commercial" value={sig?.commercial?.score} />
          <SigPill label="Legal" value={sig?.legal_pulse?.score} />
          <SigPill label="360" value={sig?.three_sixty_upside?.score} />
        </div>
      </div>

      {/* Deal Inputs */}
      <div>
        <SectionLabel>Deal Inputs</SectionLabel>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2">
          <StatItem
            label="Growth Velocity"
            value={
              gv ? `${gv.value > 0 ? "+" : ""}${gv.value.toFixed(1)}` : "—"
            }
            sub={gv?.trend}
            color={
              gv?.trend === "accelerating"
                ? "#30D158"
                : gv?.trend === "decelerating"
                  ? "#FF453A"
                  : undefined
            }
          />
          <StatItem
            label="Ghost Curve"
            value={gc ? `${gc.match_pct}%` : "—"}
            sub={gc?.artist_name}
            color={
              gc
                ? gc.match_pct >= 75
                  ? "#30D158"
                  : gc.match_pct >= 50
                    ? "#0A84FF"
                    : undefined
                : undefined
            }
          />
          <StatItem
            label="Conversion Alpha"
            value={
              m?.conversion_alpha != null ? m.conversion_alpha.toFixed(2) : "—"
            }
          />
          <StatItem
            label="7d Velocity"
            value={
              m?.seven_day_velocity != null
                ? `${m.seven_day_velocity > 0 ? "+" : ""}${m.seven_day_velocity.toFixed(1)}%`
                : "—"
            }
            color={
              (m?.seven_day_velocity ?? 0) > 10
                ? "#30D158"
                : (m?.seven_day_velocity ?? 0) < 0
                  ? "#FF453A"
                  : undefined
            }
          />
        </div>
      </div>

      {/* Risk Flags */}
      {prospect.risk_flags.length > 0 && (
        <div>
          <SectionLabel>Risk Flags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {prospect.risk_flags.map((flag) => (
              <span
                key={flag}
                className="text-[9px] font-medium px-2 py-0.5 rounded"
                style={{
                  color: "#FF453A",
                  background: "rgba(255,69,58,0.10)",
                }}
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Narrative */}
      {prospect.ai_narrative && (
        <p className="text-[11px] text-white/40 leading-relaxed border-t border-white/[0.04] pt-3">
          {prospect.ai_narrative}
        </p>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">
      {children}
    </div>
  );
}

function SigPill({ label, value }: { label: string; value?: number }) {
  const v = value ?? 0;
  const color =
    v >= 80 ? "#30D158" : v >= 60 ? "#0A84FF" : v >= 40 ? "#FFD60A" : "#FF453A";
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <span className="text-[9px] text-white/35">{label}</span>
      <span
        className="text-[11px] font-semibold tabular-nums"
        style={{ fontFamily: "'JetBrains Mono', monospace", color }}
      >
        {v}
      </span>
    </div>
  );
}

function StatItem({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[9px] text-white/25 uppercase tracking-wider">
        {label}
      </div>
      <div
        className="text-[12px] font-medium tabular-nums mt-0.5"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: color ?? "rgba(255,255,255,0.70)",
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] text-white/25 mt-0.5 capitalize">{sub}</div>
      )}
    </div>
  );
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
