/**
 * Sounds Tab — "Which music is hot and where?"
 *
 * 6 decision-ordered sections:
 * 1. Sound Pulse Hero — catalog health at a glance
 * 2. Catalog Velocity — which songs are moving right now
 * 3. TikTok Sound Performance — UGC signals + cross-platform gap
 * 4. Streaming Intelligence — DSP metrics + momentum chart
 * 5. Playlist Intelligence — placement reach & strategy
 * 6. Sound DNA & Discovery — genre, mood, hook/viral scores
 */
import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type {
  ContentIntelData,
  MomentumPoint,
} from "@/hooks/useContentIntelligence";
import {
  fmtNum,
  StatChip,
  SectionCard,
  SubScoreBar,
  PlatformTrendPill,
  Gauge,
  EmptyState,
} from "./shared";
import InfoTooltip from "@/components/label/intelligence/InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const SP = STAT_TOOLTIPS.sounds.pulse;
const SV = STAT_TOOLTIPS.sounds.velocity;
const ST = STAT_TOOLTIPS.sounds.tiktok;
const SS = STAT_TOOLTIPS.sounds.streaming;
const SPL = STAT_TOOLTIPS.sounds.playlists;
const SD = STAT_TOOLTIPS.sounds.dna;

/* ─── Color Configs ──────────────────────────────────────────── */

