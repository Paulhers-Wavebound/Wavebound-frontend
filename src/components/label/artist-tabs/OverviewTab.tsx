import { useMemo, useState, type FormEvent } from "react";
import type {
  ContentIntelData,
  MomentumPoint,
} from "@/hooks/useContentIntelligence";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  PencilLine,
  SearchCheck,
} from "lucide-react";
import { TIER_CONFIG, TREND_CONFIG } from "@/types/artistIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { NextReleaseIntel } from "@/data/contentDashboardHelpers";
import { cn } from "@/lib/utils";

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

/* ─── Release Intel Panel ─────────────────────────────────── */

export interface ManualReleasePayload {
  releaseDate: string;
  sourceUrl: string;
  title: string;
}

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return null;

  const mins = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function releaseFromPulse(pulse: WeeklyPulse | null): NextReleaseIntel | null {
  if (!pulse) return null;
  if (pulse.next_release) return pulse.next_release;
  if (
    pulse.next_release_date ||
    pulse.next_release_title ||
    pulse.next_release_source_url
  ) {
    return {
      date: pulse.next_release_date ?? null,
      title: pulse.next_release_title ?? null,
      source_url: pulse.next_release_source_url ?? null,
      source_type: pulse.next_release_source_type ?? null,
      evidence: pulse.next_release_evidence ?? null,
      confidence: pulse.next_release_confidence ?? null,
      checked_at: null,
    };
  }
  return null;
}

function sourceLabel(sourceType: NextReleaseIntel["source_type"]): string {
  switch (sourceType) {
    case "tiktok_caption":
      return "TikTok caption";
    case "latest_release":
      return "Release feed";
    case "manual":
      return "Label confirmed";
    case "web":
      return "Web source";
    default:
      return "Public source";
  }
}

function confidenceLabel(confidence: NextReleaseIntel["confidence"]): string {
  if (!confidence) return "UNVERIFIED";
  return `${confidence.toUpperCase()} CONFIDENCE`;
}

function ReleaseIntelPanel({
  weeklyPulse,
  onManualReleaseConfirm,
  manualReleasePending,
}: {
  weeklyPulse: WeeklyPulse | null;
  onManualReleaseConfirm?: (payload: ManualReleasePayload) => Promise<void>;
  manualReleasePending?: boolean;
}) {
  const release = releaseFromPulse(weeklyPulse);
  const hasReleaseDate = !!release?.date;
  const checkedAgo = timeAgo(release?.checked_at);
  const [open, setOpen] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const todayInputDate = new Date().toISOString().slice(0, 10);

  const submitManualRelease = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onManualReleaseConfirm || manualReleasePending) return;

    try {
      await onManualReleaseConfirm({
        releaseDate,
        sourceUrl,
        title,
      });

      setOpen(false);
      setReleaseDate("");
      setSourceUrl("");
      setTitle("");
    } catch {
      // Parent shows the toast; keep the dialog open so the source/date can be corrected.
    }
  };

  return (
    <>
      <div
        className="rounded-xl border border-white/[0.06] p-5"
        style={{ background: "#1C1C1E" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">
              <SearchCheck className="h-3.5 w-3.5 text-[#e8430a]" />
              Release Intel
              {checkedAgo && (
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-white/35">
                  checked {checkedAgo}
                </span>
              )}
            </div>

            {hasReleaseDate ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[rgba(48,209,88,0.12)] px-2 py-1 text-[11px] font-semibold text-[#30D158]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {confidenceLabel(release?.confidence)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[12px] font-mono text-white/75">
                    <CalendarClock className="h-3.5 w-3.5 text-white/40" />
                    {formatDate(release.date)}
                  </span>
                </div>
                <div className="text-[16px] font-semibold text-white/87">
                  {release?.title || "Upcoming release"}
                </div>
                <div className="max-w-3xl text-[13px] leading-relaxed text-white/45">
                  {release?.evidence || "Specific public release date found."}
                </div>
                {release?.source_url && (
                  <a
                    href={release.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#e8430a] hover:text-[#ff6a3d]"
                  >
                    {sourceLabel(release.source_type)}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-1">
                <div className="text-[16px] font-semibold text-white/75">
                  {release?.checked_at
                    ? "No dated release found"
                    : "Not scanned yet"}
                </div>
                <div className="max-w-3xl text-[13px] leading-relaxed text-white/40">
                  {release?.checked_at
                    ? "The AI checked public sources and did not find a specific announced date."
                    : "This artist will get release intel when the next brief or daily scan runs."}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!onManualReleaseConfirm}
            onClick={() => setOpen(true)}
            className={cn(
              "shrink-0 border-white/[0.08] bg-white/[0.03] text-white/65 hover:bg-white/[0.06] hover:text-white/87",
              hasReleaseDate && "text-white/55",
            )}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Confirm release
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/[0.08] bg-[#1C1C1E] text-white/87 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white/87">
              Confirm upcoming release
            </DialogTitle>
            <DialogDescription className="text-white/45">
              Add a public source with a specific date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitManualRelease} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="release-date" className="text-white/65">
                Release date
              </Label>
              <Input
                id="release-date"
                type="date"
                min={todayInputDate}
                value={releaseDate}
                onChange={(event) => setReleaseDate(event.target.value)}
                required
                className="border-white/[0.08] bg-black/30 text-white/87"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="release-source" className="text-white/65">
                Source URL
              </Label>
              <Input
                id="release-source"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
                required
                className="border-white/[0.08] bg-black/30 text-white/87 placeholder:text-white/25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="release-title" className="text-white/65">
                Title
              </Label>
              <Input
                id="release-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Optional"
                className="border-white/[0.08] bg-black/30 text-white/87 placeholder:text-white/25"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-white/55 hover:bg-white/[0.06] hover:text-white/87"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={manualReleasePending}
                className="bg-[#e8430a] text-white/90 hover:bg-[#ff5a25]"
              >
                {manualReleasePending ? "Saving..." : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
  onManualReleaseConfirm?: (payload: ManualReleasePayload) => Promise<void>;
  manualReleasePending?: boolean;
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
  onManualReleaseConfirm,
  manualReleasePending,
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

      <ReleaseIntelPanel
        weeklyPulse={weeklyPulse}
        onManualReleaseConfirm={onManualReleaseConfirm}
        manualReleasePending={manualReleasePending}
      />

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
