/**
 * Growth Tab — "Where is this artist expanding?"
 *
 * Renders: Audience Footprint, Market Expansion, Touring Signal, Roster Rank
 */
import { useMemo } from "react";
import type { ContentIntelData } from "@/hooks/useContentIntelligence";
import type { RosterScoreEntry } from "@/utils/artistBriefingApi";
import {
  fmtNum,
  StatChip,
  SectionCard,
  countryName,
  countryFlag,
} from "./shared";
import InfoTooltip from "@/components/label/intelligence/InfoTooltip";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const GA = STAT_TOOLTIPS.growth.audience;
const GT = STAT_TOOLTIPS.growth.touring;
const GR = STAT_TOOLTIPS.growth.rosterRank;
const GM = STAT_TOOLTIPS.growth.markets;

/* ─── Urgency Config ──────────────────────────────────────── */

const URGENCY_COLORS: Record<string, { color: string; bg: string }> = {
  act_now: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  plan: { color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  monitor: { color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
};

const TOURING_STATUS: Record<string, { color: string; bg: string }> = {
  heavy_touring: { color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  active_touring: { color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  selective_dates: { color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  minimal_live: { color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  no_live_activity: { color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
};

/* ─── Main Component ──────────────────────────────────────── */

interface GrowthTabProps {
  data: ContentIntelData;
  rosterScores: RosterScoreEntry[];
  artistName: string;
  artistScore: number | null;
  entityId: string | null;
}

export default function GrowthTab({
  data,
  rosterScores,
  artistName,
  artistScore,
  entityId,
}: GrowthTabProps) {
  const ts = data.touringSignal;

  // Audience footprint
  const platforms = [
    {
      name: "TikTok",
      followers: data.tiktokFollowers,
      growth: data.tiktokGrowth7d,
      color: "#FF004F",
    },
    {
      name: "Instagram",
      followers: data.instagramFollowers,
      growth: data.instagramGrowth7d,
      color: "#E1306C",
    },
    {
      name: "YouTube",
      followers: data.youtubeSubscribers,
      growth: data.youtubeGrowth7d,
      color: "#FF0000",
    },
    {
      name: "Spotify",
      followers: data.spotifyFollowers,
      growth: null,
      color: "#1DB954",
    },
  ].filter((p) => p.followers != null && p.followers > 0);

  const maxFollowers = Math.max(...platforms.map((p) => p.followers || 0), 1);

  // Market expansion groups
  const markets = data.marketExpansion ?? [];
  const urgencyGroups = useMemo(() => {
    const groups: Record<string, typeof markets> = {
      act_now: [],
      plan: [],
      monitor: [],
    };
    for (const m of markets) {
      const key = m.urgency || "monitor";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    }
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [markets]);

  // Roster rank
  const sorted = useMemo(
    () => [...rosterScores].sort((a, b) => b.artist_score - a.artist_score),
    [rosterScores],
  );
  const currentRank = useMemo(
    () =>
      sorted.findIndex(
        (e) =>
          e.canonical_name.toLowerCase() === artistName.toLowerCase() ||
          e.entity_id === entityId,
      ) + 1,
    [sorted, artistName, entityId],
  );

  return (
    <div className="space-y-4">
      {/* ─── Audience Footprint ─── */}
      {platforms.length > 0 && (
        <SectionCard title="Audience Footprint" tooltip={GA.section}>
          {data.totalSocialReach != null && (
            <div className="mb-5 inline-flex items-center gap-1 flex-wrap">
              <span className="text-[26px] font-bold text-white/87 font-mono tabular-nums">
                {fmtNum(data.totalSocialReach)}
              </span>
              <span className="text-[11px] text-white/35 ml-2 uppercase tracking-wider inline-flex items-center gap-1">
                Total Reach
                <InfoTooltip text={GA.totalReach} />
              </span>
            </div>
          )}

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

          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/[0.04]">
            {data.dominantPlatform && (
              <span className="text-[10px] font-medium text-white/40 px-2 py-0.5 rounded-full border border-white/[0.06] inline-flex items-center gap-1">
                Dominant: {data.dominantPlatform}
                <InfoTooltip text={GA.dominantPlatform} />
              </span>
            )}
            {data.fastestGrowingPlatform && (
              <span className="text-[10px] font-medium text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/20 inline-flex items-center gap-1">
                Fastest: {data.fastestGrowingPlatform}
                <InfoTooltip text={GA.fastestGrowingPlatform} />
              </span>
            )}
            {data.spotifyLoyaltyRatio != null && (
              <span className="text-[10px] font-mono text-white/35 px-2 py-0.5 rounded-full border border-white/[0.06] inline-flex items-center gap-1">
                Spotify Loyalty: {(data.spotifyLoyaltyRatio * 100).toFixed(0)}%
                <InfoTooltip text={GA.loyaltyRatio} />
              </span>
            )}
          </div>
        </SectionCard>
      )}

      {/* ─── Two-column: Touring + Roster ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Touring Signal */}
        {ts && (
          <SectionCard title="Touring Signal" tooltip={GT.section}>
            <div className="flex items-center gap-3 mb-4">
              {ts.touringStatus && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                  style={{
                    color: TOURING_STATUS[ts.touringStatus]?.color ?? "#8E8E93",
                    background:
                      TOURING_STATUS[ts.touringStatus]?.bg ??
                      "rgba(142,142,147,0.12)",
                  }}
                >
                  {ts.touringStatus.replace(/_/g, " ")}
                  <InfoTooltip text={GT.status} />
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-white/87 font-mono tabular-nums leading-none">
                  {ts.totalUpcomingEvents}
                </span>
                <span className="text-[11px] text-white/35 uppercase tracking-wider inline-flex items-center gap-1">
                  Upcoming Events
                  <InfoTooltip text={GT.upcomingEvents} />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatChip
                label="Ticketmaster"
                value={String(ts.ticketmasterUpcoming)}
                tooltip={GT.ticketmasterEvents}
              />
              <StatChip
                label="New This Week"
                value={String(ts.newEventsAnnounced7d)}
                color={ts.newEventsAnnounced7d > 0 ? "#30D158" : undefined}
                tooltip={GT.newThisWeek}
              />
            </div>
          </SectionCard>
        )}

        {/* Roster Rank */}
        {rosterScores.length >= 2 && currentRank > 0 && (
          <SectionCard title="Roster Rank" tooltip={GR.section}>
            <div className="flex items-baseline gap-3 mb-3">
              <span
                className="text-[28px] font-bold font-mono tabular-nums leading-none inline-flex items-center gap-1"
                style={{
                  color:
                    currentRank <= 3
                      ? "var(--accent)"
                      : "rgba(255,255,255,0.87)",
                }}
              >
                #{currentRank}
                <InfoTooltip text={GR.rank} />
              </span>
              <span className="text-[12px] text-white/35 font-mono inline-flex items-center gap-1">
                of {sorted.length}
                <InfoTooltip text={GR.totalRoster} />
              </span>
              <span className="text-[11px] text-white/25 ml-auto inline-flex items-center gap-1">
                Top {Math.round((currentRank / sorted.length) * 100)}%
                <InfoTooltip text={GR.percentile} />
              </span>
            </div>

            {/* Mini histogram */}
            {sorted.length >= 5 &&
              (() => {
                const buckets = Array.from({ length: 10 }, () => 0);
                for (const s of sorted) {
                  buckets[Math.min(Math.floor(s.artist_score / 10), 9)]++;
                }
                const maxB = Math.max(...buckets, 1);
                const curB =
                  artistScore != null
                    ? Math.min(Math.floor(artistScore / 10), 9)
                    : -1;
                return (
                  <div className="flex items-end gap-1 h-[24px] mb-2">
                    {buckets.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: Math.max((c / maxB) * 20, 2),
                          borderRadius: "2px 2px 0 0",
                          background:
                            i === curB
                              ? "var(--accent)"
                              : "rgba(255,255,255,0.06)",
                        }}
                      />
                    ))}
                  </div>
                );
              })()}

            {artistScore != null &&
              (() => {
                const avgScore = Math.round(
                  sorted.reduce((s, e) => s + e.artist_score, 0) /
                    sorted.length,
                );
                const diff = artistScore - avgScore;
                return (
                  <div className="text-[12px] text-white/45 inline-flex items-center gap-1">
                    {diff > 0 ? `+${diff}` : diff} vs roster avg ({avgScore})
                    <InfoTooltip text={GR.vsRosterAvg} />
                  </div>
                );
              })()}
          </SectionCard>
        )}
      </div>

      {/* ─── Market Expansion ─── */}
      {markets.length > 0 && (
        <SectionCard
          title="Where Next? — Market Expansion"
          tooltip={GM.section}
        >
          {urgencyGroups.map(([urgency, items]) => {
            const cfg = URGENCY_COLORS[urgency] ?? URGENCY_COLORS.monitor;
            return (
              <div key={urgency} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    {urgency.replace(/_/g, " ")}
                    <InfoTooltip text={GM.urgency} />
                  </span>
                  <span className="text-[10px] text-white/25">
                    ({items.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {items.map((m) => (
                    <div
                      key={m.countryCode}
                      className="rounded-lg border border-white/[0.06] p-3"
                      style={{ background: "#2C2C2E" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {countryFlag(m.countryCode)}
                          </span>
                          <span className="text-[13px] font-medium text-white/87">
                            {countryName(m.countryCode)}
                          </span>
                          <span className="text-[10px] text-white/25 font-mono">
                            {m.countryCode}
                          </span>
                        </div>
                        <span className="text-[14px] font-bold text-white/75 font-mono tabular-nums inline-flex items-center gap-1">
                          {m.opportunityScore}
                          <InfoTooltip text={GM.opportunityScore} />
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {m.recommendedAction}
                          <InfoTooltip text={GM.recommendedAction} />
                        </span>
                        {m.windowConfidence && (
                          <span className="text-[9px] text-white/30 px-1.5 py-0.5 rounded bg-white/[0.03] inline-flex items-center gap-1">
                            {m.windowConfidence} confidence
                            <InfoTooltip text={GM.windowConfidence} />
                          </span>
                        )}
                      </div>
                      {m.entrySongName && (
                        <div className="text-[11px] text-white/40 mt-1.5 inline-flex items-center gap-1 flex-wrap">
                          Entry:{" "}
                          <span className="text-white/55">
                            "{m.entrySongName}"
                          </span>
                          <InfoTooltip text={GM.entrySong} />
                        </div>
                      )}
                      {m.estimatedRevenue != null && (
                        <div className="text-[11px] font-mono text-white/35 mt-1 inline-flex items-center gap-1">
                          Est. ${fmtNum(m.estimatedRevenue)}/mo
                          <InfoTooltip text={GM.monthlyRevenue} />
                        </div>
                      )}
                      {m.platformToActivateFirst && (
                        <div className="text-[11px] text-white/30 mt-0.5 inline-flex items-center gap-1 flex-wrap">
                          Activate on:{" "}
                          <span className="font-medium text-white/50">
                            {m.platformToActivateFirst}
                          </span>
                          <InfoTooltip text={GM.platformToActivate} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </SectionCard>
      )}

      {/* Empty state */}
      {platforms.length === 0 && markets.length === 0 && !ts && (
        <div
          className="rounded-xl border border-white/[0.06] p-8 text-center"
          style={{ background: "#1C1C1E" }}
        >
          <p className="text-[14px] text-white/30">
            Growth data not yet available for this artist
          </p>
        </div>
      )}
    </div>
  );
}