const VELOCITY_COLORS: Record<string, { color: string; bg: string }> = {
  viral: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  accelerating: { color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  growing: { color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  steady: { color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
  decelerating: { color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  declining: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  new: { color: "#BF5AF2", bg: "rgba(191,90,242,0.12)" },
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  viral: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  trending: { color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  active: { color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  established: { color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  emerging: { color: "#BF5AF2", bg: "rgba(191,90,242,0.12)" },
};

const REACH_TIER_COLORS: Record<string, string> = {
  massive: "#FF453A",
  high: "#FF9F0A",
  medium: "#0A84FF",
  low: "#8E8E93",
};

const GRADE_COLORS: Record<string, { color: string; bg: string }> = {
  A: { color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  B: { color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  C: { color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  D: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  F: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
};

const GAP_LABELS: Record<string, { label: string; color: string }> = {
  tiktok_hot_spotify_cold: {
    label: "TT hot \u2192 DSP cold",
    color: "#FF9F0A",
  },
  spotify_hot_tiktok_cold: {
    label: "DSP hot \u2192 TT cold",
    color: "#0A84FF",
  },
  both_hot: { label: "Both hot", color: "#30D158" },
  both_cold: { label: "Both cold", color: "#8E8E93" },
};

/* ─── Momentum Sparkline (SVG) ───────────────────────────────── */

function MomentumMiniSparkline({ points }: { points: MomentumPoint[] }) {
  const { path, area } = useMemo(() => {
    if (!points.length) return { path: "", area: "" };
    const w = 160;
    const h = 32;
    const pad = 2;
    const scores = points.map((p) => p.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 1;
    const pts = points.map((p, i) => ({
      x: pad + (i / (points.length - 1)) * (w - pad * 2),
      y: h - pad - ((p.score - min) / range) * (h - pad * 2),
    }));
    const linePath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");
    const areaPath = `${linePath} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
    return { path: linePath, area: areaPath };
  }, [points]);

  if (!points.length) return null;
  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest.score - first.score;

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 160 32" className="w-[160px] h-[32px]">
        <defs>
          <linearGradient id="soundsMomentumGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#soundsMomentumGrad)" />
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="text-[11px] font-mono font-medium tabular-nums shrink-0"
        style={{
          color: delta > 0 ? "#30D158" : delta < -3 ? "#FF453A" : "#8E8E93",
        }}
      >
        {delta > 0 ? "+" : ""}
        {delta.toFixed(0)} 30d
      </span>
    </div>
  );
}

/* ─── Momentum Tooltip ───────────────────────────────────────── */

function MomentumTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#1C1C1E",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        padding: "6px 10px",
      }}
    >
      <div className="text-[10px] text-white/40 font-mono">{d.date}</div>
      <div className="text-[13px] text-white/87 font-mono font-semibold">
        {d.score}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

interface SoundsTabProps {
  data: ContentIntelData;
}

export default function SoundsTab({ data }: SoundsTabProps) {
  const sp = data.streamingPulse;
  const pl = data.playlistIntel;
  const dna = data.contentDna;

  const hasHero =
    data.catalogScore != null ||
    data.momentumSparkline.length > 0 ||
    data.hotSongsCount != null;
  const hasVelocity = data.songVelocity.length > 0;
  const hasTikTok = data.topSongs.length > 0 || data.tiktokGrade != null;
  const hasStreaming =
    sp != null &&
    (sp.spotifyMonthlyListeners != null || sp.spotifyDailyStreams != null);
  const hasPlaylist =
    pl != null && (pl.songsInPlaylists > 0 || pl.totalPlaylistPlacements > 0);
  const hasDna = dna != null || data.discoveryScore != null;
  const hasAnything =
    hasHero ||
    hasVelocity ||
    hasTikTok ||
    hasStreaming ||
    hasPlaylist ||
    hasDna;

  return (
    <div className="space-y-4">
      {/* ════════════════════════════════════════════════════════
          1. SOUND PULSE HERO
          ════════════════════════════════════════════════════════ */}
      {hasHero && (
        <SectionCard title="Sound Pulse" tooltip={SP.section}>
          <div className="flex items-center gap-6 flex-wrap">
            {/* Catalog Score gauge */}
            {data.catalogScore != null && (
              <Gauge
                label="Catalog"
                value={data.catalogScore}
                color={
                  data.catalogScore >= 60
                    ? "#30D158"
                    : data.catalogScore >= 30
                      ? "#FF9F0A"
                      : "#FF453A"
                }
                size={68}
                tooltip={SP.catalogScore}
              />
            )}

            {/* Key stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 flex-1 min-w-0">
              {data.hotSongsCount != null && data.hotSongsCount > 0 && (
                <StatChip
                  label="Hot Songs"
                  value={String(data.hotSongsCount)}
                  tooltip={SP.hotSongs}
                />
              )}
              {data.soundSparkScore != null && (
                <StatChip
                  label="Sound Spark"
                  value={data.soundSparkScore.toFixed(0)}
                  tooltip={SP.soundSparkScore}
                />
              )}
              {data.catalogDailyStreams != null &&
                data.catalogDailyStreams > 0 && (
                  <StatChip
                    label="Catalog Streams"
                    value={fmtNum(data.catalogDailyStreams)}
                    sub={
                      data.catalogPctChange7d != null
                        ? `${data.catalogPctChange7d > 0 ? "+" : ""}${data.catalogPctChange7d.toFixed(1)}% 7d`
                        : undefined
                    }
                    color={
                      data.catalogPctChange7d != null &&
                      data.catalogPctChange7d > 0
                        ? "#30D158"
                        : data.catalogPctChange7d != null &&
                            data.catalogPctChange7d < -5
                          ? "#FF453A"
                          : undefined
                    }
                    tooltip={SP.catalogDailyStreams}
                  />
                )}
            </div>

            {/* Momentum sparkline */}
            {data.momentumSparkline.length >= 5 && (
              <div className="shrink-0 inline-flex items-center gap-1">
                <MomentumMiniSparkline points={data.momentumSparkline} />
                <InfoTooltip text={SP.momentumSparkline} />
              </div>
            )}
          </div>

          {/* Status badges + platform trends */}
          {(data.viralSongs != null ||
            data.songsAccelerating != null ||
            data.spotifyTrend != null ||
            data.tiktokTrend != null) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
              {data.viralSongs != null && data.viralSongs > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#FF453A] bg-[rgba(255,69,58,0.12)] inline-flex items-center gap-1">
                  {data.viralSongs} viral
                  <InfoTooltip text={SP.viralSongs} />
                </span>
              )}
              {data.songsAccelerating != null && data.songsAccelerating > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#30D158] bg-[rgba(48,209,88,0.12)] inline-flex items-center gap-1">
                  {data.songsAccelerating} accelerating
                  <InfoTooltip text={SP.acceleratingSongs} />
                </span>
              )}
              <div className="flex-1" />
              <PlatformTrendPill
                label="Spotify"
                value={data.spotifyTrend}
                tooltip={STAT_TOOLTIPS.overview.spotifyTrend}
              />
              <PlatformTrendPill
                label="TikTok"
                value={data.tiktokTrend}
                tooltip={STAT_TOOLTIPS.overview.tiktokTrend}
              />
              <PlatformTrendPill
                label="Shazam"
                value={data.shazamTrend}
                tooltip={STAT_TOOLTIPS.overview.shazamTrend}
              />
            </div>
          )}
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════
          2. CATALOG VELOCITY
          ════════════════════════════════════════════════════════ */}
      {hasVelocity && (
        <SectionCard title="Catalog Velocity" tooltip={SV.section}>
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_60px_80px] gap-2 text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-1 px-1">
            <span>Song</span>
            <span className="text-right inline-flex items-center justify-end gap-1">
              Daily
              <InfoTooltip text={SV.dailyStreams} />
            </span>
            <span className="text-right inline-flex items-center justify-end gap-1">
              Total
              <InfoTooltip text={SV.totalStreams} />
            </span>
            <span className="text-right inline-flex items-center justify-end gap-1">
              7d
              <InfoTooltip text={SV.change7d} />
            </span>
            <span className="text-right inline-flex items-center justify-end gap-1">
              Velocity
              <InfoTooltip text={SV.velocityClass} />
            </span>
          </div>

          <div className="space-y-0">
            {data.songVelocity.map((s, i) => {
              const velCfg =
                VELOCITY_COLORS[s.velocityClass] ?? VELOCITY_COLORS.steady;
              const nearPeak = s.peakRatio != null && s.peakRatio >= 0.85;
              return (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_60px_80px] gap-2 items-center py-2 px-1"
                  style={{
                    borderBottom:
                      i < data.songVelocity.length - 1
                        ? "1px solid rgba(255,255,255,0.03)"
                        : undefined,
                  }}
                >
                  <span className="text-[13px] font-medium text-white/75 truncate flex items-center gap-1.5">
                    {s.songName}
                    {nearPeak && (
                      <span className="text-[9px] font-mono text-[#FFD60A] shrink-0 inline-flex items-center gap-1">
                        near peak
                        <InfoTooltip text={SV.nearPeak} />
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] font-mono text-white/55 tabular-nums text-right">
                    {fmtNum(s.dailyStreams)}
                  </span>
                  <span className="text-[12px] font-mono text-white/35 tabular-nums text-right">
                    {fmtNum(s.totalStreams)}
                  </span>
                  <span
                    className="text-[11px] font-mono font-semibold tabular-nums text-right"
                    style={{
                      color:
                        s.pctChange7d != null
                          ? s.pctChange7d > 0
                            ? "#30D158"
                            : s.pctChange7d < -5
                              ? "#FF453A"
                              : "rgba(255,255,255,0.35)"
                          : undefined,
                    }}
                  >
                    {s.pctChange7d != null
                      ? `${s.pctChange7d > 0 ? "+" : ""}${s.pctChange7d.toFixed(0)}%`
                      : "\u2014"}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide text-right px-2 py-0.5 rounded-full inline-flex justify-end"
                    style={{ color: velCfg.color }}
                  >
                    {s.velocityClass}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Song health scores below velocity if available */}
          {data.songHealth.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.04]">
              <div className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-2 px-1 inline-flex items-center gap-1">
                Song Health
                <InfoTooltip text={SV.songHealth} />
              </div>
              <div className="flex flex-wrap gap-3">
                {data.songHealth.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-white/55 truncate max-w-[120px]">
                      {h.songName}
                    </span>
                    <span
                      className="text-[11px] font-mono font-semibold tabular-nums"
                      style={{
                        color:
                          h.healthScore >= 50
                            ? "#30D158"
                            : h.healthScore >= 25
                              ? "#FF9F0A"
                              : "#FF453A",
                      }}
                    >
                      {h.healthScore}
                    </span>
                    {h.countriesCharting != null && h.countriesCharting > 0 && (
                      <span className="text-[9px] text-white/30 font-mono inline-flex items-center gap-1">
                        {h.countriesCharting} countries
                        <InfoTooltip text={SV.countriesCharting} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════
          3. TIKTOK SOUND PERFORMANCE
          ════════════════════════════════════════════════════════ */}
      {hasTikTok && (
        <SectionCard title="Sound Performance on TikTok" tooltip={ST.section}>
          {/* Stats header row */}
          {(data.tiktokGrade != null ||
            data.ttOriginalSoundPct != null ||
            data.ttAvgEngagementRate != null) && (
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-white/[0.04]">
              {data.tiktokGrade != null &&
                (() => {
                  const grade = data.tiktokGrade.charAt(0).toUpperCase();
                  const gradeCfg = GRADE_COLORS[grade] ?? GRADE_COLORS.C;
                  return (
                    <span
                      className="text-[12px] font-bold px-3 py-1 rounded-lg inline-flex items-center gap-1"
                      style={{ color: gradeCfg.color, background: gradeCfg.bg }}
                    >
                      Grade {data.tiktokGrade}
                      <InfoTooltip text={ST.grade} />
                    </span>
                  );
                })()}
              {data.ttOriginalSoundPct != null && (
                <StatChip
                  label="Original Sound"
                  value={`${data.ttOriginalSoundPct.toFixed(0)}%`}
                  tooltip={ST.originalSoundPct}
                />
              )}
              {data.ttAvgEngagementRate != null && (
                <StatChip
                  label="Avg Engagement"
                  value={`${data.ttAvgEngagementRate.toFixed(1)}%`}
                  color={
                    data.ttAvgEngagementRate > 5
                      ? "#30D158"
                      : data.ttAvgEngagementRate < 2
                        ? "#FF453A"
                        : undefined
                  }
                  tooltip={ST.avgEngagement}
                />
              )}
              {data.ttUniqueSoundsUsed != null && (
                <StatChip
                  label="Sounds Used"
                  value={String(data.ttUniqueSoundsUsed)}
                  tooltip={ST.soundsUsed}
                />
              )}
              {data.ttPlaysTrendPct != null && (
                <PlatformTrendPill
                  label="Plays"
                  value={data.ttPlaysTrendPct}
                  tooltip={ST.playsTrend}
                />
              )}
            </div>
          )}

          {/* Song list */}
          {data.topSongs.length > 0 ? (
            <div className="space-y-0">
              {data.topSongs.map((s, i) => {
                const statusCfg =
                  STATUS_COLORS[s.status || ""] ?? STATUS_COLORS.established;
                const gapInfo = GAP_LABELS[s.crossPlatformGap || ""];
                return (
                  <div
                    key={i}
                    className="py-2.5 px-1"
                    style={{
                      borderBottom:
                        i < data.topSongs.length - 1
                          ? "1px solid rgba(255,255,255,0.03)"
                          : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-white/87 flex-1 min-w-0 truncate">
                        {s.songName}
                      </span>
                      <span className="text-[11px] font-mono text-white/45 tabular-nums shrink-0">
                        {fmtNum(s.videoCount)} videos
                      </span>
                      <span className="text-[11px] font-mono text-white/35 tabular-nums shrink-0">
                        {fmtNum(s.uniqueCreators)} creators
                      </span>
                      {s.status && (
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            color: statusCfg.color,
                            background: statusCfg.bg,
                          }}
                        >
                          {s.status}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-white/45 tabular-nums w-[56px] text-right shrink-0">
                        {fmtNum(s.totalPlays)}
                      </span>
                    </div>
                    {/* Second row: engagement details + cross-platform gap */}
                    {(gapInfo ||
                      s.videosLast7d != null ||
                      s.tiktokEngagementRate != null) && (
                      <div className="flex items-center gap-3 mt-1 pl-0">
                        {s.videosLast7d != null && s.videosLast7d > 0 && (
                          <span className="text-[10px] font-mono text-white/30">
                            {s.videosLast7d} new 7d
                          </span>
                        )}
                        {s.tiktokEngagementRate != null && (
                          <span className="text-[10px] font-mono text-white/30">
                            {s.tiktokEngagementRate.toFixed(1)}% eng
                          </span>
                        )}
                        {s.fanToArtistRatio != null &&
                          s.fanToArtistRatio > 1 && (
                            <span className="text-[10px] font-mono text-white/30">
                              {s.fanToArtistRatio.toFixed(0)}:1 fan ratio
                            </span>
                          )}
                        {gapInfo && (
                          <span
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                            style={{
                              color: gapInfo.color,
                              background: `${gapInfo.color}18`,
                            }}
                          >
                            {gapInfo.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="TikTok sound data not yet available" />
          )}
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════
          4. STREAMING INTELLIGENCE
          ════════════════════════════════════════════════════════ */}
      {hasStreaming && (
        <SectionCard title="Streaming Intelligence" tooltip={SS.section}>
          {/* Momentum chart */}
          {data.momentumSparkline.length >= 5 && (
            <div className="mb-4 pb-4 border-b border-white/[0.04]">
              <div className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                30-Day Momentum
                <InfoTooltip text={SS.momentumChart} />
              </div>
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart
                  data={data.momentumSparkline}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="soundsMomentumArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#e8430a"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#e8430a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip content={<MomentumTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#e8430a"
                    strokeWidth={1.5}
                    fill="url(#soundsMomentumArea)"
                    isAnimationActive
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            {sp?.spotifyMonthlyListeners != null && (
              <StatChip
                label="Monthly Listeners"
                value={fmtNum(sp.spotifyMonthlyListeners)}
                sub={
                  sp.spotifyMlPct7d != null
                    ? `${sp.spotifyMlPct7d > 0 ? "+" : ""}${sp.spotifyMlPct7d.toFixed(1)}% 7d`
                    : undefined
                }
                color={
                  sp.spotifyMlPct7d != null && sp.spotifyMlPct7d > 0
                    ? "#30D158"
                    : sp.spotifyMlPct7d != null && sp.spotifyMlPct7d < -5
                      ? "#FF453A"
                      : undefined
                }
                tooltip={SS.monthlyListeners}
              />
            )}
            {sp?.spotifyDailyStreams != null && (
              <StatChip
                label="Daily Streams"
                value={fmtNum(sp.spotifyDailyStreams)}
                sub={
                  sp.spotifyDsPct7d != null
                    ? `${sp.spotifyDsPct7d > 0 ? "+" : ""}${sp.spotifyDsPct7d.toFixed(1)}% 7d`
                    : undefined
                }
                color={
                  sp.spotifyDsPct7d != null && sp.spotifyDsPct7d > 0
                    ? "#30D158"
                    : sp.spotifyDsPct7d != null && sp.spotifyDsPct7d < -5
                      ? "#FF453A"
                      : undefined
                }
                tooltip={SS.dailyStreams}
              />
            )}
            {sp?.spotifyFollowers != null && (
              <StatChip
                label="Spotify Followers"
                value={fmtNum(sp.spotifyFollowers)}
                sub={
                  sp.spotifyFollowersDelta7d != null
                    ? `${sp.spotifyFollowersDelta7d > 0 ? "+" : ""}${fmtNum(sp.spotifyFollowersDelta7d)} 7d`
                    : undefined
                }
                tooltip={SS.spotifyFollowers}
              />
            )}
            {data.spotifyLoyaltyRatio != null && (
              <StatChip
                label="Loyalty Ratio"
                value={`${(data.spotifyLoyaltyRatio * 100).toFixed(1)}%`}
                sub="followers / listeners"
                tooltip={SS.loyaltyRatio}
              />
            )}
          </div>

          {/* Context row */}
          {(sp?.spotifyPeakRatio != null ||
            sp?.kworbGlobalRank != null ||
            sp?.leadStreamPct != null) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-white/[0.04]">
              {sp?.spotifyPeakRatio != null && (
                <span className="text-[11px] text-white/40 inline-flex items-center gap-1">
                  {sp.spotifyPeakRatio >= 0.9
                    ? "Near peak ML"
                    : `${Math.round(sp.spotifyPeakRatio * 100)}% of peak ML`}
                  <InfoTooltip text={SS.peakMlStatus} />
                </span>
              )}
              {sp?.kworbGlobalRank != null && (
                <span className="text-[11px] text-white/40 inline-flex items-center gap-1">
                  Kworb #{sp.kworbGlobalRank.toLocaleString()}
                  {sp.kworbRankDelta7d != null && (
                    <span
                      className="ml-1 font-mono"
                      style={{
                        color:
                          sp.kworbRankDelta7d < 0
                            ? "#30D158"
                            : sp.kworbRankDelta7d > 0
                              ? "#FF453A"
                              : undefined,
                      }}
                    >
                      ({sp.kworbRankDelta7d > 0 ? "+" : ""}
                      {sp.kworbRankDelta7d})
                    </span>
                  )}
                  <InfoTooltip text={SS.kworbRank} />
                </span>
              )}
              {sp?.leadStreamPct != null && (
                <span className="text-[11px] text-white/40 inline-flex items-center gap-1">
                  {(sp.leadStreamPct * 100).toFixed(0)}% lead streams
                  <InfoTooltip text={SS.leadStreamPct} />
                </span>
              )}
              {sp?.deezerFans != null && (
                <span className="text-[11px] text-white/40 inline-flex items-center gap-1">
                  Deezer: {fmtNum(sp.deezerFans)} fans
                  <InfoTooltip text={SS.deezerFans} />
                </span>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════
          5. PLAYLIST INTELLIGENCE
          ════════════════════════════════════════════════════════ */}
      {hasPlaylist && pl && (
        <SectionCard title="Playlist Intelligence" tooltip={SPL.section}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
                Songs Listed
                <InfoTooltip text={SPL.songsListed} />
              </div>
              <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">
                {pl.songsInPlaylists}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
                Placements
                <InfoTooltip text={SPL.totalPlacements} />
              </div>
              <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">
                {pl.totalPlaylistPlacements}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
                Total Reach
                <InfoTooltip text={SPL.totalReach} />
              </div>
              <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">
                {fmtNum(pl.totalPlaylistReach)}
              </div>
            </div>
          </div>

          {pl.bestSong && pl.bestPlaylistName && (
            <div className="py-3 border-t border-white/[0.04]">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1 inline-flex items-center gap-1">
                Best Placement
                <InfoTooltip text={SPL.bestPlaylist} />
              </div>
              <div className="text-[13px] text-white/70 inline-flex items-center gap-1 flex-wrap">
                <span className="font-medium text-white/87">{pl.bestSong}</span>
                <span className="text-white/30"> in </span>
                <span className="text-[#0A84FF]">{pl.bestPlaylistName}</span>
                {pl.bestPlaylistReach != null && (
                  <span className="text-[11px] text-white/35 ml-1 font-mono inline-flex items-center gap-1">
                    ({fmtNum(pl.bestPlaylistReach)} reach)
                    <InfoTooltip text={SPL.bestPlaylistReach} />
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-3 border-t border-white/[0.04]">
            {pl.bestPositionOverall != null && (
              <StatChip
                label="Best Position"
                value={`#${pl.bestPositionOverall}`}
                tooltip={SPL.bestPosition}
              />
            )}
            {pl.avgPlaylistPosition != null && (
              <StatChip
                label="Avg Position"
                value={`#${Math.round(pl.avgPlaylistPosition)}`}
                tooltip={SPL.avgPosition}
              />
            )}
            {pl.highReachPlacements > 0 && (
              <StatChip
                label="High Reach"
                value={String(pl.highReachPlacements)}
                tooltip={SPL.highReachCount}
              />
            )}
            {pl.overallReachTier && (
              <span
                className="self-end text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                style={{
                  color:
                    REACH_TIER_COLORS[pl.overallReachTier] ??
                    "rgba(255,255,255,0.4)",
                  background: `${REACH_TIER_COLORS[pl.overallReachTier] ?? "#8E8E93"}18`,
                }}
              >
                {pl.overallReachTier} reach
                <InfoTooltip text={SPL.reachTier} />
              </span>
            )}
          </div>

          {Array.isArray(pl.topPlaylistSongs) &&
            pl.topPlaylistSongs.length > 0 && (
              <div className="pt-3 mt-3 border-t border-white/[0.04]">
                <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
                  Top Songs in Playlists
                </div>
                <div className="space-y-1.5">
                  {pl.topPlaylistSongs.slice(0, 5).map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <span className="text-white/60 truncate">
                        {s.song_name ?? `Song ${i + 1}`}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        {s.playlist_count != null && (
                          <span className="font-mono text-white/35 tabular-nums inline-flex items-center gap-1">
                            {s.playlist_count} playlists
                            <InfoTooltip text={SPL.perSongPlaylists} />
                          </span>
                        )}
                        {s.total_reach != null && (
                          <span className="font-mono text-white/45 tabular-nums inline-flex items-center gap-1">
                            {fmtNum(s.total_reach)}
                            <InfoTooltip text={SPL.perSongReach} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════
          6. SOUND DNA & DISCOVERY
          ════════════════════════════════════════════════════════ */}
      {hasDna && (
        <SectionCard title="Sound DNA & Discovery" tooltip={SD.section}>
          {/* Genre / Mood / Style badges */}
          {(dna?.primaryGenre || dna?.dominantMood || dna?.signatureStyle) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {dna?.primaryGenre && (
                <span className="text-[11px] font-medium px-3 py-1 rounded-full text-[#0A84FF] bg-[rgba(10,132,255,0.12)] inline-flex items-center gap-1">
                  {dna.primaryGenre}
                  <InfoTooltip text={SD.primaryGenre} />
                </span>
              )}
              {dna?.dominantMood && (
                <span className="text-[11px] font-medium px-3 py-1 rounded-full text-[#BF5AF2] bg-[rgba(191,90,242,0.12)] inline-flex items-center gap-1">
                  {dna.dominantMood}
                  <InfoTooltip text={SD.dominantMood} />
                </span>
              )}
              {dna?.signatureStyle && (
                <span className="text-[12px] italic text-white/35 ml-1 inline-flex items-center gap-1">
                  {dna.signatureStyle}
                  <InfoTooltip text={SD.signatureStyle} />
                </span>
              )}
            </div>
          )}

          {/* Score bars */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {dna?.avgHookScore != null && (
              <SubScoreBar
                label="Hook Score"
                value={Math.min(100, Math.round(dna.avgHookScore * 10))}
                color="#FF9F0A"
                tooltip={SD.hookScore}
              />
            )}
            {dna?.avgViralScore != null && (
              <SubScoreBar
                label="Viral Score"
                value={Math.min(100, Math.round(dna.avgViralScore * 10))}
                color="#FF453A"
                tooltip={SD.viralScore}
              />
            )}
            {data.discoveryScore != null && (
              <SubScoreBar
                label="Discovery"
                value={data.discoveryScore}
                color="#0A84FF"
                tooltip={SD.discoveryScore}
              />
            )}
          </div>

          {/* Discovery signals */}
          {(data.fastestGrowingPlatform || data.shazamTrend != null) && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/[0.04]">
              {data.fastestGrowingPlatform && (
                <span className="text-[11px] text-white/45 inline-flex items-center gap-1">
                  Fastest growing:{" "}
                  <span className="font-medium text-white/70">
                    {data.fastestGrowingPlatform}
                  </span>
                  <InfoTooltip text={SD.fastestGrowingPlatform} />
                </span>
              )}
              {data.shazamTrend != null && data.shazamTrend !== 0 && (
                <PlatformTrendPill
                  label="Shazam"
                  value={data.shazamTrend}
                  tooltip={SD.shazamTrend}
                />
              )}
              {data.wikipediaPageviews != null &&
                data.wikipediaPageviews > 0 && (
                  <span className="text-[11px] text-white/35 font-mono inline-flex items-center gap-1">
                    Wiki: {fmtNum(data.wikipediaPageviews)} views
                    {data.wikiDelta7d != null && data.wikiDelta7d !== 0 && (
                      <span
                        className="ml-1"
                        style={{
                          color: data.wikiDelta7d > 0 ? "#30D158" : "#FF453A",
                        }}
                      >
                        {data.wikiDelta7d > 0 ? "+" : ""}
                        {fmtNum(data.wikiDelta7d)}
                      </span>
                    )}
                    <InfoTooltip text={SD.wikipediaPageviews} />
                  </span>
                )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ════════════════════════════════════════════════════════
          EMPTY STATE
          ════════════════════════════════════════════════════════ */}
      {!hasAnything && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "#1C1C1E",
            borderTop: "0.5px solid rgba(255,255,255,0.04)",
          }}
        >
          <p className="text-[14px] text-white/30">
            Sound and streaming data not yet available for this artist
          </p>
        </div>
      )}
    </div>
  );
}
