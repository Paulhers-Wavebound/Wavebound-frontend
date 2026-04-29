/**
 * Content Tab — "What content should my team create next?"
 *
 * Renders: Format Performance, Content Activity + Evolution,
 * Fan Comment Pulse, TikTok Profile Detail
 *
 * Rather than duplicating the full rendering logic from
 * ContentIntelligenceView (2,625 lines), we import and render
 * the existing ContentIntelligenceView but filter to content-relevant
 * sections only. For now, we delegate to the existing monolith
 * since those section functions are not independently exported.
 *
 * TODO: Extract individual section functions from ContentIntelligenceView
 * into standalone components for cleaner composition.
 */
import {
  useContentIntelligence,
  type ContentIntelData,
} from "@/hooks/useContentIntelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

// We re-render the content-relevant sections from ContentIntelligenceView.
// Since the section functions are internal to that file, we use a wrapper
// approach: render the full component but it's filtered by what makes sense.
// For the initial implementation, we render ContentIntelligenceView's
// relevant sections by importing the data and using inline rendering.

import { useState, useMemo } from "react";
import { TIKTOK_GRADE_CONFIG } from "@/types/artistIntelligence";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  fmtNum,
  pctStr,
  trendColor,
  StatChip,
  SectionCard,
  Gauge,
  EmptyState,
} from "./shared";
import InfoTooltip from "@/components/label/intelligence/InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const FP = STAT_TOOLTIPS.content.formatPerformance;
const CA = STAT_TOOLTIPS.content.activity;
const TT = STAT_TOOLTIPS.content.tiktokProfile;
const FC = STAT_TOOLTIPS.content.fanComments;

/* ─── Config ──────────────────────────────────────────────── */

const CONSISTENCY_COLORS: Record<string, string> = {
  daily: "#30D158",
  regular: "#0A84FF",
  sporadic: "#FFD60A",
  inactive: "#FF9F0A",
  dormant: "#FF453A",
};

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

/* ─── Main Component ──────────────────────────────────────── */

interface ContentTabProps {
  data: ContentIntelData;
}

