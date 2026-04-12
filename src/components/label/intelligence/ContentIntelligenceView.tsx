import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  useContentIntelligence,
  type ContentIntelData,
  type MomentumPoint,
} from "@/hooks/useContentIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TIER_CONFIG,
  TREND_CONFIG,
  TIKTOK_GRADE_CONFIG,
} from "@/types/artistIntelligence";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

/* ─── Shared helpers ──────────────────────────────────────── */

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toFixed(1).replace(".0", "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return Math.round(n).toLocaleString();
}

function pctStr(n: number | null | undefined, showPlus = true): string {
  if (n == null) return "—";
  const sign = showPlus && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function trendColor(n: number | null | undefined): string | undefined {
  if (n == null) return undefined;
  if (n > 0) return "#30D158";
  if (n < -5) return "#FF453A";
  return undefined;
}

function StatChip({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider leading-none">
        {label}
      </span>
      <span
        className="text-[17px] font-semibold tabular-nums leading-tight"
        style={{ color: color || "rgba(255,255,255,0.87)" }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-white/25 leading-none">{sub}</span>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] p-5 ${className || ""}`}
      style={{ background: "#1C1C1E" }}
    >
      <h3 className="text-[12px] font-semibold text-white/45 uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-[12px] text-white/25 italic py-2">{message}</p>;
}

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
    <div className="flex-1 min-w-[100px]">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[11px] font-medium text-white/45 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-[13px] font-semibold text-white/87 tabular-nums font-mono">
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PlatformTrendPill({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value == null) return null;
  const color = value > 0 ? "#30D158" : value < -5 ? "#FF453A" : "#8E8E93";
  const arrow = value > 0 ? "\u2191" : value < 0 ? "\u2193" : "\u2192";
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-mono font-medium tabular-nums px-2 py-0.5 rounded-md"
      style={{ color, background: `${color}12` }}
    >
      {label}{" "}
      <span>
        {arrow}
        {Math.abs(value).toFixed(1)}%
      </span>
    </span>
  );
}

function Gauge({
  label,
  value,
  color,
  size = 76,
}: {
  label: string;
  value: number;
  color: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <div className="text-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-700 ease-out"
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono"
          style={{ fontSize: size * 0.26, fontWeight: 700, fill: "white" }}
        >
          {value}
        </text>
      </svg>
      <div className="text-[10px] font-medium text-white/45 mt-1">{label}</div>
    </div>
  );
}

/* ─── Momentum Sparkline (SVG) ──────────────────────────────── */

function MomentumSparkline({ points }: { points: MomentumPoint[] }) {
  const { path, area } = useMemo(() => {
    if (!points.length) return { path: "", area: "" };
    const w = 220;
    const h = 44;
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
      <svg viewBox="0 0 220 44" className="w-full max-w-[220px] h-[44px]">
        <defs>
          <linearGradient id="momentumGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#momentumGrad)" />
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

/* ═══════════════════════════════════════════════════════════════
   SECTION 1: Content Command Center (hero)
   ═══════════════════════════════════════════════════════════════ */

function ContentCommandCenter({ data }: { data: ContentIntelData }) {
  if (data.artistScore == null) return null;

  const tier = TIER_CONFIG[data.tier || "new"] ?? TIER_CONFIG.new;
  const trend = TREND_CONFIG[data.trend || "stable"] ?? TREND_CONFIG.stable;

  return (
    <div
      className="rounded-xl border border-white/[0.06] p-5 lg:p-6"
      style={{ background: "#1C1C1E" }}
    >
      {/* Main grid: Score | Sub-scores | Rank */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-5 lg:gap-6 items-start">
        {/* Left: score + badges */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[48px] font-bold leading-none text-white/90 font-mono tabular-nums">
              {data.artistScore}
            </div>
            <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest mt-1">
              Artist Score
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: tier.bg, color: tier.color }}
            >
              {tier.label}
            </span>
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04]"
              style={{ color: trend.color }}
            >
              <span className="text-sm">{trend.arrow}</span>
              {trend.label}
            </span>
          </div>
        </div>

        {/* Center: sub-scores 2x2 grid — fills the dead horizontal space */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 lg:border-l lg:border-r lg:border-white/[0.04] lg:px-6 self-center">
          <SubScoreBar
            label="Health"
            value={data.healthScore ?? 0}
            color="#30D158"
          />
          <SubScoreBar
            label="Momentum"
            value={data.momentumScore ?? 0}
            color="#0A84FF"
          />
          <SubScoreBar
            label="Discovery"
            value={data.discoveryScore ?? 0}
            color="#BF5AF2"
          />
          <SubScoreBar
            label="Catalog"
            value={data.catalogScore ?? 0}
            color="#FF9F0A"
          />
        </div>

        {/* Right: rank + sparkline */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-[13px] text-white/45 font-mono">
            Global Rank{" "}
            <span className="text-[22px] font-semibold text-white/87">
              #{data.globalRank}
            </span>
          </div>
          {data.momentumSparkline?.length > 1 && (
            <MomentumSparkline points={data.momentumSparkline} />
          )}
          {data.listenersPeakRatio != null && (
            <div className="text-[11px] text-white/35">
              {data.listenersPeakRatio >= 0.9
                ? "Near all-time high"
                : `${Math.round(data.listenersPeakRatio * 100)}% of peak listeners`}
            </div>
          )}
        </div>
      </div>

      {/* Platform trends */}
      {(data.spotifyTrend != null ||
        data.tiktokTrend != null ||
        data.youtubeTrend != null ||
        data.shazamTrend != null) && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
          <PlatformTrendPill label="Spotify" value={data.spotifyTrend} />
          <PlatformTrendPill label="TikTok" value={data.tiktokTrend} />
          <PlatformTrendPill label="YouTube" value={data.youtubeTrend} />
          <PlatformTrendPill label="Shazam" value={data.shazamTrend} />
          {data.viralSongs != null && data.viralSongs > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md text-[#FF453A] bg-[rgba(255,69,58,0.12)]">
              {data.viralSongs} viral
            </span>
          )}
          {data.songsAccelerating != null && data.songsAccelerating > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md text-[#30D158] bg-[rgba(48,209,88,0.12)]">
              {data.songsAccelerating} accelerating
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 2a: TikTok Profile
   ═══════════════════════════════════════════════════════════════ */

const CONSISTENCY_COLORS: Record<string, string> = {
  daily: "#30D158",
  regular: "#0A84FF",
  sporadic: "#FFD60A",
  inactive: "#FF9F0A",
  dormant: "#FF453A",
};

function TikTokProfileSection({ data }: { data: ContentIntelData }) {
  const hasProfile = data.tiktokGrade != null || data.ttAvgPlays != null;
  if (!hasProfile) return null;

  const grade =
    TIKTOK_GRADE_CONFIG[data.tiktokGrade || "C"] ?? TIKTOK_GRADE_CONFIG.C;
  const consistencyColor =
    CONSISTENCY_COLORS[data.postingConsistency || ""] ?? "#8E8E93";

  return (
    <SectionCard title="TikTok Profile">
      {/* Grade + consistency + trend — single tight row */}
      <div className="flex items-center gap-2.5 mb-5">
        {data.tiktokGrade && (
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[16px] font-bold font-mono"
            style={{ background: grade.bg, color: grade.color }}
          >
            {data.tiktokGrade}
          </span>
        )}
        {data.postingConsistency && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{
              color: consistencyColor,
              background: `${consistencyColor}18`,
            }}
          >
            {data.postingConsistency}
          </span>
        )}
        {data.ttPlaysTrendPct != null && (
          <span
            className="text-[12px] font-mono font-semibold tabular-nums ml-auto"
            style={{ color: trendColor(data.ttPlaysTrendPct) }}
          >
            {pctStr(data.ttPlaysTrendPct)} plays
          </span>
        )}
      </div>

      {/* Primary stats — 2x2 grid always, consistent alignment */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <StatChip label="Avg Plays" value={fmtNum(data.ttAvgPlays)} />
        <StatChip
          label="Engagement"
          value={
            data.ttAvgEngagementRate != null
              ? `${data.ttAvgEngagementRate.toFixed(2)}%`
              : "—"
          }
        />
        <StatChip
          label="Original Sound"
          value={
            data.ttOriginalSoundPct != null
              ? `${Math.round(data.ttOriginalSoundPct)}%`
              : "—"
          }
        />
        <StatChip
          label="Posts / Week"
          value={
            data.ttAvgPostsPerWeek != null
              ? data.ttAvgPostsPerWeek.toFixed(1)
              : "—"
          }
        />
      </div>

      {/* Secondary stats — compact row */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 pt-3 border-t border-white/[0.04]">
        <StatChip label="Total Videos" value={fmtNum(data.ttTotalVideos)} />
        <StatChip label="Last 30d" value={fmtNum(data.ttVideos30d)} />
        <StatChip
          label="Best Video"
          value={fmtNum(data.ttBestVideoPlays)}
          sub="plays"
        />
        {data.ttDaysSinceLastPost != null && (
          <StatChip
            label="Last Post"
            value={`${data.ttDaysSinceLastPost}d ago`}
            color={
              data.ttDaysSinceLastPost > 7
                ? "#FF9F0A"
                : data.ttDaysSinceLastPost > 14
                  ? "#FF453A"
                  : undefined
            }
          />
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 2b: Audience Footprint
   ═══════════════════════════════════════════════════════════════ */

function AudienceFootprintSection({ data }: { data: ContentIntelData }) {
  const hasData =
    data.tiktokFollowers != null ||
    data.instagramFollowers != null ||
    data.youtubeSubscribers != null ||
    data.spotifyFollowers != null;

  if (!hasData) return null;

  const platforms = [
    {
      name: "TikTok",
      followers: data.tiktokFollowers,
      growth: data.tiktokGrowth7d,
      growthPct: data.tiktokGrowthPct7d,
      color: "#FF004F",
    },
    {
      name: "Instagram",
      followers: data.instagramFollowers,
      growth: data.instagramGrowth7d,
      growthPct: data.instagramGrowthPct7d,
      color: "#E1306C",
    },
    {
      name: "YouTube",
      followers: data.youtubeSubscribers,
      growth: data.youtubeGrowth7d,
      growthPct: null,
      color: "#FF0000",
    },
    {
      name: "Spotify",
      followers: data.spotifyFollowers,
      growth: null,
      growthPct: null,
      color: "#1DB954",
    },
  ].filter((p) => p.followers != null && p.followers > 0);

  const maxFollowers = Math.max(...platforms.map((p) => p.followers || 0), 1);

  return (
    <SectionCard title="Audience Footprint">
      {/* Total reach — prominent but not oversized */}
      {data.totalSocialReach != null && (
        <div className="mb-5">
          <span className="text-[26px] font-bold text-white/87 font-mono tabular-nums">
            {fmtNum(data.totalSocialReach)}
          </span>
          <span className="text-[11px] text-white/35 ml-2 uppercase tracking-wider">
            Total Reach
          </span>
        </div>
      )}

      {/* Platform bars — thicker, tighter spacing */}
      <div className="space-y-2.5">
        {platforms.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-white/55 w-[72px] shrink-0">
              {p.name}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((p.followers || 0) / maxFollowers) * 100}%`,
                  background: p.color,
                  minWidth: 4,
                }}
              />
            </div>
            <span className="text-[13px] font-mono font-semibold text-white/75 tabular-nums w-[52px] text-right shrink-0">
              {fmtNum(p.followers)}
            </span>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.04]">
        {data.dominantPlatform && (
          <span className="text-[10px] font-medium text-white/40 px-2 py-0.5 rounded-full border border-white/[0.06]">
            Dominant: {data.dominantPlatform}
          </span>
        )}
        {data.fastestGrowingPlatform && (
          <span className="text-[10px] font-medium text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/20">
            Fastest: {data.fastestGrowingPlatform}
          </span>
        )}
        {data.spotifyLoyaltyRatio != null && (
          <span className="text-[10px] font-mono text-white/35 px-2 py-0.5 rounded-full border border-white/[0.06]">
            Spotify Loyalty: {(data.spotifyLoyaltyRatio * 100).toFixed(0)}%
          </span>
        )}
        {data.wikipediaPageviews != null && data.wikipediaPageviews > 0 && (
          <span className="text-[10px] font-mono text-white/35 px-2 py-0.5 rounded-full border border-white/[0.06]">
            Wikipedia: {fmtNum(data.wikipediaPageviews)}/wk
          </span>
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: Format Performance Table
   ═══════════════════════════════════════════════════════════════ */

function FormatPerformanceSection({ data }: { data: ContentIntelData }) {
  const rows = data.formatPerformance ?? [];
  const dna = data.contentDna;
  const videos = data.formatVideos ?? {};
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fallback to simple chips if no detailed format data
  if (rows.length === 0) {
    if (!dna) return null;
    return (
      <SectionCard title="Format DNA">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatChip
            label="Best Format"
            value={dna.bestFormat || "—"}
            color="#30D158"
          />
          <StatChip
            label="Worst Format"
            value={dna.worstFormat || "—"}
            color="#FF453A"
          />
          <StatChip label="Genre" value={dna.primaryGenre || "—"} />
          <StatChip
            label="Hook Score"
            value={
              dna.avgHookScore != null
                ? `${dna.avgHookScore.toFixed(1)}/10`
                : "—"
            }
          />
          <StatChip
            label="Viral Score"
            value={
              dna.avgViralScore != null
                ? `${dna.avgViralScore.toFixed(1)}/10`
                : "—"
            }
          />
          <StatChip label="Mood" value={dna.dominantMood || "—"} />
        </div>
        {dna.signatureStyle && (
          <p className="text-[13px] text-white/45 mt-3 pt-3 border-t border-white/[0.04]">
            Signature: {dna.signatureStyle}
          </p>
        )}
      </SectionCard>
    );
  }

  const maxViews = Math.max(...rows.map((r) => r.avgViews ?? 0), 1);

  // Chart data for Recharts
  const chartData = rows.slice(0, 8).map((r) => ({
    name: r.contentFormat,
    views: r.avgViews ?? 0,
    hook: r.avgHookScore ?? 0,
    viral: r.avgViralScore ?? 0,
    vs: r.performanceVsMedian ?? 1,
  }));

  const FORMAT_CHART_COLORS = [
    "#0A84FF",
    "#30D158",
    "#FF9F0A",
    "#BF5AF2",
    "#FF453A",
    "#5AC8FA",
    "#FFD60A",
    "#64D2FF",
  ];

  return (
    <SectionCard title="Format Performance">
      {/* Recharts horizontal bar chart */}
      {chartData.length > 1 && (
        <div className="mb-4 pb-4 border-b border-white/[0.04]">
          <ResponsiveContainer width="100%" height={chartData.length * 36 + 20}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{
                  fontSize: 12,
                  fill: "rgba(255,255,255,0.55)",
                  fontFamily: '"DM Sans", sans-serif',
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "#1C1C1E",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
                itemStyle={{ color: "rgba(255,255,255,0.7)" }}
                labelStyle={{
                  color: "rgba(255,255,255,0.87)",
                  fontWeight: 600,
                }}
                formatter={(value: number) => [fmtNum(value), "Avg Views"]}
              />
              <Bar dataKey="views" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {chartData.map((_entry, i) => (
                  <Cell
                    key={i}
                    fill={FORMAT_CHART_COLORS[i % FORMAT_CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary chips */}
      {dna && (
        <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b border-white/[0.04]">
          {dna.videosAnalyzed != null && (
            <span className="text-[11px] text-white/35">
              {dna.videosAnalyzed} videos analyzed
            </span>
          )}
          {dna.avgHookScore != null && (
            <span className="text-[11px] text-white/35">
              Avg Hook{" "}
              <span className="font-mono text-white/55">
                {dna.avgHookScore.toFixed(1)}
              </span>
            </span>
          )}
          {dna.avgViralScore != null && (
            <span className="text-[11px] text-white/35">
              Avg Viral{" "}
              <span className="font-mono text-white/55">
                {dna.avgViralScore.toFixed(1)}
              </span>
            </span>
          )}
          {dna.primaryGenre && (
            <span className="text-[11px] text-white/35">
              Genre: {dna.primaryGenre}
            </span>
          )}
          {dna.dominantMood && (
            <span className="text-[11px] text-white/35">
              Mood: {dna.dominantMood}
            </span>
          )}
        </div>
      )}

      {/* Toggle + Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div
          className={`hidden sm:grid ${showDetails ? "grid-cols-[1fr_50px_1fr_60px_60px_65px_65px]" : "grid-cols-[1fr_50px_1fr_65px]"} gap-2 text-[9px] font-semibold text-white/25 uppercase tracking-wider flex-1`}
        >
          <span>Format</span>
          <span className="text-right">Videos</span>
          <span>Avg Views</span>
          {showDetails && (
            <>
              <span className="text-right">Hook</span>
              <span className="text-right">Viral</span>
              <span className="text-right">Engage</span>
            </>
          )}
          <span className="text-right">vs Median</span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] font-medium text-white/30 hover:text-white/50 transition-colors ml-3 shrink-0"
        >
          {showDetails ? "Less" : "More"}
        </button>
      </div>

      {/* Rows */}
      <div className="space-y-0">
        {rows.map((r, i) => {
          const barPct = ((r.avgViews ?? 0) / maxViews) * 100;
          const vsMedian = r.performanceVsMedian;
          const vsColor =
            vsMedian != null
              ? vsMedian >= 1.2
                ? "#30D158"
                : vsMedian <= 0.8
                  ? "#FF453A"
                  : "rgba(255,255,255,0.45)"
              : undefined;

          const formatVideos = videos[r.contentFormat] ?? [];
          const hasVideos = formatVideos.length > 0;
          const isExpanded = expandedFormat === r.contentFormat;

          return (
            <div key={r.contentFormat}>
              <div
                className={`grid grid-cols-1 ${showDetails ? "sm:grid-cols-[1fr_50px_1fr_60px_60px_65px_65px]" : "sm:grid-cols-[1fr_50px_1fr_65px]"} gap-2 items-center py-2 px-1 rounded-lg transition-colors ${hasVideos ? "cursor-pointer hover:bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
                style={{
                  borderBottom:
                    !isExpanded && i < rows.length - 1
                      ? "1px solid rgba(255,255,255,0.03)"
                      : undefined,
                }}
                onClick={
                  hasVideos
                    ? () =>
                        setExpandedFormat(isExpanded ? null : r.contentFormat)
                    : undefined
                }
              >
                {/* Format name */}
                <span className="text-[13px] font-medium text-white/75 truncate flex items-center gap-1.5">
                  {hasVideos && (
                    <span
                      className="text-[9px] text-white/25 transition-transform duration-200 shrink-0"
                      style={{
                        display: "inline-block",
                        transform: isExpanded
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      ▶
                    </span>
                  )}
                  {r.contentFormat}
                </span>

                {/* Video count */}
                <span className="text-[12px] font-mono text-white/45 tabular-nums text-right">
                  {r.videoCount}
                </span>

                {/* Avg views bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barPct}%`,
                        background:
                          vsMedian != null && vsMedian >= 1.2
                            ? "#30D158"
                            : "#0A84FF",
                        minWidth: 2,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-white/45 tabular-nums shrink-0">
                    {fmtNum(r.avgViews)}
                  </span>
                </div>

                {/* Detail columns — only visible when toggled */}
                {showDetails && (
                  <>
                    <span className="text-[12px] font-mono text-white/55 tabular-nums text-right">
                      {r.avgHookScore != null ? r.avgHookScore.toFixed(1) : "—"}
                    </span>
                    <span className="text-[12px] font-mono text-white/55 tabular-nums text-right">
                      {r.avgViralScore != null
                        ? r.avgViralScore.toFixed(1)
                        : "—"}
                    </span>
                    <span className="text-[12px] font-mono text-white/45 tabular-nums text-right">
                      {r.avgEngagementRate != null
                        ? `${r.avgEngagementRate.toFixed(1)}%`
                        : "—"}
                    </span>
                  </>
                )}

                {/* vs Median — always visible */}
                <span
                  className="text-[12px] font-mono font-semibold tabular-nums text-right"
                  style={{ color: vsColor }}
                >
                  {vsMedian != null ? `${vsMedian.toFixed(2)}x` : "—"}
                </span>
              </div>

              {/* Expanded video list */}
              {isExpanded && formatVideos.length > 0 && (
                <div
                  className="ml-4 mr-1 mb-2 rounded-lg border border-white/[0.04] overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.015)" }}
                >
                  {formatVideos.map((v, vi) => {
                    const Wrapper = v.videoUrl ? "a" : "div";
                    const linkProps = v.videoUrl
                      ? {
                          href: v.videoUrl,
                          target: "_blank" as const,
                          rel: "noopener noreferrer",
                        }
                      : {};
                    return (
                      <Wrapper
                        key={vi}
                        {...linkProps}
                        className={`flex items-start gap-3 px-3 py-2.5 no-underline${v.videoUrl ? " group cursor-pointer transition-colors hover:bg-white/[0.04]" : ""}`}
                        style={{
                          borderBottom:
                            vi < formatVideos.length - 1
                              ? "1px solid rgba(255,255,255,0.03)"
                              : undefined,
                          textDecoration: "none",
                        }}
                      >
                        <span className="text-[10px] font-mono text-white/20 tabular-nums shrink-0 mt-0.5 w-4 text-right">
                          {vi + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[12px] leading-snug line-clamp-2${v.videoUrl ? " text-white/60 group-hover:text-white/80 transition-colors" : " text-white/60"}`}
                          >
                            {v.caption || "No caption"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-mono text-white/40 tabular-nums">
                              {fmtNum(v.views)} views
                            </span>
                            {v.hookScore != null && (
                              <span className="text-[10px] font-mono text-white/30">
                                Hook {v.hookScore.toFixed(1)}
                              </span>
                            )}
                            {v.viralScore != null && (
                              <span className="text-[10px] font-mono text-white/30">
                                Viral {v.viralScore.toFixed(1)}
                              </span>
                            )}
                            {v.mood && (
                              <span className="text-[10px] text-white/25">
                                {v.mood}
                              </span>
                            )}
                            {v.isAd && (
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#FF9F0A] px-1 py-0.5 rounded bg-[rgba(255,159,10,0.1)]">
                                Ad
                              </span>
                            )}
                            {v.datePosted && (
                              <span className="text-[10px] text-white/20 ml-auto">
                                {new Date(v.datePosted).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" },
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {v.videoUrl && (
                          <ExternalLink
                            size={12}
                            className="shrink-0 mt-1 text-white/0 group-hover:text-white/30 transition-colors"
                          />
                        )}
                      </Wrapper>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Signature style */}
      {dna?.signatureStyle && (
        <p className="text-[12px] text-white/40 mt-3 pt-3 border-t border-white/[0.04]">
          Signature: {dna.signatureStyle}
        </p>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3b: Streaming Pulse
   ═══════════════════════════════════════════════════════════════ */

function StreamingPulseSection({ data }: { data: ContentIntelData }) {
  const sp = data.streamingPulse;
  const hasStreaming =
    (sp != null &&
      (sp.spotifyMonthlyListeners != null || sp.spotifyDailyStreams != null)) ||
    (data.catalogDailyStreams != null && data.catalogDailyStreams > 0);

  if (!hasStreaming) return null;

  return (
    <SectionCard title="Streaming Pulse">
      {/* Stats — 2x2 grid keeps stats compact instead of stretching across full width */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[520px]">
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
          />
        )}
        {data.catalogDailyStreams != null && (
          <StatChip
            label="Catalog Streams"
            value={fmtNum(data.catalogDailyStreams)}
            sub={
              data.catalogPctChange7d != null
                ? `${data.catalogPctChange7d > 0 ? "+" : ""}${data.catalogPctChange7d.toFixed(1)}% 7d`
                : undefined
            }
            color={
              data.catalogPctChange7d != null && data.catalogPctChange7d > 0
                ? "#30D158"
                : data.catalogPctChange7d != null &&
                    data.catalogPctChange7d < -5
                  ? "#FF453A"
                  : undefined
            }
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
          />
        )}
      </div>

      {/* Peak ratio + rank — compact metadata row */}
      {(sp?.spotifyPeakRatio != null ||
        sp?.kworbGlobalRank != null ||
        sp?.leadStreamPct != null) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-white/[0.04]">
          {sp?.spotifyPeakRatio != null && (
            <span className="text-[11px] text-white/40">
              {sp.spotifyPeakRatio >= 0.9
                ? "Near peak"
                : `${Math.round(sp.spotifyPeakRatio * 100)}% of peak ML`}
            </span>
          )}
          {sp?.kworbGlobalRank != null && (
            <span className="text-[11px] text-white/40">
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
            </span>
          )}
          {sp?.leadStreamPct != null && (
            <span className="text-[11px] text-white/40">
              Lead streams: {Math.round(sp.leadStreamPct)}%
            </span>
          )}
          {sp?.deezerFans != null && (
            <span className="text-[11px] text-white/40">
              Deezer: {fmtNum(sp.deezerFans)} fans
              {sp.deezerFansDelta7d != null && sp.deezerFansDelta7d !== 0 && (
                <span
                  className="ml-1 font-mono"
                  style={{
                    color: sp.deezerFansDelta7d > 0 ? "#30D158" : "#FF453A",
                  }}
                >
                  ({sp.deezerFansDelta7d > 0 ? "+" : ""}
                  {fmtNum(sp.deezerFansDelta7d)})
                </span>
              )}
            </span>
          )}
        </div>
      )}

      {/* Catalog highlights */}
      {(data.viralSongs != null ||
        data.hotSongsCount != null ||
        data.songsAccelerating != null) && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.04]">
          {data.viralSongs != null && data.viralSongs > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#FF453A] bg-[rgba(255,69,58,0.12)]">
              {data.viralSongs} viral songs
            </span>
          )}
          {data.hotSongsCount != null && data.hotSongsCount > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#FF9F0A] bg-[rgba(255,159,10,0.12)]">
              {data.hotSongsCount} hot songs
            </span>
          )}
          {data.songsAccelerating != null && data.songsAccelerating > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#30D158] bg-[rgba(48,209,88,0.12)]">
              {data.songsAccelerating} accelerating
            </span>
          )}
          {data.soundSparkScore != null && (
            <span className="text-[10px] font-mono text-white/35 px-2 py-0.5 rounded-full border border-white/[0.06]">
              Sound Spark: {data.soundSparkScore.toFixed(0)}
            </span>
          )}
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4a: Fan Comment Pulse
   ═══════════════════════════════════════════════════════════════ */

const VIBE_CONFIG: Record<string, { label: string; color: string }> = {
  rabid: { label: "Rabid", color: "#FF453A" },
  engaged: { label: "Engaged", color: "#30D158" },
  casual: { label: "Casual", color: "#0A84FF" },
  mixed: { label: "Mixed", color: "#FFD60A" },
  cold: { label: "Cold", color: "#8E8E93" },
  highly_engaged: { label: "Highly Engaged", color: "#30D158" },
  positive: { label: "Positive", color: "#30D158" },
  neutral: { label: "Neutral", color: "#8E8E93" },
  negative: { label: "Negative", color: "#FF453A" },
};

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  praise: { label: "Praise", color: "#30D158" },
  hype: { label: "Hype", color: "#FF9F0A" },
  lyric_quote: { label: "Lyric Quotes", color: "#BF5AF2" },
  trend_reference: { label: "Trend Refs", color: "#0A84FF" },
  question: { label: "Questions", color: "#5AC8FA" },
  collab_request: { label: "Collab Requests", color: "#FFD60A" },
  complaint: { label: "Complaints", color: "#FF453A" },
};

function CommentPulseSection({ data }: { data: ContentIntelData }) {
  const cp = data.commentPulse;

  if (!cp || cp.sentimentScore == null) return null;

  const sentimentColor =
    cp.sentimentScore >= 70
      ? "#30D158"
      : cp.sentimentScore >= 40
        ? "#FFD60A"
        : "#FF453A";
  const energyColor =
    cp.fanEnergy != null && cp.fanEnergy >= 70
      ? "#FF9F0A"
      : cp.fanEnergy != null && cp.fanEnergy >= 40
        ? "#0A84FF"
        : "#8E8E93";

  // Intent breakdown bars
  const intents =
    cp.intentBreakdown != null
      ? Object.entries(cp.intentBreakdown)
          .filter(([, v]) => (v as number) > 0)
          .sort(([, a], [, b]) => (b as number) - (a as number))
      : [];
  const maxIntent = intents.length
    ? Math.max(...intents.map(([, v]) => v as number), 1)
    : 1;

  // Radar chart data — normalize all 8 axes to 0-100
  const totalIntents =
    intents.reduce((sum, [, v]) => sum + (v as number), 0) || 1;
  const radarData = [
    { axis: "Sentiment", value: cp.sentimentScore, fullMark: 100 },
    { axis: "Energy", value: cp.fanEnergy ?? 0, fullMark: 100 },
    ...[
      "praise",
      "hype",
      "lyric_quote",
      "trend_reference",
      "question",
      "collab_request",
    ].map((key) => ({
      axis: INTENT_LABELS[key]?.label ?? key.replace(/_/g, " "),
      value: Math.round(
        ((cp.intentBreakdown?.[key] ?? 0) / totalIntents) * 100,
      ),
      fullMark: 100,
    })),
  ];
  const hasRadar = radarData.some((d) => d.value > 0) && intents.length >= 2;

  // Top comments
  const topComments = [
    cp.topCommentText,
    cp.secondCommentText,
    cp.thirdCommentText,
  ].filter(Boolean);

  return (
    <SectionCard title="Fan Comment Pulse">
      {/* Gauges + vibe — grouped tightly */}
      <div className="flex items-center gap-5 mb-4">
        <Gauge
          label="Sentiment"
          value={cp.sentimentScore}
          color={sentimentColor}
        />
        {cp.fanEnergy != null && (
          <Gauge label="Energy" value={cp.fanEnergy} color={energyColor} />
        )}
        <div className="flex flex-col items-end gap-1 ml-auto">
          {cp.audienceVibe && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
              style={{
                color:
                  VIBE_CONFIG[cp.audienceVibe]?.color ??
                  "rgba(255,255,255,0.4)",
                background: `${VIBE_CONFIG[cp.audienceVibe]?.color ?? "#8E8E93"}18`,
              }}
            >
              {VIBE_CONFIG[cp.audienceVibe]?.label ?? cp.audienceVibe}
            </span>
          )}
          {cp.totalCommentsAnalyzed != null && (
            <span className="text-[10px] font-mono text-white/30">
              {cp.totalCommentsAnalyzed.toLocaleString()} comments
            </span>
          )}
        </div>
      </div>

      {/* Radar chart — 8 axes */}
      {hasRadar && (
        <div className="mb-3 pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">
            Fan Signal Radar
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="axis"
                tick={{
                  fontSize: 10,
                  fill: "rgba(255,255,255,0.4)",
                  fontFamily: '"DM Sans", sans-serif',
                }}
              />
              <Radar
                dataKey="value"
                stroke="#e8430a"
                fill="#e8430a"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Intent breakdown bars */}
      {intents.length > 0 && (
        <div className="mb-3 pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            What Fans Are Saying
          </div>
          <div className="space-y-1.5">
            {intents.slice(0, 7).map(([key, val]) => {
              const cfg = INTENT_LABELS[key] ?? {
                label: key.replace(/_/g, " "),
                color: "#8E8E93",
              };
              const pct = Math.round(((val as number) / totalIntents) * 100);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[11px] text-white/45 w-[85px] shrink-0 text-right truncate">
                    {cfg.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${((val as number) / maxIntent) * 100}%`,
                        background: cfg.color,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-white/30 w-[34px] text-right tabular-nums shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme chips */}
      {Array.isArray(cp.sentimentThemes) && cp.sentimentThemes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pt-3 border-t border-white/[0.04]">
          {cp.sentimentThemes.slice(0, 8).map((t, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full border border-white/[0.06] text-white/45"
            >
              {t.theme}
              {t.count != null && (
                <span className="text-white/20 ml-1 font-mono">{t.count}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Top comments */}
      {topComments.length > 0 && (
        <div className="pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            Top Comments
          </div>
          <div className="space-y-2">
            {topComments.map((c, i) => (
              <div
                key={i}
                className="text-[12px] text-white/55 pl-3 border-l-2 border-white/[0.08] leading-relaxed"
              >
                &ldquo;{c}&rdquo;
                {i === 0 && cp.topCommentLikes != null && (
                  <span className="text-[10px] text-white/25 ml-2 font-mono">
                    {fmtNum(cp.topCommentLikes)} likes
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI content ideas */}
      {Array.isArray(cp.aiContentIdeas) && cp.aiContentIdeas.length > 0 && (
        <div className="pt-3 mt-3 border-t border-white/[0.04]">
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            Content Ideas from Fans
          </div>
          <div className="space-y-1">
            {cp.aiContentIdeas.slice(0, 4).map((idea, i) => (
              <div key={i} className="text-[12px] text-white/60 pl-3 relative">
                <span className="absolute left-0 text-white/20">·</span>
                {idea}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fan requests */}
      {Array.isArray(cp.fanRequests) && cp.fanRequests.length > 0 && (
        <div className="pt-3 mt-3 border-t border-white/[0.04]">
          <div className="text-[10px] font-semibold text-[#FFD60A] uppercase tracking-wider mb-2">
            Fan Requests
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cp.fanRequests.slice(0, 6).map((req, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full text-white/65"
                style={{
                  background: "rgba(255,214,10,0.08)",
                  border: "1px solid rgba(255,214,10,0.2)",
                }}
              >
                {req}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 4b: Playlist Intelligence
   ═══════════════════════════════════════════════════════════════ */

function PlaylistIntelligenceSection({ data }: { data: ContentIntelData }) {
  const pl = data.playlistIntel;

  if (!pl || pl.songsInPlaylists === 0) return null;

  const reachTierColor: Record<string, string> = {
    massive: "#FF453A",
    high: "#FF9F0A",
    medium: "#0A84FF",
    low: "#8E8E93",
  };

  return (
    <SectionCard title="Playlist Intelligence">
      {/* Big numbers — tighter grid with consistent sizing */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1">
            Songs Listed
          </div>
          <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">
            {pl.songsInPlaylists}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1">
            Placements
          </div>
          <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">
            {pl.totalPlaylistPlacements}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1">
            Total Reach
          </div>
          <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">
            {fmtNum(pl.totalPlaylistReach)}
          </div>
        </div>
      </div>

      {/* Best placement */}
      {pl.bestSong && pl.bestPlaylistName && (
        <div className="py-3 border-t border-white/[0.04]">
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
            Best Placement
          </div>
          <div className="text-[13px] text-white/70">
            <span className="font-medium text-white/87">{pl.bestSong}</span>
            <span className="text-white/30"> in </span>
            <span className="text-[#0A84FF]">{pl.bestPlaylistName}</span>
            {pl.bestPlaylistReach != null && (
              <span className="text-[11px] text-white/35 ml-1 font-mono">
                ({fmtNum(pl.bestPlaylistReach)} reach)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-white/[0.04]">
        {pl.bestPositionOverall != null && (
          <StatChip
            label="Best Position"
            value={`#${pl.bestPositionOverall}`}
          />
        )}
        {pl.avgPlaylistPosition != null && (
          <StatChip
            label="Avg Position"
            value={`#${Math.round(pl.avgPlaylistPosition)}`}
          />
        )}
        {pl.highReachPlacements > 0 && (
          <StatChip label="High Reach" value={String(pl.highReachPlacements)} />
        )}
        {pl.massivePlacements > 0 && (
          <StatChip
            label="Massive"
            value={String(pl.massivePlacements)}
            color="#FF453A"
          />
        )}
        {pl.overallReachTier && (
          <span
            className="self-end text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              color:
                reachTierColor[pl.overallReachTier] ?? "rgba(255,255,255,0.4)",
              background: `${reachTierColor[pl.overallReachTier] ?? "#8E8E93"}18`,
            }}
          >
            {pl.overallReachTier} reach
          </span>
        )}
      </div>

      {/* Top playlist songs */}
      {Array.isArray(pl.topPlaylistSongs) && pl.topPlaylistSongs.length > 0 && (
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
                    <span className="font-mono text-white/35 tabular-nums">
                      {s.playlist_count} playlists
                    </span>
                  )}
                  {s.total_reach != null && (
                    <span className="font-mono text-white/45 tabular-nums">
                      {fmtNum(s.total_reach)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 5+6: Content Activity (merged Evolution + Health)
   ═══════════════════════════════════════════════════════════════ */

function ContentActivitySection({ data }: { data: ContentIntelData }) {
  const vs = data.videoSummary;

  const cadenceColor =
    (vs?.postingCadence ?? data.performanceTrend) === "daily" ||
    (vs?.postingCadence ?? "") === "regular"
      ? "#30D158"
      : (vs?.postingCadence ?? "") === "sporadic"
        ? "#FFD60A"
        : "#8E8E93";

  const trendColor2 =
    data.performanceTrend === "improving"
      ? "#30D158"
      : data.performanceTrend === "declining"
        ? "#FF453A"
        : "rgba(255,255,255,0.55)";

  const hasEvolution =
    data.strategyLabel ||
    data.formatShift ||
    data.viewsChangePct != null ||
    data.moodShift ||
    (data.newFormats && data.newFormats.length > 0);

  return (
    <SectionCard title="Content Activity">
      {/* Health stats — top row */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <StatChip
          label="Cadence"
          value={
            vs?.postingCadence
              ? vs.postingCadence.charAt(0).toUpperCase() +
                vs.postingCadence.slice(1)
              : "—"
          }
          color={cadenceColor}
        />
        <StatChip
          label="Consistency"
          value={
            vs?.consistencyScore != null
              ? `${Math.round(vs.consistencyScore)}%`
              : "—"
          }
          color={
            vs?.consistencyScore != null && vs.consistencyScore >= 70
              ? "#30D158"
              : undefined
          }
        />
        <StatChip
          label="Engagement"
          value={
            vs?.avgEngagementRate != null
              ? `${vs.avgEngagementRate.toFixed(2)}%`
              : "—"
          }
        />
        <StatChip
          label="Performance"
          value={
            data.performanceTrend
              ? data.performanceTrend.charAt(0).toUpperCase() +
                data.performanceTrend.slice(1)
              : "—"
          }
          color={trendColor2}
        />
      </div>

      {/* Video count breakdown + virality */}
      {vs && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-white/[0.04]">
          {vs.totalVideos != null && (
            <span className="text-[11px] text-white/35">
              {vs.totalVideos} total videos
            </span>
          )}
          {vs.videos7d != null && (
            <span className="text-[11px] text-white/35">
              {vs.videos7d} in 7d
            </span>
          )}
          {vs.videos30d != null && (
            <span className="text-[11px] text-white/35">
              {vs.videos30d} in 30d
            </span>
          )}
          {vs.avgViralityRatio != null && (
            <span className="text-[11px] text-white/35">
              Virality:{" "}
              <span className="font-mono text-white/55">
                {vs.avgViralityRatio.toFixed(2)}x
              </span>
            </span>
          )}
          {vs.playsTrendPct != null && (
            <span
              className="text-[11px] font-mono tabular-nums"
              style={{ color: trendColor(vs.playsTrendPct) }}
            >
              Plays: {pctStr(vs.playsTrendPct)}
            </span>
          )}
          {vs.engagementTrendPct != null && (
            <span
              className="text-[11px] font-mono tabular-nums"
              style={{ color: trendColor(vs.engagementTrendPct) }}
            >
              Engage: {pctStr(vs.engagementTrendPct)}
            </span>
          )}
        </div>
      )}

      {/* Pinned videos + top sound */}
      {vs &&
        (vs.pinnedCount != null ||
          vs.topSoundTitle != null ||
          (vs.topHashtags && vs.topHashtags.length > 0)) && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/[0.04]">
            {vs.pinnedCount != null && vs.pinnedCount > 0 && (
              <span className="text-[11px] text-white/35">
                {vs.pinnedCount} pinned (avg {fmtNum(vs.pinnedAvgPlays)} plays)
              </span>
            )}
            {vs.topSoundTitle && (
              <span className="text-[11px] text-white/35 truncate max-w-[200px]">
                Top sound: {vs.topSoundTitle}
              </span>
            )}
            {vs.topHashtags && vs.topHashtags.length > 0 && (
              <span className="text-[11px] text-white/35 truncate">
                #{vs.topHashtags.slice(0, 3).join(" #")}
              </span>
            )}
          </div>
        )}

      {/* Content evolution section */}
      {hasEvolution && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-3">
            Evolution
          </div>
          <div className="space-y-2.5">
            {data.strategyLabel && (
              <p className="text-[13px] text-white/70 leading-snug">
                {data.strategyLabel}
              </p>
            )}

            {/* Format shift + views change — inline */}
            <div className="flex flex-wrap items-center gap-3">
              {data.formatShift &&
                data.priorTopFormat &&
                data.recentTopFormat && (
                  <span className="text-[12px]">
                    <span className="text-white/40">{data.priorTopFormat}</span>
                    <span className="text-white/20 mx-1">{"\u2192"}</span>
                    <span className="text-[#0A84FF] font-medium">
                      {data.recentTopFormat}
                    </span>
                  </span>
                )}
              {data.viewsChangePct != null && (
                <span
                  className="text-[12px] font-medium font-mono tabular-nums"
                  style={{
                    color: data.viewsChangePct > 0 ? "#30D158" : "#FF453A",
                  }}
                >
                  {data.viewsChangePct > 0 ? "+" : ""}
                  {data.viewsChangePct.toFixed(0)}% views
                </span>
              )}
              {data.recentAvgViews != null && data.priorAvgViews != null && (
                <span className="text-[11px] text-white/30">
                  {fmtNum(data.priorAvgViews)} → {fmtNum(data.recentAvgViews)}{" "}
                  avg
                </span>
              )}
              {data.recentAvgHookScore != null &&
                data.priorAvgHookScore != null && (
                  <span className="text-[11px] text-white/30">
                    Hook: {data.priorAvgHookScore.toFixed(1)} →{" "}
                    <span
                      style={{
                        color:
                          data.recentAvgHookScore > data.priorAvgHookScore
                            ? "#30D158"
                            : data.recentAvgHookScore < data.priorAvgHookScore
                              ? "#FF453A"
                              : undefined,
                      }}
                    >
                      {data.recentAvgHookScore.toFixed(1)}
                    </span>
                  </span>
                )}
            </div>

            {/* Mood shift */}
            {data.moodShift &&
              data.priorDominantMood &&
              data.recentDominantMood && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-white/30">Mood:</span>
                  <span className="text-white/40">
                    {data.priorDominantMood}
                  </span>
                  <span className="text-white/20">{"\u2192"}</span>
                  <span className="text-white/60">
                    {data.recentDominantMood}
                  </span>
                </div>
              )}

            {/* New & dropped formats */}
            {((data.newFormats && data.newFormats.length > 0) ||
              (data.droppedFormats && data.droppedFormats.length > 0)) && (
              <div className="flex flex-wrap gap-1.5">
                {data.newFormats?.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: "#30D158",
                      background: "rgba(48,209,88,0.12)",
                    }}
                  >
                    + {f}
                  </span>
                ))}
                {data.droppedFormats?.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: "#FF453A",
                      background: "rgba(255,69,58,0.12)",
                    }}
                  >
                    − {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6b: Anomalies
   ═══════════════════════════════════════════════════════════════ */

function AnomaliesSection({
  anomalies,
}: {
  anomalies: ContentIntelData["anomalies"];
}) {
  const typeColors: Record<string, string> = {
    views_spike: "#30D158",
    views_drop: "#FF453A",
    engagement_spike: "#FF9F0A",
    engagement_drop: "#FF9F0A",
    comment_rate_spike: "#0A84FF",
    posting_drought: "#FF453A",
    share_spike: "#BF5AF2",
  };

  // Group anomalies by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof anomalies>();
    for (const a of anomalies) {
      const key = a.date || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries());
  }, [anomalies]);

  return (
    <SectionCard title="Recent Anomalies">
      {anomalies.length === 0 ? (
        <EmptyState message="No anomalies detected in the last 7 days — steady performance" />
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="text-[10px] font-mono text-white/25 mb-1.5">
                {date}
              </div>
              <div className="space-y-0">
                {items.map((a, i) => {
                  const color = typeColors[a.type] || "#FFD60A";
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-2 border-l-2 pl-3"
                      style={{
                        borderColor: color,
                        borderBottom:
                          i < items.length - 1
                            ? "1px solid rgba(255,255,255,0.03)"
                            : undefined,
                      }}
                    >
                      <p className="text-[12px] text-white/70 leading-snug min-w-0">
                        {a.message || a.type.replace(/_/g, " ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7: Sound Performance on TikTok
   ═══════════════════════════════════════════════════════════════ */

function SoundPerformanceSection({
  songs,
}: {
  songs: ContentIntelData["topSongs"];
}) {
  const statusColors: Record<string, string> = {
    viral: "#FF453A",
    trending: "#FF9F0A",
    active: "#30D158",
    established: "#0A84FF",
    emerging: "#BF5AF2",
  };

  return (
    <SectionCard title="Sound Performance on TikTok">
      {songs.length === 0 ? (
        <EmptyState message="No catalog tracks found on TikTok yet" />
      ) : (
        <div className="space-y-2">
          {songs.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-white/75 font-medium truncate">
                  {s.songName}
                </p>
                <p className="text-[10px] text-white/30">
                  {s.videoCount} videos · {s.uniqueCreators} creators
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {s.status && (
                  <span
                    className="text-[10px] font-semibold uppercase"
                    style={{
                      color: statusColors[s.status] || "rgba(255,255,255,0.4)",
                    }}
                  >
                    {s.status}
                  </span>
                )}
                <span className="text-[13px] font-medium text-white/55 tabular-nums">
                  {fmtNum(s.totalPlays)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* (AIBriefSection removed — replaced by ArtistBriefDropdown) */

/* ═══════════════════════════════════════════════════════════════
   SECTION 8b: Touring Signal
   ═══════════════════════════════════════════════════════════════ */

const TOURING_STATUS_CONFIG: Record<string, { label: string; color: string }> =
  {
    heavy_touring: { label: "Heavy Touring", color: "#FF453A" },
    active_touring: { label: "Active Touring", color: "#FF9F0A" },
    selective_dates: { label: "Selective Dates", color: "#0A84FF" },
    minimal_live: { label: "Minimal Live", color: "#8E8E93" },
    no_live_activity: { label: "No Live Activity", color: "#8E8E93" },
  };

function TouringSignalSection({ data }: { data: ContentIntelData }) {
  const ts = data.touringSignal;
  if (!ts || ts.totalUpcomingEvents === 0) return null;

  const cfg =
    TOURING_STATUS_CONFIG[ts.touringStatus] ??
    TOURING_STATUS_CONFIG.no_live_activity;

  return (
    <SectionCard title="Touring Signal">
      <div className="flex items-center gap-4 mb-3">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: cfg.color, background: `${cfg.color}18` }}
        >
          {cfg.label}
        </span>
        <span className="text-[24px] font-bold text-white/87 font-mono tabular-nums">
          {ts.totalUpcomingEvents}
        </span>
        <span className="text-[11px] text-white/35 uppercase tracking-wider">
          Upcoming Events
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {ts.bandstownUpcoming > 0 && (
          <StatChip label="Bandsintown" value={String(ts.bandstownUpcoming)} />
        )}
        {ts.ticketmasterUpcoming > 0 && (
          <StatChip
            label="Ticketmaster"
            value={String(ts.ticketmasterUpcoming)}
          />
        )}
        {ts.newEventsAnnounced7d > 0 && (
          <StatChip
            label="New This Week"
            value={String(ts.newEventsAnnounced7d)}
            color="#30D158"
          />
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8c: Catalog Velocity Grid
   ═══════════════════════════════════════════════════════════════ */

const VELOCITY_COLORS: Record<string, string> = {
  viral: "#FF453A",
  accelerating: "#FF9F0A",
  growing: "#30D158",
  steady: "#8E8E93",
  decelerating: "#FFD60A",
  declining: "#FF453A",
  new: "#BF5AF2",
};

function CatalogVelocitySection({ data }: { data: ContentIntelData }) {
  const songs = data.songVelocity ?? [];
  if (songs.length === 0) return null;

  return (
    <SectionCard title="Catalog Velocity">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px_70px_80px] gap-2 text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-2 px-1">
        <span>Song</span>
        <span className="text-right">Daily Streams</span>
        <span className="text-right">Total</span>
        <span className="text-right">7d Change</span>
        <span className="text-right">Status</span>
      </div>

      <div className="space-y-0">
        {songs.map((s, i) => {
          const velColor = VELOCITY_COLORS[s.velocityClass] ?? "#8E8E93";
          return (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_70px_80px] gap-2 items-center py-2 px-1"
              style={{
                borderBottom:
                  i < songs.length - 1
                    ? "1px solid rgba(255,255,255,0.03)"
                    : undefined,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {s.peakRatio != null && s.peakRatio >= 0.85 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] shrink-0"
                    title="Near peak"
                  />
                )}
                <span className="text-[13px] text-white/70 truncate">
                  {s.songName}
                </span>
              </div>
              <span className="text-[12px] font-mono text-white/55 tabular-nums text-right">
                {fmtNum(s.dailyStreams)}
              </span>
              <span className="text-[12px] font-mono text-white/35 tabular-nums text-right">
                {fmtNum(s.totalStreams)}
              </span>
              <span
                className="text-[12px] font-mono font-medium tabular-nums text-right"
                style={{ color: trendColor(s.pctChange7d) }}
              >
                {s.pctChange7d != null ? pctStr(s.pctChange7d) : "—"}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wide text-right"
                style={{ color: velColor }}
              >
                {s.velocityClass.replace(/_/g, " ")}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8d: Where Next? (Market Expansion)
   ═══════════════════════════════════════════════════════════════ */

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  BR: "Brazil",
  MX: "Mexico",
  AU: "Australia",
  CA: "Canada",
  JP: "Japan",
  KR: "South Korea",
  IN: "India",
  ID: "Indonesia",
  NG: "Nigeria",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  TR: "Turkey",
  TH: "Thailand",
  PH: "Philippines",
  CO: "Colombia",
  AR: "Argentina",
  CL: "Chile",
  ZA: "South Africa",
  EG: "Egypt",
  SA: "Saudi Arabia",
  AE: "UAE",
  NZ: "New Zealand",
  IE: "Ireland",
  PT: "Portugal",
  BE: "Belgium",
  AT: "Austria",
  CH: "Switzerland",
  CZ: "Czech Republic",
  RO: "Romania",
  HU: "Hungary",
  GR: "Greece",
  IL: "Israel",
  MY: "Malaysia",
  SG: "Singapore",
  TW: "Taiwan",
  HK: "Hong Kong",
  VN: "Vietnam",
  PE: "Peru",
  EC: "Ecuador",
};

const URGENCY_BADGE: Record<string, { label: string; color: string }> = {
  act_now: { label: "Act Now", color: "#FF453A" },
  plan: { label: "Plan", color: "#FFD60A" },
  monitor: { label: "Monitor", color: "#8E8E93" },
};

const ACTION_COLORS: Record<string, string> = {
  expand: "#FF453A",
  grow: "#FF9F0A",
  push: "#0A84FF",
  maintain: "#30D158",
  monitor: "#8E8E93",
};

function MarketExpansionSection({ data }: { data: ContentIntelData }) {
  const markets = data.marketExpansion ?? [];
  if (markets.length === 0) return null;

  const actNow = markets.filter((m) => m.urgency === "act_now");
  const plan = markets.filter((m) => m.urgency === "plan");
  const monitor = markets.filter((m) => m.urgency === "monitor");

  const renderMarket = (m: (typeof markets)[0], i: number) => {
    const country = COUNTRY_NAMES[m.countryCode] ?? m.countryCode;
    const urgCfg = URGENCY_BADGE[m.urgency] ?? URGENCY_BADGE.monitor;
    const actionColor = ACTION_COLORS[m.recommendedAction] ?? "#8E8E93";

    return (
      <div
        key={`${m.countryCode}-${i}`}
        className="rounded-lg p-3 border border-white/[0.04] hover:border-white/[0.08] transition-colors"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        {/* Top: country + score (urgency already shown in group header) */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-white/80">
              {country}
            </span>
            <span className="text-[10px] font-mono text-white/30">
              {m.countryCode}
            </span>
          </div>
          <span className="text-[16px] font-bold font-mono text-white/75 tabular-nums">
            {m.opportunityScore}
          </span>
        </div>

        {/* Action + confidence */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span
            className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
            style={{ color: actionColor, background: `${actionColor}15` }}
          >
            {m.recommendedAction}
          </span>
          {m.windowConfidence && (
            <span className="text-[9px] text-white/30 px-1.5 py-0.5">
              {m.windowConfidence} confidence
            </span>
          )}
          {m.discoverySignalType && m.discoverySignalType !== "normal" && (
            <span className="text-[9px] text-[#BF5AF2] px-1.5 py-0.5">
              {m.discoverySignalType.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Spillover + entry song */}
        <div className="space-y-1 text-[11px]">
          {m.spilloverProbability != null &&
            m.spilloverProbability > 0 &&
            m.spilloverSourceMarket && (
              <div className="text-white/45">
                <span className="text-white/25">Spillover from </span>
                <span className="font-medium text-white/60">
                  {COUNTRY_NAMES[m.spilloverSourceMarket] ??
                    m.spilloverSourceMarket}
                </span>
                <span className="font-mono text-[#FF9F0A] ml-1">
                  {Math.round(m.spilloverProbability)}%
                </span>
                {m.estimatedActivationDays != null && (
                  <span className="text-white/25 ml-1">
                    ~{m.estimatedActivationDays}d
                  </span>
                )}
              </div>
            )}
          {m.entrySongName && (
            <div className="text-white/40">
              <span className="text-white/25">Entry song: </span>
              <span className="text-white/55">{m.entrySongName}</span>
              {m.entrySongVelocity && (
                <span
                  className="ml-1 text-[10px] font-semibold uppercase"
                  style={{
                    color: VELOCITY_COLORS[m.entrySongVelocity] ?? "#8E8E93",
                  }}
                >
                  {m.entrySongVelocity}
                </span>
              )}
            </div>
          )}
          {m.estimatedRevenue != null && m.estimatedRevenue > 0 && (
            <div className="text-white/30 font-mono tabular-nums">
              Est. ${fmtNum(m.estimatedRevenue)}/mo
            </div>
          )}
          {m.platformToActivateFirst && (
            <div className="text-white/30">
              Activate on:{" "}
              <span className="text-white/50">{m.platformToActivateFirst}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <SectionCard title="Where Next? — Market Expansion">
      {/* Act Now section */}
      {actNow.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-[#FF453A] uppercase tracking-wider mb-2">
            Act Now ({actNow.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {actNow.map(renderMarket)}
          </div>
        </div>
      )}

      {/* Plan section */}
      {plan.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-[#FFD60A] uppercase tracking-wider mb-2">
            Plan ({plan.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {plan.map(renderMarket)}
          </div>
        </div>
      )}

      {/* Monitor section */}
      {monitor.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            Monitor ({monitor.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {monitor.map(renderMarket)}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 9: Artist Brief (collapsible dropdown)
   ═══════════════════════════════════════════════════════════════ */

const URGENCY_COLORS: Record<string, { color: string; bg: string }> = {
  high: { color: "#FF453A", bg: "rgba(255,69,58,0.08)" },
  medium: { color: "#FFD60A", bg: "rgba(255,214,10,0.08)" },
  low: { color: "#0A84FF", bg: "rgba(10,132,255,0.08)" },
};

function ArtistBriefDropdown({ data }: { data: ContentIntelData }) {
  const sections = data.briefSections;
  const actionItems = data.briefActionItems;
  const html = data.briefHtml;
  const generatedAt = data.briefGeneratedAt;
  const [open, setOpen] = useState(false);

  const hasStructured =
    (sections && sections.length > 0) ||
    (actionItems && actionItems.length > 0);
  const hasHtml = !!html;

  if (!hasStructured && !hasHtml) return null;

  return (
    <div
      className="rounded-xl border border-white/[0.06] overflow-hidden"
      style={{ background: "#1C1C1E" }}
    >
      {/* Clickable header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] text-white/25 transition-transform duration-200"
            style={{
              display: "inline-block",
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Artist Brief
          </h3>
          {actionItems && actionItems.length > 0 && (
            <span className="text-[10px] font-mono text-white/20">
              {actionItems.length} action items
            </span>
          )}
        </div>
        {generatedAt && (
          <span className="text-[10px] text-white/22">
            Updated{" "}
            {new Date(generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.04]">
          {/* Action items checklist */}
          {actionItems && actionItems.length > 0 && (
            <div className="mt-4 mb-5">
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
                Action Items
              </div>
              <div className="space-y-1.5">
                {actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-[14px] h-[14px] rounded border border-white/[0.15] shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-sm bg-[#e8430a]" />
                    </div>
                    <span className="text-[12px] text-white/65 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insight sections */}
          {sections && sections.length > 0 && (
            <div className="space-y-3 mb-5">
              {sections.map((s, i) => {
                const urgency = URGENCY_COLORS[s.urgency] ?? URGENCY_COLORS.low;
                return (
                  <div
                    key={i}
                    className="rounded-lg p-3.5 border-l-2"
                    style={{
                      background: urgency.bg,
                      borderColor: urgency.color,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-white/80">
                        {s.heading}
                      </span>
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: urgency.color }}
                      >
                        {s.urgency}
                      </span>
                    </div>
                    <div
                      className="text-[12px] text-white/55 leading-relaxed [&_strong]:text-white/75"
                      dangerouslySetInnerHTML={{ __html: s.body }}
                    />
                    {s.action && (
                      <div className="mt-2 pt-2 border-t border-white/[0.04]">
                        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                          Opportunity:{" "}
                        </span>
                        <span className="text-[11px] text-white/55">
                          {s.action}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Full brief HTML */}
          {hasHtml && (
            <div
              className="prose prose-invert prose-sm max-w-none [&_*]:text-white/75 [&_h1]:text-white/87 [&_h2]:text-white/87 [&_h3]:text-white/87 [&_strong]:text-white/87 pt-4 border-t border-white/[0.04]"
              dangerouslySetInnerHTML={{ __html: html! }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN VIEW
   ═══════════════════════════════════════════════════════════════ */

export default function ContentIntelligenceView({
  entityId,
  artistHandle,
}: {
  entityId: string | null;
  artistHandle: string | null;
}) {
  const { data, loading } = useContentIntelligence(entityId, artistHandle);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        {/* Hero skeleton */}
        <div
          className="rounded-xl border border-white/[0.06] p-6"
          style={{ background: "#1C1C1E" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <Skeleton className="h-14 w-14 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded" />
          </div>
          <div className="flex gap-5 mt-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-16 rounded" />
                <Skeleton className="h-1.5 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] p-5"
              style={{ background: "#1C1C1E" }}
            >
              <Skeleton className="h-3 w-24 rounded mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-2.5 w-12 rounded" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Full-width skeleton */}
        <div
          className="rounded-xl border border-white/[0.06] p-5"
          style={{ background: "#1C1C1E" }}
        >
          <Skeleton className="h-3 w-32 rounded mb-4" />
          {[0, 1, 2, 3].map((j) => (
            <div key={j} className="flex justify-between mb-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
        {/* Two more columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] p-5"
              style={{ background: "#1C1C1E" }}
            >
              <Skeleton className="h-3 w-28 rounded mb-4" />
              <div className="space-y-2">
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} className="h-4 w-full rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-[15px] text-white/55">
          No content intelligence data available
        </p>
        <p className="text-[13px] text-white/25 mt-1">
          This artist may not have been analyzed yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Content Command Center (full-width hero) */}
      <ContentCommandCenter data={data} />

      {/* 2. TikTok Profile | Audience Footprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TikTokProfileSection data={data} />
        <AudienceFootprintSection data={data} />
      </div>

      {/* 3. Format Performance (full-width) */}
      <FormatPerformanceSection data={data} />

      {/* 3b. Streaming Pulse (full-width) */}
      <StreamingPulseSection data={data} />

      {/* 4. Comment Pulse | Playlist Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CommentPulseSection data={data} />
        <PlaylistIntelligenceSection data={data} />
      </div>

      {/* 5+6. Content Activity | Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ContentActivitySection data={data} />
        <AnomaliesSection anomalies={data.anomalies} />
      </div>

      {/* 7. Sound Performance on TikTok (full-width) */}
      <SoundPerformanceSection songs={data.topSongs} />

      {/* 7b. Catalog Velocity Grid (full-width) */}
      <CatalogVelocitySection data={data} />

      {/* 7c. Touring Signal | Where Next? */}
      {(data.touringSignal || data.marketExpansion?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5">
          <TouringSignalSection data={data} />
          <MarketExpansionSection data={data} />
        </div>
      )}

      {/* 8. Artist Brief (collapsible dropdown) */}
      <ArtistBriefDropdown data={data} />
    </div>
  );
}
