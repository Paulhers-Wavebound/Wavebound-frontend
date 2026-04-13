/**
 * A&R Pipeline Row — CSS grid row with inline expand on click.
 * Chevron button navigates to full prospect page.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ARProspect } from "@/types/arTypes";
import {
  PIPELINE_STAGE_CONFIG,
  THRESHOLD_CONFIG,
  getRiseProbabilityColor,
} from "@/types/arTypes";

/* ─── Avatar with initials fallback ───────────────────────── */

function ProspectAvatar({
  name,
  url,
  size = 32,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (!url || failed) {
    return (
      <span
        className="rounded-full shrink-0 flex items-center justify-center bg-white/[0.06] text-white/40 font-semibold"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

/* ─── Sparkline SVG ───────────────────────────────────────── */

function VelocitySparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const w = 64;
  const h = 20;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const trending = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={trending ? "#30D158" : "#FF453A"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Flag emoji helper ───────────────────────────────────── */

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/* ─── Source platform icon (shown in collapsed row) ──────── */

function SourcePlatformIcon({ platform }: { platform?: string }) {
  if (!platform) return null;
  if (platform === "tiktok") {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="rgba(255,255,255,0.25)"
        className="shrink-0"
        aria-label="Discovered on TikTok"
      >
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.2 8.2 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z" />
      </svg>
    );
  }
  if (platform === "instagram") {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-label="Discovered on Instagram"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
      </svg>
    );
  }
  return null;
}

/* ─── Grid columns ────────────────────────────────────────── */

const GRID_COLS = "2fr 0.7fr 0.9fr 0.7fr 0.8fr 1fr 0.7fr 0.9fr";

export { GRID_COLS };

/* ─── Bible §2 Threshold definitions ─────────────────────── */

const THRESHOLDS: {
  key: string;
  label: string;
  getValue: (m: ARProspect["metrics"]) => number | null;
  threshold: number;
  format: (v: number) => string;
  direction: "gte" | "lte";
}[] = [
  {
    key: "sml",
    label: "Spotify ML",
    getValue: (m) => m?.spotify_monthly_listeners ?? null,
    threshold: 50000,
    format: (v) => formatK(v),
    direction: "gte",
  },
  {
    key: "growth",
    label: "Follower Growth",
    getValue: (m) => m?.spotify_follower_growth_mom ?? null,
    threshold: 15,
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
    direction: "gte",
  },
  {
    key: "save",
    label: "Save Rate",
    getValue: (m) => m?.spotify_save_rate ?? null,
    threshold: 10,
    format: (v) => `${v.toFixed(1)}%`,
    direction: "gte",
  },
  {
    key: "eng",
    label: "Engagement",
    getValue: (m) => m?.social_engagement_rate ?? null,
    threshold: 5,
    format: (v) => `${v.toFixed(1)}%`,
    direction: "gte",
  },
  {
    key: "completion",
    label: "30s Completion",
    getValue: (m) => m?.track_completion_rate_30s ?? null,
    threshold: 60,
    format: (v) => `${v.toFixed(0)}%`,
    direction: "gte",
  },
  {
    key: "social",
    label: "Social Reach",
    getValue: (m) =>
      (m?.tiktok_followers ?? 0) + (m?.instagram_followers ?? 0) || null,
    threshold: 10000,
    format: (v) => formatK(v),
    direction: "gte",
  },
];

/* ─── Comment Intent bar labels ──────────────────────────── */

const INTENT_LABELS: {
  key: keyof ARProspect["comment_intent"]["distribution"];
  label: string;
  color: string;
}[] = [
  { key: "purchase_intent", label: "Purchase", color: "#30D158" },
  { key: "event_intent", label: "Event", color: "#0A84FF" },
  { key: "collab_request", label: "Collab", color: "#BF5AF2" },
  { key: "artist_recognition", label: "Recognition", color: "#FFD60A" },
  { key: "casual_praise", label: "Casual", color: "rgba(255,255,255,0.25)" },
  { key: "emoji_only", label: "Emoji", color: "rgba(255,255,255,0.12)" },
];

/* ─── Funnel health colors ───────────────────────────────── */

const FUNNEL_COLORS: Record<string, string> = {
  strong: "#30D158",
  moderate: "#FFD60A",
  weak: "#FF9F0A",
  broken: "#FF453A",
};

/* ─── Social link helpers ────────────────────────────────── */

function buildTikTokUrl(handle: string): string {
  return `https://www.tiktok.com/@${handle.replace(/^@/, "")}`;
}

function buildInstagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}`;
}

const SOCIAL_LINK_CLS =
  "flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-white/[0.06]";

function SocialLinks({ prospect }: { prospect: ARProspect }) {
  const tiktokHandle =
    prospect.tiktok_handle ||
    (prospect.source_platform === "tiktok" ? prospect.source_handle : null);
  const igHandle =
    prospect.instagram_handle ||
    (prospect.source_platform === "instagram" ? prospect.source_handle : null);
  const dv = prospect.discovery_video;

  const hasSocials =
    tiktokHandle || igHandle || prospect.spotify_url || dv?.web_url;
  if (!hasSocials) return null;

  return (
    <div className="space-y-1.5">
      {/* Social profile links */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tiktokHandle && (
          <a
            href={buildTikTokUrl(tiktokHandle)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={SOCIAL_LINK_CLS}
            style={{ background: "rgba(255,255,255,0.03)" }}
            title={`@${tiktokHandle}`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="rgba(255,255,255,0.55)"
            >
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.2 8.2 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z" />
            </svg>
            <span className="text-[9px] text-white/40">@{tiktokHandle}</span>
          </a>
        )}
        {igHandle && (
          <a
            href={buildInstagramUrl(igHandle)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={SOCIAL_LINK_CLS}
            style={{ background: "rgba(255,255,255,0.03)" }}
            title={`@${igHandle}`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle
                cx="17.5"
                cy="6.5"
                r="1.5"
                fill="rgba(255,255,255,0.55)"
                stroke="none"
              />
            </svg>
            <span className="text-[9px] text-white/40">@{igHandle}</span>
          </a>
        )}
        {prospect.spotify_url && (
          <a
            href={prospect.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={SOCIAL_LINK_CLS}
            style={{ background: "rgba(255,255,255,0.03)" }}
            title="Spotify"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="rgba(255,255,255,0.55)"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span className="text-[9px] text-white/40">Spotify</span>
          </a>
        )}
      </div>

      {/* Discovery video — the video that got them into the pipeline */}
      {dv?.web_url && (
        <a
          href={dv.web_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded transition-colors hover:bg-white/[0.04] -mx-1"
          style={{ background: "rgba(232,67,10,0.04)" }}
        >
          {/* Thumbnail */}
          {dv.video_cover_url ? (
            <div className="w-8 h-8 rounded shrink-0 overflow-hidden relative">
              <img
                src={dv.video_cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play size={10} fill="white" className="text-white" />
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center bg-white/[0.04]">
              <Play size={10} className="text-white/20" />
            </div>
          )}
          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] font-semibold uppercase tracking-wider"
                style={{ color: "#e8430a" }}
              >
                Discovery Video
              </span>
              {dv.performance_multiplier &&
                (() => {
                  const mult = parseFloat(dv.performance_multiplier);
                  const label =
                    mult >= 50
                      ? "MEGA VIRAL"
                      : mult >= 10
                        ? "VIRAL"
                        : mult >= 3
                          ? "HIGH"
                          : "";
                  const color =
                    mult >= 50
                      ? "#30D158"
                      : mult >= 10
                        ? "#0A84FF"
                        : mult >= 3
                          ? "#FFD60A"
                          : "rgba(255,255,255,0.40)";
                  const bg =
                    mult >= 50
                      ? "rgba(48,209,88,0.10)"
                      : mult >= 10
                        ? "rgba(10,132,255,0.10)"
                        : mult >= 3
                          ? "rgba(255,214,10,0.10)"
                          : "rgba(255,255,255,0.04)";
                  return label ? (
                    <span
                      className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded"
                      style={{ color, background: bg }}
                    >
                      {label}
                    </span>
                  ) : null;
                })()}
              <ExternalLink size={9} className="text-white/15 shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-medium tabular-nums"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {formatK(dv.play_count)} plays
              </span>
              <span
                className="text-[9px] tabular-nums text-white/30"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatK(dv.like_count)} likes
              </span>
              {dv.collect_count > 0 && (
                <span
                  className="text-[9px] tabular-nums text-white/30"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatK(dv.collect_count)} saves
                </span>
              )}
              {dv.creator_median_views != null &&
                dv.creator_median_views > 0 && (
                  <span className="text-[9px] text-white/25">
                    ({Math.round(dv.play_count / dv.creator_median_views)}x
                    median)
                  </span>
                )}
            </div>
            {dv.music_title && (
              <span className="text-[9px] text-white/25 truncate block mt-0.5">
                {dv.music_title}
                {dv.music_author ? ` — ${dv.music_author}` : ""}
              </span>
            )}
          </div>
        </a>
      )}
    </div>
  );
}

/* ─── Expanded detail section ─────────────────────────────── */

function ExpandedDetail({ prospect }: { prospect: ARProspect }) {
  const navigate = useNavigate();
  const metrics = prospect.metrics;
  const sig = prospect.signability;
  const ci = prospect.comment_intent;
  const xp = prospect.cross_platform;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      style={{ overflow: "hidden" }}
    >
      <div
        className="px-5 pt-3 pb-4 space-y-4"
        style={{ background: "#141416" }}
      >
        {/* Row 1: Threshold Check + Signability + AI narrative */}
        <div className="flex gap-6 flex-wrap">
          {/* Threshold Check (Bible §2) */}
          <div className="flex-1 min-w-[280px]">
            <SectionLabel>Threshold Check</SectionLabel>
            <div className="grid grid-cols-3 gap-x-5 gap-y-1.5">
              {THRESHOLDS.map((t) => {
                const val = t.getValue(metrics);
                const pass =
                  val != null
                    ? t.direction === "gte"
                      ? val >= t.threshold
                      : val <= t.threshold
                    : null;
                return (
                  <div key={t.key} className="flex items-center gap-2">
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
                    <span className="text-[9px] text-white/30 uppercase tracking-wider">
                      {t.label}
                    </span>
                    <span
                      className="text-[11px] font-medium tabular-nums ml-auto"
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

          {/* Signability pills */}
          <div className="min-w-[180px]">
            <SectionLabel>Signability</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <SigPill label="Creative" value={sig?.creative} />
              <SigPill label="Commercial" value={sig?.commercial} />
              <SigPill label="Legal" value={sig?.legal_pulse} />
              <SigPill label="360" value={sig?.three_sixty_upside} />
            </div>
            {prospect.risk_flags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
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
            )}
          </div>

          {/* AI narrative + link */}
          <div className="flex-1 min-w-[180px] flex flex-col gap-2">
            {prospect.ai_narrative && (
              <p className="text-[11px] text-white/50 leading-relaxed">
                {prospect.ai_narrative}
              </p>
            )}
            {/* Social links — constructed from handles */}
            <SocialLinks prospect={prospect} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/label/ar/prospect/${prospect.id}`);
              }}
              className="self-start text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors mt-auto"
              style={{
                color: "#e8430a",
                background: "rgba(232,67,10,0.08)",
              }}
            >
              Full Dossier →
            </button>
          </div>
        </div>

        {/* Row 2: Comment Intent + Cross-Platform Funnel */}
        <div className="flex gap-6 flex-wrap">
          {/* Comment Intent (Bible §4 — "100 'when touring London?' > 10K fire emojis") */}
          {ci && ci.total_analyzed > 0 && (
            <div className="flex-1 min-w-[300px]">
              <SectionLabel>
                Comment Intent
                <span className="ml-2 text-[9px] text-white/20 normal-case tracking-normal font-normal">
                  {ci.total_analyzed.toLocaleString()} analyzed
                </span>
              </SectionLabel>
              <div className="space-y-1">
                {INTENT_LABELS.map((il) => {
                  const pct = ci.distribution[il.key] ?? 0;
                  if (pct === 0) return null;
                  return (
                    <div key={il.key} className="flex items-center gap-2">
                      <span className="text-[9px] text-white/35 w-[60px] text-right shrink-0">
                        {il.label}
                      </span>
                      <div
                        className="flex-1 h-[6px] rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            background: il.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] tabular-nums w-[32px] text-right"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: il.color,
                        }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {ci.top_signals.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ci.top_signals.slice(0, 3).map((s, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-white/40 px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      "{s}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cross-Platform Funnel (Bible §10 rule 8 — "the killer metric") */}
          {xp && (
            <div className="min-w-[220px]">
              <SectionLabel>Cross-Platform Funnel</SectionLabel>
              <div className="flex items-center gap-1">
                <FunnelStep
                  label="TikTok"
                  value={`${(xp.tiktok_to_spotify * 100).toFixed(1)}%`}
                  sublabel="→ Spotify"
                />
                <FunnelArrow />
                <FunnelStep
                  label="Spotify"
                  value={`${(xp.spotify_to_ig_follow * 100).toFixed(1)}%`}
                  sublabel="→ IG"
                />
                {xp.ig_to_merch != null && (
                  <>
                    <FunnelArrow />
                    <FunnelStep
                      label="IG"
                      value={`${(xp.ig_to_merch * 100).toFixed(1)}%`}
                      sublabel="→ Merch"
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: FUNNEL_COLORS[xp.funnel_health] ?? "#8E8E93",
                  }}
                />
                <span className="text-[10px] text-white/40 capitalize">
                  {xp.funnel_health} · {xp.migration_trend}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
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
    </div>
  );
}

function SigPill({
  label,
  value,
}: {
  label: string;
  value?: { score: number } | number;
}) {
  const v = typeof value === "object" ? (value?.score ?? 0) : (value ?? 0);
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">
      {children}
    </div>
  );
}

function FunnelStep({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div
      className="flex flex-col items-center px-3 py-2 rounded"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <span className="text-[9px] text-white/30">{label}</span>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(255,255,255,0.75)",
        }}
      >
        {value}
      </span>
      <span className="text-[8px] text-white/20">{sublabel}</span>
    </div>
  );
}

function FunnelArrow() {
  return <span className="text-[10px] text-white/15 px-0.5">→</span>;
}

function formatK(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/* ─── Row ─────────────────────────────────────────────────── */

export default function ARPipelineRow({
  prospect,
  index,
  onClick,
}: {
  prospect: ARProspect;
  index: number;
  onClick?: (prospect: ARProspect) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const stage = PIPELINE_STAGE_CONFIG[prospect.pipeline_stage];
  const rpColor = getRiseProbabilityColor(prospect.rise_probability);
  const hasRisk = prospect.risk_flags.length > 0;

  const topMarket = prospect.trigger_markets[0];
  const topSignal = topMarket
    ? `${countryFlag(topMarket.country_code)} ${topMarket.country_name} #${topMarket.position ?? "—"} ${topMarket.platform}`
    : "—";

  const handleClick = () => {
    if (onClick) {
      onClick(prospect);
    } else {
      setExpanded((e) => !e);
    }
  };

  return (
    <div
      style={{
        borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,0.04)",
        animation: `labelRowIn 200ms ease-out ${index * 25}ms both`,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleClick();
        }}
        className="group grid items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-white/[0.02]"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {/* Artist */}
        <div className="flex items-center gap-3 min-w-0">
          <ProspectAvatar
            name={prospect.artist_name}
            url={prospect.avatar_url}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[13px] font-medium truncate"
                style={{ color: "rgba(255,255,255,0.87)" }}
              >
                {prospect.artist_name}
              </span>
              {hasRisk && (
                <ShieldAlert
                  size={12}
                  style={{ color: "#FF453A", flexShrink: 0 }}
                />
              )}
              <SourcePlatformIcon platform={prospect.source_platform} />
            </div>
            <span className="text-[11px] text-white/35 truncate block">
              {countryFlag(prospect.origin_country)} {prospect.genre}
            </span>
          </div>
        </div>

        {/* Rise Probability */}
        <div className="flex items-center justify-center">
          <span
            className="text-[16px] font-bold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color: rpColor,
            }}
          >
            {prospect.rise_probability.toFixed(1)}
          </span>
        </div>

        {/* Pipeline Stage */}
        <div className="flex items-center justify-center">
          <span
            className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
            style={{ color: stage.color, background: stage.bg }}
          >
            {stage.label}
          </span>
        </div>

        {/* 7d Velocity */}
        <div className="flex items-center gap-1.5 justify-center">
          <VelocitySparkline data={prospect.sparkline_data} />
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color:
                prospect.metrics.seven_day_velocity > 10
                  ? "#30D158"
                  : prospect.metrics.seven_day_velocity > 0
                    ? "rgba(255,255,255,0.55)"
                    : "#FF453A",
            }}
          >
            {prospect.metrics.seven_day_velocity > 0 ? "+" : ""}
            {prospect.metrics.seven_day_velocity.toFixed(1)}%
          </span>
        </div>

        {/* Format Alpha */}
        <div className="flex items-center justify-center">
          <span className="text-[11px] text-white/55 truncate">
            {prospect.format_alpha.best_format}
            {prospect.format_alpha.best_format_engagement_lift > 0 && (
              <span className="text-[10px] ml-1" style={{ color: "#0A84FF" }}>
                +{prospect.format_alpha.best_format_engagement_lift}%
              </span>
            )}
          </span>
        </div>

        {/* Top Signal */}
        <div className="flex items-center min-w-0">
          <span className="text-[11px] text-white/55 truncate">
            {topSignal}
          </span>
        </div>

        {/* Signability Score */}
        <div className="flex items-center justify-center">
          <span
            className="text-[13px] font-semibold tabular-nums"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              color:
                prospect.signability.overall >= 80
                  ? "#30D158"
                  : prospect.signability.overall >= 60
                    ? "#0A84FF"
                    : prospect.signability.overall >= 40
                      ? "#FFD60A"
                      : "#FF453A",
            }}
          >
            {prospect.signability.overall}
          </span>
        </div>

        {/* Ghost Curve Match + expand indicator */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-[11px] text-white/55 truncate">
            {prospect.ghost_curve_match ? (
              <>
                {prospect.ghost_curve_match.artist_name}{" "}
                <span
                  className="tabular-nums font-medium"
                  style={{
                    color:
                      prospect.ghost_curve_match.match_pct >= 75
                        ? "#30D158"
                        : prospect.ghost_curve_match.match_pct >= 50
                          ? "#0A84FF"
                          : "rgba(255,255,255,0.40)",
                  }}
                >
                  {prospect.ghost_curve_match.match_pct}%
                </span>
              </>
            ) : (
              <span className="text-white/25">—</span>
            )}
          </span>
          {expanded ? (
            <ChevronDown size={14} className="text-white/30 shrink-0 ml-1" />
          ) : (
            <ChevronRight
              size={14}
              className="text-white/0 group-hover:text-white/30 transition-colors shrink-0 ml-1"
            />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && <ExpandedDetail prospect={prospect} />}
      </AnimatePresence>
    </div>
  );
}
