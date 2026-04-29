import { useMemo } from "react";
import type {
  ContentIntelData,
  MomentumPoint,
} from "@/hooks/useContentIntelligence";
import { TIER_CONFIG, TREND_CONFIG } from "@/types/artistIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fmtNum,
  StatChip,
  SubScoreBar,
  PlatformTrendPill,
  SectionCard,
} from "./shared";
import ProfileHeader from "@/components/label/profile/ProfileHeader";
import PerformanceChart from "@/components/label/profile/PerformanceChart";
import AIFocus from "@/components/label/briefing/AIFocus";
import type { WeeklyPulse } from "@/components/label/briefing/AIFocus";
import InfoTooltip from "@/components/label/intelligence/InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

/* ─── Momentum Sparkline ──────────────────────────────────── */

function MomentumSparkline({ points }: { points: MomentumPoint[] }) {
  const { path, area } = useMemo(() => {
    if (!points.length) return { path: "", area: "" };
    const w = 180;
    const h = 36;
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
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 180 36" className="w-full max-w-[180px] h-[36px]">
        <defs>
          <linearGradient id="overviewMomentumGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#overviewMomentumGrad)" />
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

/* ─── Release Readiness Donut ──────────────────────────────── */

function ReadinessDonut({ score }: { score: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#30D158" : score >= 40 ? "#FFD60A" : "#FF453A";

  return (
    <div className="text-center">
      <svg width={68} height={68} viewBox="0 0 68 68">
        <circle
          cx={34}
          cy={34}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <circle
          cx={34}
          cy={34}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 34 34)"
          className="transition-all duration-700 ease-out"
        />
        <text
          x={34}
          y={34}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono"
          style={{ fontSize: 18, fontWeight: 700, fill: "white" }}
        >
          {score}
        </text>
      </svg>
      <div className="text-[9px] font-medium text-white/35 uppercase tracking-wider mt-0.5 inline-flex items-center gap-1">
        Release Ready
        <InfoTooltip text={STAT_TOOLTIPS.overview.releaseReadiness} />
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

interface OverviewTabProps {
  data: ContentIntelData | null;
  // Profile data from LabelArtistProfile
  artistName: string;
  artistHandle: string;
  avatarUrl: string | null;
  momentumTier: string;
  daysSinceLastPost: number | null;
  tiktokFollowers: number | null;
  instagramFollowers: number | null;
  monthlyListeners: number | null;
  inviteCode: string | null;
  // Weekly pulse
  weeklyPulse: WeeklyPulse | null;
  weeklyPulseGeneratedAt: string | null;
  // RMM chart data
  chartData: Array<{
    views: number;
    performance_ratio: number;
    momentum_tier: string;
    date_posted: string;
    video_views: number;
    video_likes: number;
    video_comments: number;
    video_shares: number;
    video_saves: number;
    video_url: string | null;
    caption: string | null;
    timestamp: number;
    dateLabel: string;
    monthLabel: string;
  }>;
  organicOnly: boolean;
  onOrganicToggle: (v: boolean) => void;
  currentPR: number | null;
  avg7PR: number | null;
  avg30PR: number | null;
  medianBaseline: number | null;
  // Release readiness
  releaseReadinessScore: number | null;
  // Risks
  riskFlags: Array<{ flag: string; severity: string }> | null;
  // Loading state for progressive rendering
  isLoading?: boolean;
}

export default function OverviewTab({
  data,
  artistName,
  artistHandle,
  avatarUrl,
  momentumTier,
  daysSinceLastPost,
  tiktokFollowers,
  instagramFollowers,
  monthlyListeners,
  inviteCode,
  weeklyPulse,
  weeklyPulseGeneratedAt,
  chartData,
  organicOnly,
  onOrganicToggle,
  currentPR,
  avg7PR,
  avg30PR,
  medianBaseline,
  releaseReadinessScore,
  riskFlags,
  isLoading,
}: OverviewTabProps) {
  const tier = TIER_CONFIG[data?.tier || "new"] ?? TIER_CONFIG.new;
  const trend = TREND_CONFIG[data?.trend || "stable"] ?? TREND_CONFIG.stable;
  const risks = riskFlags ?? [];

  return (
    <div className="space-y-4">
      {/* ─── Profile Hero ─── */}
      <ProfileHeader
        artistName={artistName}
        artistHandle={artistHandle}
        avatarUrl={avatarUrl}
        momentumTier={momentumTier}
        daysSinceLastPost={daysSinceLastPost}
        tiktokFollowers={tiktokFollowers}
        instagramFollowers={instagramFollowers}
        monthlyListeners={monthlyListeners}
        inviteCode={inviteCode}
      />

      {/* ─── Score + Readiness ─── */}
      {data?.artistScore != null && (
        <div
          style={{
            background: "#1C1C1E",
            borderRadius: 16,
            borderTop: "0.5px solid rgba(255,255,255,0.04)",
            padding: "24px 24px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Score */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1 text-[36px] font-bold leading-none text-white/90 font-mono tabular-nums">
              {data.artistScore}
              <InfoTooltip text={STAT_TOOLTIPS.overview.artistScore} />
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 justify-center">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: tier.bg, color: tier.color }}
              >
                {tier.label}
                <InfoTooltip text={STAT_TOOLTIPS.overview.tier} />
              </span>
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold"
                style={{ color: trend.color }}
              >
                {trend.arrow}
                <InfoTooltip text={STAT_TOOLTIPS.overview.trend} />
              </span>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 min-w-[160px]">
            <SubScoreBar
              label="Health"
              value={data?.healthScore ?? 0}
              color="#30D158"
              tooltip={STAT_TOOLTIPS.overview.healthSubScore}
            />
            <SubScoreBar
              label="Momentum"
              value={data?.momentumScore ?? 0}
              color="#0A84FF"
              tooltip={STAT_TOOLTIPS.overview.momentumSubScore}
            />
            <SubScoreBar
              label="Discovery"
              value={data?.discoveryScore ?? 0}
              color="#BF5AF2"
              tooltip={STAT_TOOLTIPS.overview.discoverySubScore}
            />
            <SubScoreBar
              label="Catalog"
              value={data?.catalogScore ?? 0}
              color="#FF9F0A"
              tooltip={STAT_TOOLTIPS.overview.catalogSubScore}
            />
          </div>

          {/* Release readiness */}
          {releaseReadinessScore != null && (
            <ReadinessDonut score={releaseReadinessScore} />
          )}
        </div>
      )}

      {/* ─── AI Focus Pick ─── */}
      <AIFocus pulse={weeklyPulse} generatedAt={weeklyPulseGeneratedAt} />

      {/* ─── Platform Trends + Sparkline ─── */}
      {data &&
        (data.spotifyTrend != null ||
          data.tiktokTrend != null ||
          data.youtubeTrend != null ||
          data.shazamTrend != null ||
          (data.viralSongs != null && data.viralSongs > 0) ||
          (data.songsAccelerating != null && data.songsAccelerating > 0)) && (
          <div
            className="rounded-xl border border-white/[0.06] p-5"
            style={{ background: "#1C1C1E" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap items-center gap-2">
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
                  label="YouTube"
                  value={data.youtubeTrend}
                  tooltip={STAT_TOOLTIPS.overview.youtubeTrend}
                />
                <PlatformTrendPill
                  label="Shazam"
                  value={data.shazamTrend}
                  tooltip={STAT_TOOLTIPS.overview.shazamTrend}
                />
                {data.viralSongs != null && data.viralSongs > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md text-[#FF453A] bg-[rgba(255,69,58,0.12)]">
                    {data.viralSongs} viral
                    <InfoTooltip text={STAT_TOOLTIPS.overview.viralSongs} />
                  </span>
                )}
                {data.songsAccelerating != null &&
                  data.songsAccelerating > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md text-[#30D158] bg-[rgba(48,209,88,0.12)]">
                      {data.songsAccelerating} accelerating
                      <InfoTooltip
                        text={STAT_TOOLTIPS.overview.acceleratingSongs}
                      />
                    </span>
                  )}
              </div>
              {data.momentumSparkline?.length > 1 && (
                <div className="flex items-center gap-1">
                  <MomentumSparkline points={data.momentumSparkline} />
                  <InfoTooltip
                    text={STAT_TOOLTIPS.overview.momentumSparkline}
                  />
                </div>
              )}
            </div>
          </div>
        )}

      {/* Loading skeleton for intelligence data */}
      {isLoading && !data && (
        <div className="space-y-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {/* ─── RMM Performance Chart ─── */}
      {chartData.length > 0 && (
        <PerformanceChart
          chartData={chartData}
          organicOnly={organicOnly}
          onOrganicToggle={onOrganicToggle}
          currentPR={currentPR}
          avg7PR={avg7PR}
          avg30PR={avg30PR}
          medianBaseline={medianBaseline}
        />
      )}

      {/* ─── Anomalies + Risks ─── */}
      {((data?.anomalies?.length ?? 0) > 0 || risks.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Anomalies */}
          {(data?.anomalies?.length ?? 0) > 0 && data && (
            <SectionCard
              title="Recent Anomalies"
              tooltip={STAT_TOOLTIPS.overview.anomaliesSection}
            >
              <div className="space-y-2">
                {data.anomalies.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div
                      className="w-0.5 rounded-full self-stretch shrink-0"
                      style={{
                        background:
                          a.severity === "high" || a.type.includes("spike")
                            ? "#FF453A"
                            : a.type.includes("drop")
                              ? "#FFD60A"
                              : "#8E8E93",
                      }}
                    />
                    <div>
                      <div className="text-[12px] text-white/65 leading-snug">
                        {a.message}
                      </div>
                      <div className="text-[10px] text-white/25 font-mono mt-0.5">
                        {a.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <SectionCard
              title="Risk Alerts"
              tooltip={STAT_TOOLTIPS.overview.riskAlertsSection}
            >
              <div className="space-y-2">
                {risks.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px]">
                    <span
                      className={`text-sm shrink-0 ${r.severity === "high" ? "text-red-400" : "text-amber-400"}`}
                    >
                      {r.severity === "high" ? "●" : "▲"}
                    </span>
                    <span className="text-white/75">{r.flag}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