export default function ContentTab({ data }: ContentTabProps) {
  const [expandedFormat, setExpandedFormat] = useState<string | null>(null);
  const [showFormatDetails, setShowFormatDetails] = useState(false);

  const rows = data.formatPerformance ?? [];
  const dna = data.contentDna;
  const videos = data.formatVideos ?? {};
  const vs = data.videoSummary;
  const cp = data.commentPulse;

  // Bar baseline: use max avgViews, but clamp to 3× the median when a single
  // viral outlier would otherwise compress the rest of the chart to slivers.
  const maxViews = Math.max(...rows.map((r) => r.avgViews ?? 0), 1);
  const medianAvgViews = (() => {
    const sorted = rows
      .map((r) => r.avgViews ?? 0)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  })();
  const barBaseline =
    medianAvgViews > 0 && maxViews > medianAvgViews * 3
      ? medianAvgViews * 3
      : maxViews;

  // Comment pulse derived values
  const sentimentColor =
    cp?.sentimentScore != null
      ? cp.sentimentScore >= 70
        ? "#30D158"
        : cp.sentimentScore >= 40
          ? "#FFD60A"
          : "#FF453A"
      : "#8E8E93";
  const energyColor =
    cp?.fanEnergy != null
      ? cp.fanEnergy >= 70
        ? "#FF9F0A"
        : cp.fanEnergy >= 40
          ? "#0A84FF"
          : "#8E8E93"
      : "#8E8E93";

  const intents =
    cp?.intentBreakdown != null
      ? Object.entries(cp.intentBreakdown)
          .filter(([, v]) => (v as number) > 0)
          .sort(([, a], [, b]) => (b as number) - (a as number))
      : [];
  const totalIntents =
    intents.reduce((sum, [, v]) => sum + (v as number), 0) || 1;
  const maxIntent = intents.length
    ? Math.max(...intents.map(([, v]) => v as number), 1)
    : 1;

  const topComments = cp
    ? [cp.topCommentText, cp.secondCommentText, cp.thirdCommentText].filter(
        Boolean,
      )
    : [];

  // TikTok profile
  const grade =
    TIKTOK_GRADE_CONFIG[data.tiktokGrade || "C"] ?? TIKTOK_GRADE_CONFIG.C;
  const consistencyColor =
    CONSISTENCY_COLORS[data.postingConsistency || ""] ?? "#8E8E93";

  // Evolution
  const hasEvolution =
    data.strategyLabel || data.formatShift || data.viewsChangePct != null;

  const cadenceColor =
    (vs?.postingCadence ?? "") === "daily" ||
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

  return (
    <div className="space-y-4">
      {/* ─── Format Performance ─── */}
      {(rows.length > 0 || dna) && (
        <SectionCard title="Format Performance" tooltip={FP.section}>
          {rows.length > 0 ? (
            <>
              {/* Summary chips */}
              {dna && (
                <div className="flex flex-wrap gap-4 mb-4 pb-3 border-b border-white/[0.04]">
                  {dna.videosAnalyzed != null && (
                    <span className="text-[11px] text-white/35 inline-flex items-center gap-1">
                      {dna.videosAnalyzed} videos analyzed
                      <InfoTooltip text={FP.videosAnalyzed} />
                    </span>
                  )}
                  {dna.avgHookScore != null && (
                    <span className="text-[11px] text-white/35 inline-flex items-center gap-1">
                      Avg Hook{" "}
                      <span className="font-mono text-white/55">
                        {dna.avgHookScore.toFixed(1)}
                      </span>
                      <InfoTooltip text={FP.hookScore} />
                    </span>
                  )}
                  {dna.avgViralScore != null && (
                    <span className="text-[11px] text-white/35 inline-flex items-center gap-1">
                      Avg Viral{" "}
                      <span className="font-mono text-white/55">
                        {dna.avgViralScore.toFixed(1)}
                      </span>
                      <InfoTooltip text={FP.viralScore} />
                    </span>
                  )}
                  {dna.primaryGenre && (
                    <span className="text-[11px] text-white/35 inline-flex items-center gap-1">
                      Genre: {dna.primaryGenre}
                      <InfoTooltip text={FP.primaryGenre} />
                    </span>
                  )}
                  {dna.dominantMood && (
                    <span className="text-[11px] text-white/35 inline-flex items-center gap-1">
                      Mood: {dna.dominantMood}
                      <InfoTooltip text={FP.dominantMood} />
                    </span>
                  )}
                </div>
              )}

              {/* Format rows */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div
                  className={`hidden sm:grid ${showFormatDetails ? "grid-cols-[1fr_50px_1fr_60px_60px_65px_65px]" : "grid-cols-[1fr_50px_1fr_65px]"} gap-2 text-[9px] font-semibold text-white/25 uppercase tracking-wider flex-1`}
                >
                  <span>Format</span>
                  <span className="text-right inline-flex items-center justify-end gap-1">
                    Videos
                    <InfoTooltip text={FP.perFormatVideos} />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Avg Views
                    <InfoTooltip text={FP.perFormatAvgViews} />
                  </span>
                  {showFormatDetails && (
                    <>
                      <span className="text-right inline-flex items-center justify-end gap-1">
                        Hook
                        <InfoTooltip text={FP.perFormatHookScore} />
                      </span>
                      <span className="text-right inline-flex items-center justify-end gap-1">
                        Viral
                        <InfoTooltip text={FP.perFormatViralScore} />
                      </span>
                      <span className="text-right inline-flex items-center justify-end gap-1">
                        Engage
                        <InfoTooltip text={FP.perFormatEngagement} />
                      </span>
                    </>
                  )}
                  <span className="text-right inline-flex items-center justify-end gap-1">
                    vs Median
                    <InfoTooltip text={FP.vsMedian} />
                  </span>
                </div>
                <button
                  onClick={() => setShowFormatDetails(!showFormatDetails)}
                  className="text-[10px] font-medium text-white/30 hover:text-white/50 transition-colors ml-3 shrink-0"
                >
                  {showFormatDetails ? "Less" : "More"}
                </button>
              </div>

              <div className="space-y-0">
                {rows.map((r, i) => {
                  const barPct = Math.min(
                    100,
                    ((r.avgViews ?? 0) / barBaseline) * 100,
                  );
                  const vsMedian = r.performanceVsMedian;
                  const vsColor =
                    vsMedian != null
                      ? vsMedian >= 1.2
                        ? "#30D158"
                        : vsMedian <= 0.8
                          ? "#FF453A"
                          : "rgba(255,255,255,0.45)"
                      : undefined;
                  const formatVids = videos[r.contentFormat] ?? [];
                  const hasVids = formatVids.length > 0;
                  const isExpanded = expandedFormat === r.contentFormat;

                  return (
                    <div key={r.contentFormat}>
                      <div
                        className={`grid grid-cols-1 ${showFormatDetails ? "sm:grid-cols-[1fr_50px_1fr_60px_60px_65px_65px]" : "sm:grid-cols-[1fr_50px_1fr_65px]"} gap-2 items-center py-2 px-1 rounded-lg transition-colors ${hasVids ? "cursor-pointer hover:bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}
                        style={{
                          borderBottom:
                            !isExpanded && i < rows.length - 1
                              ? "1px solid rgba(255,255,255,0.03)"
                              : undefined,
                        }}
                        onClick={
                          hasVids
                            ? () =>
                                setExpandedFormat(
                                  isExpanded ? null : r.contentFormat,
                                )
                            : undefined
                        }
                      >
                        <span className="text-[13px] font-medium text-white/75 truncate flex items-center gap-1.5">
                          {hasVids && (
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
                        <span className="text-[12px] font-mono text-white/45 tabular-nums text-right">
                          {r.videoCount}
                        </span>
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
                        {showFormatDetails && (
                          <>
                            <span className="text-[12px] font-mono text-white/55 tabular-nums text-right">
                              {r.avgHookScore != null
                                ? r.avgHookScore.toFixed(1)
                                : "—"}
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
                        <span
                          className="text-[12px] font-mono font-semibold tabular-nums text-right"
                          style={{ color: vsColor }}
                        >
                          {vsMedian != null ? `${vsMedian.toFixed(2)}x` : "—"}
                        </span>
                      </div>

                      {isExpanded && formatVids.length > 0 && (
                        <div
                          className="ml-4 mr-1 mb-2 rounded-lg border border-white/[0.04] overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.015)" }}
                        >
                          {formatVids.map((v, vi) => {
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
                                    vi < formatVids.length - 1
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
                                    {v.isAd && (
                                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#FF9F0A] px-1 py-0.5 rounded bg-[rgba(255,159,10,0.1)]">
                                        Ad
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

              {dna?.signatureStyle && (
                <p className="text-[12px] text-white/40 mt-3 pt-3 border-t border-white/[0.04] inline-flex items-center gap-1.5 flex-wrap">
                  Signature: {dna.signatureStyle}
                  <InfoTooltip text={FP.signatureStyle} />
                </p>
              )}
            </>
          ) : dna ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatChip
                label="Best Format"
                value={dna.bestFormat || "—"}
                color="#30D158"
                tooltip={FP.bestFormat}
              />
              <StatChip
                label="Worst Format"
                value={dna.worstFormat || "—"}
                color="#FF453A"
                tooltip={FP.worstFormat}
              />
              <StatChip
                label="Genre"
                value={dna.primaryGenre || "—"}
                tooltip={FP.primaryGenre}
              />
              <StatChip
                label="Hook Score"
                value={
                  dna.avgHookScore != null
                    ? `${dna.avgHookScore.toFixed(1)}/10`
                    : "—"
                }
                tooltip={FP.hookScore}
              />
              <StatChip
                label="Viral Score"
                value={
                  dna.avgViralScore != null
                    ? `${dna.avgViralScore.toFixed(1)}/10`
                    : "—"
                }
                tooltip={FP.viralScore}
              />
              <StatChip
                label="Mood"
                value={dna.dominantMood || "—"}
                tooltip={FP.dominantMood}
              />
            </div>
          ) : null}
        </SectionCard>
      )}

      {/* ─── Content Activity + Evolution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Content Activity */}
        <SectionCard title="Content Activity" tooltip={CA.section}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <StatChip
              label="Cadence"
              value={vs?.postingCadence ?? data.postingConsistency ?? "—"}
              color={cadenceColor}
              tooltip={CA.cadence}
            />
            <StatChip
              label="Consistency"
              value={
                vs?.consistencyScore != null
                  ? `${Math.round(vs.consistencyScore)}%`
                  : "—"
              }
              color={cadenceColor}
              tooltip={CA.consistency}
            />
            <StatChip
              label="Engagement"
              value={
                vs?.avgEngagementRate != null
                  ? `${vs.avgEngagementRate.toFixed(2)}%`
                  : data.ttAvgEngagementRate != null
                    ? `${data.ttAvgEngagementRate.toFixed(2)}%`
                    : "—"
              }
              tooltip={CA.engagementRate}
            />
            <StatChip
              label="Performance"
              value={data.performanceTrend ?? "—"}
              color={trendColor2}
              tooltip={CA.performanceTrend}
            />
          </div>

          {/* Video counts */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-3 border-t border-white/[0.04] text-[11px] text-white/35">
            {vs?.totalVideos != null && (
              <span className="inline-flex items-center gap-1">
                {vs.totalVideos} total videos
                <InfoTooltip text={CA.totalVideos} />
              </span>
            )}
            {vs?.videos7d != null && (
              <span className="inline-flex items-center gap-1">
                {vs.videos7d} in 7d
                <InfoTooltip text={CA.videos7d} />
              </span>
            )}
            {vs?.videos30d != null && (
              <span className="inline-flex items-center gap-1">
                {vs.videos30d} in 30d
                <InfoTooltip text={CA.videos30d} />
              </span>
            )}
            {vs?.avgViralityRatio != null && (
              <span className="inline-flex items-center gap-1">
                Virality: {vs.avgViralityRatio.toFixed(2)}x
                <InfoTooltip text={CA.avgVirality} />
              </span>
            )}
            {vs?.playsTrendPct != null && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: trendColor(vs.playsTrendPct) }}
              >
                Plays: {pctStr(vs.playsTrendPct)}
                <InfoTooltip text={CA.playsTrend} />
              </span>
            )}
            {vs?.engagementTrendPct != null && (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: trendColor(vs.engagementTrendPct) }}
              >
                Engage: {pctStr(vs.engagementTrendPct)}
                <InfoTooltip text={CA.engagementTrend} />
              </span>
            )}
          </div>

          {/* Evolution */}
          {hasEvolution && (
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                EVOLUTION
                <InfoTooltip text={CA.strategy} />
              </div>
              {data.strategyLabel && (
                <div className="text-[13px] text-white/75 mb-1">
                  {data.strategyLabel}
                </div>
              )}
              {data.viewsChangePct != null && (
                <div className="text-[12px] text-white/45 inline-flex items-center gap-1 flex-wrap">
                  <span
                    style={{
                      color: data.viewsChangePct > 0 ? "#30D158" : "#FF453A",
                    }}
                  >
                    {data.viewsChangePct > 0 ? "+" : ""}
                    {data.viewsChangePct.toFixed(0)}% views
                  </span>
                  {data.priorAvgViews != null &&
                    data.recentAvgViews != null && (
                      <span className="ml-2">
                        {fmtNum(data.priorAvgViews)} →{" "}
                        {fmtNum(data.recentAvgViews)} avg
                      </span>
                    )}
                  <InfoTooltip text={CA.viewsChange} />
                </div>
              )}
              {(data.newFormats?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 items-center">
                  {data.newFormats!.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded text-[#30D158] border border-[#30D158]/20"
                    >
                      + {f}
                    </span>
                  ))}
                  {data.newFormats && data.newFormats.length > 0 && (
                    <InfoTooltip text={CA.newFormats} />
                  )}
                  {(data.droppedFormats ?? []).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded text-[#FF453A] border border-[#FF453A]/20"
                    >
                      – {f}
                    </span>
                  ))}
                  {data.droppedFormats && data.droppedFormats.length > 0 && (
                    <InfoTooltip text={CA.droppedFormats} />
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* TikTok Profile */}
        {(data.tiktokGrade != null || data.ttAvgPlays != null) && (
          <SectionCard title="TikTok Profile" tooltip={TT.section}>
            <div className="flex items-center gap-2.5 mb-5">
              {data.tiktokGrade && (
                <span
                  className="inline-flex items-center justify-center gap-1 w-8 h-8 rounded-lg text-[16px] font-bold font-mono"
                  style={{ background: grade.bg, color: grade.color }}
                >
                  {data.tiktokGrade}
                </span>
              )}
              {data.tiktokGrade && <InfoTooltip text={TT.grade} />}
              {data.postingConsistency && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    color: consistencyColor,
                    background: `${consistencyColor}18`,
                  }}
                >
                  {data.postingConsistency}
                  <InfoTooltip text={TT.consistency} />
                </span>
              )}
              {data.ttPlaysTrendPct != null && (
                <span
                  className="text-[12px] font-mono font-semibold tabular-nums ml-auto inline-flex items-center gap-1"
                  style={{ color: trendColor(data.ttPlaysTrendPct) }}
                >
                  {pctStr(data.ttPlaysTrendPct)} plays
                  <InfoTooltip text={TT.playsTrend} />
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <StatChip
                label="Avg Plays"
                value={fmtNum(data.ttAvgPlays)}
                tooltip={TT.avgPlays}
              />
              <StatChip
                label="Engagement"
                value={
                  data.ttAvgEngagementRate != null
                    ? `${data.ttAvgEngagementRate.toFixed(2)}%`
                    : "—"
                }
                tooltip={TT.engagementRate}
              />
              <StatChip
                label="Original Sound"
                value={
                  data.ttOriginalSoundPct != null
                    ? `${Math.round(data.ttOriginalSoundPct)}%`
                    : "—"
                }
                tooltip={TT.originalSound}
              />
              <StatChip
                label="Posts / Week"
                value={
                  data.ttAvgPostsPerWeek != null
                    ? data.ttAvgPostsPerWeek.toFixed(1)
                    : "—"
                }
                tooltip={TT.postsPerWeek}
              />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4 pt-3 border-t border-white/[0.04]">
              <StatChip
                label="Total Videos"
                value={fmtNum(data.ttTotalVideos)}
                tooltip={TT.totalVideos}
              />
              <StatChip
                label="Last 30d"
                value={fmtNum(data.ttVideos30d)}
                tooltip={TT.videos30d}
              />
              <StatChip
                label="Best Video"
                value={fmtNum(data.ttBestVideoPlays)}
                sub="plays"
                tooltip={TT.bestVideoPlays}
              />
              {data.ttDaysSinceLastPost != null && (
                <StatChip
                  label="Last Post"
                  value={`${data.ttDaysSinceLastPost}d ago`}
                  color={
                    data.ttDaysSinceLastPost > 14
                      ? "#FF453A"
                      : data.ttDaysSinceLastPost > 7
                        ? "#FF9F0A"
                        : undefined
                  }
                  tooltip={TT.daysSinceLastPost}
                />
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {/* ─── Fan Comment Pulse ─── */}
      {cp && cp.sentimentScore != null && (
        <SectionCard title="Fan Comment Pulse" tooltip={FC.section}>
          <div className="flex items-center gap-5 mb-4">
            <Gauge
              label="Sentiment"
              value={cp.sentimentScore}
              color={sentimentColor}
              tooltip={FC.sentimentScore}
            />
            {cp.fanEnergy != null && (
              <Gauge
                label="Energy"
                value={cp.fanEnergy}
                color={energyColor}
                tooltip={FC.energyScore}
              />
            )}
            <div className="flex flex-col items-end gap-1 ml-auto">
              {cp.audienceVibe && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    color:
                      VIBE_CONFIG[cp.audienceVibe]?.color ??
                      "rgba(255,255,255,0.4)",
                    background: `${VIBE_CONFIG[cp.audienceVibe]?.color ?? "#8E8E93"}18`,
                  }}
                >
                  {VIBE_CONFIG[cp.audienceVibe]?.label ?? cp.audienceVibe}
                  <InfoTooltip text={FC.audienceVibe} />
                </span>
              )}
              {cp.totalCommentsAnalyzed != null && (
                <span className="text-[10px] font-mono text-white/30 inline-flex items-center gap-1">
                  {cp.totalCommentsAnalyzed.toLocaleString()} comments
                  <InfoTooltip text={FC.commentsAnalyzed} />
                </span>
              )}
            </div>
          </div>

          {/* Intent breakdown */}
          {intents.length > 0 && (
            <div className="mb-3 pt-3 border-t border-white/[0.04]">
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                What Fans Are Saying
                <InfoTooltip text={FC.intentBreakdown} />
              </div>
              <div className="space-y-1.5">
                {intents.slice(0, 7).map(([key, val]) => {
                  const cfg = INTENT_LABELS[key] ?? {
                    label: key.replace(/_/g, " "),
                    color: "#8E8E93",
                  };
                  const pct = Math.round(
                    ((val as number) / totalIntents) * 100,
                  );
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

          {/* Top comments */}
          {topComments.length > 0 && (
            <div className="pt-3 border-t border-white/[0.04]">
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                Top Comments
                <InfoTooltip text={FC.topComments} />
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
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                Content Ideas from Fans
                <InfoTooltip text={FC.contentIdeas} />
              </div>
              <div className="space-y-1">
                {cp.aiContentIdeas.slice(0, 4).map((idea, i) => (
                  <div
                    key={i}
                    className="text-[12px] text-white/60 pl-3 relative"
                  >
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
              <div className="text-[10px] font-semibold text-[#FFD60A] uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                Fan Requests
                <InfoTooltip text={FC.fanRequests} />
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
      )}
    </div>
  );
}
