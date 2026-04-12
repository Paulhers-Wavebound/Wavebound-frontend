/**
 * Sounds Tab — "Which music is hot and where?"
 *
 * Renders: Sound Performance on TikTok, Catalog Velocity,
 * Streaming Pulse, Playlist Intelligence
 */
import type { ContentIntelData } from "@/hooks/useContentIntelligence";
import { fmtNum, pctStr, trendColor, StatChip, SectionCard, EmptyState } from "./shared";

/* ─── Velocity Config ─────────────────────────────────────── */

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

const reachTierColor: Record<string, string> = {
  massive: "#FF453A",
  high: "#FF9F0A",
  medium: "#0A84FF",
  low: "#8E8E93",
};

/* ─── Main Component ──────────────────────────────────────── */

interface SoundsTabProps {
  data: ContentIntelData;
}

export default function SoundsTab({ data }: SoundsTabProps) {
  const sp = data.streamingPulse;
  const pl = data.playlistIntel;

  return (
    <div className="space-y-4">
      {/* ─── Sound Performance on TikTok ─── */}
      {data.topSongs.length > 0 && (
        <SectionCard title="Sound Performance on TikTok">
          <div className="space-y-0">
            {data.topSongs.map((s, i) => {
              const statusCfg = STATUS_COLORS[s.status || ""] ?? STATUS_COLORS.established;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 px-1"
                  style={{ borderBottom: i < data.topSongs.length - 1 ? "1px solid rgba(255,255,255,0.03)" : undefined }}
                >
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
                      style={{ color: statusCfg.color, background: statusCfg.bg }}
                    >
                      {s.status}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-white/45 tabular-nums w-[56px] text-right shrink-0">
                    {fmtNum(s.totalPlays)}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ─── Catalog Velocity ─── */}
      {data.songVelocity.length > 0 && (
        <SectionCard title="Catalog Velocity">
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_60px_80px] gap-2 text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-1 px-1">
            <span>Song</span>
            <span className="text-right">Daily</span>
            <span className="text-right">Total</span>
            <span className="text-right">7d</span>
            <span className="text-right">Velocity</span>
          </div>

          <div className="space-y-0">
            {data.songVelocity.map((s, i) => {
              const velCfg = VELOCITY_COLORS[s.velocityClass] ?? VELOCITY_COLORS.steady;
              const nearPeak = s.peakRatio != null && s.peakRatio >= 0.85;
              return (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_60px_80px] gap-2 items-center py-2 px-1"
                  style={{ borderBottom: i < data.songVelocity.length - 1 ? "1px solid rgba(255,255,255,0.03)" : undefined }}
                >
                  <span className="text-[13px] font-medium text-white/75 truncate flex items-center gap-1.5">
                    {s.songName}
                    {nearPeak && (
                      <span className="text-[9px] font-mono text-[#FFD60A] shrink-0">near peak</span>
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
                      color: s.pctChange7d != null
                        ? s.pctChange7d > 0 ? "#30D158" : s.pctChange7d < -5 ? "#FF453A" : "rgba(255,255,255,0.35)"
                        : undefined,
                    }}
                  >
                    {s.pctChange7d != null ? `${s.pctChange7d > 0 ? "+" : ""}${s.pctChange7d.toFixed(0)}%` : "—"}
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
        </SectionCard>
      )}

      {/* ─── Streaming Pulse ─── */}
      {(sp != null && (sp.spotifyMonthlyListeners != null || sp.spotifyDailyStreams != null)) ||
       (data.catalogDailyStreams != null && data.catalogDailyStreams > 0) ? (
        <SectionCard title="Streaming Pulse">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[520px]">
            {sp?.spotifyMonthlyListeners != null && (
              <StatChip label="Monthly Listeners" value={fmtNum(sp.spotifyMonthlyListeners)}
                sub={sp.spotifyMlPct7d != null ? `${sp.spotifyMlPct7d > 0 ? "+" : ""}${sp.spotifyMlPct7d.toFixed(1)}% 7d` : undefined}
                color={sp.spotifyMlPct7d != null && sp.spotifyMlPct7d > 0 ? "#30D158" : sp.spotifyMlPct7d != null && sp.spotifyMlPct7d < -5 ? "#FF453A" : undefined} />
            )}
            {sp?.spotifyDailyStreams != null && (
              <StatChip label="Daily Streams" value={fmtNum(sp.spotifyDailyStreams)}
                sub={sp.spotifyDsPct7d != null ? `${sp.spotifyDsPct7d > 0 ? "+" : ""}${sp.spotifyDsPct7d.toFixed(1)}% 7d` : undefined}
                color={sp.spotifyDsPct7d != null && sp.spotifyDsPct7d > 0 ? "#30D158" : sp.spotifyDsPct7d != null && sp.spotifyDsPct7d < -5 ? "#FF453A" : undefined} />
            )}
            {data.catalogDailyStreams != null && (
              <StatChip label="Catalog Streams" value={fmtNum(data.catalogDailyStreams)}
                sub={data.catalogPctChange7d != null ? `${data.catalogPctChange7d > 0 ? "+" : ""}${data.catalogPctChange7d.toFixed(1)}% 7d` : undefined}
                color={data.catalogPctChange7d != null && data.catalogPctChange7d > 0 ? "#30D158" : data.catalogPctChange7d != null && data.catalogPctChange7d < -5 ? "#FF453A" : undefined} />
            )}
            {sp?.spotifyFollowers != null && (
              <StatChip label="Spotify Followers" value={fmtNum(sp.spotifyFollowers)}
                sub={sp.spotifyFollowersDelta7d != null ? `${sp.spotifyFollowersDelta7d > 0 ? "+" : ""}${fmtNum(sp.spotifyFollowersDelta7d)} 7d` : undefined} />
            )}
          </div>

          {(sp?.spotifyPeakRatio != null || sp?.kworbGlobalRank != null) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-white/[0.04]">
              {sp?.spotifyPeakRatio != null && (
                <span className="text-[11px] text-white/40">
                  {sp.spotifyPeakRatio >= 0.9 ? "Near peak" : `${Math.round(sp.spotifyPeakRatio * 100)}% of peak ML`}
                </span>
              )}
              {sp?.kworbGlobalRank != null && (
                <span className="text-[11px] text-white/40">
                  Kworb #{sp.kworbGlobalRank.toLocaleString()}
                  {sp.kworbRankDelta7d != null && (
                    <span className="ml-1 font-mono" style={{ color: sp.kworbRankDelta7d < 0 ? "#30D158" : sp.kworbRankDelta7d > 0 ? "#FF453A" : undefined }}>
                      ({sp.kworbRankDelta7d > 0 ? "+" : ""}{sp.kworbRankDelta7d})
                    </span>
                  )}
                </span>
              )}
              {sp?.deezerFans != null && (
                <span className="text-[11px] text-white/40">Deezer: {fmtNum(sp.deezerFans)} fans</span>
              )}
            </div>
          )}

          {(data.viralSongs != null || data.songsAccelerating != null) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.04]">
              {data.viralSongs != null && data.viralSongs > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#FF453A] bg-[rgba(255,69,58,0.12)]">{data.viralSongs} viral</span>
              )}
              {data.songsAccelerating != null && data.songsAccelerating > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#30D158] bg-[rgba(48,209,88,0.12)]">{data.songsAccelerating} accelerating</span>
              )}
              {data.soundSparkScore != null && (
                <span className="text-[10px] font-mono text-white/35 px-2 py-0.5 rounded-full border border-white/[0.06]">Sound Spark: {data.soundSparkScore.toFixed(0)}</span>
              )}
            </div>
          )}
        </SectionCard>
      ) : null}

      {/* ─── Playlist Intelligence ─── */}
      {pl && pl.songsInPlaylists > 0 && (
        <SectionCard title="Playlist Intelligence">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1">Songs Listed</div>
              <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">{pl.songsInPlaylists}</div>
            </div>
            <div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1">Placements</div>
              <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">{pl.totalPlaylistPlacements}</div>
            </div>
            <div>
              <div className="text-[11px] text-white/35 uppercase tracking-wider mb-1">Total Reach</div>
              <div className="text-[22px] font-bold text-white/87 font-mono tabular-nums leading-none">{fmtNum(pl.totalPlaylistReach)}</div>
            </div>
          </div>

          {pl.bestSong && pl.bestPlaylistName && (
            <div className="py-3 border-t border-white/[0.04]">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Best Placement</div>
              <div className="text-[13px] text-white/70">
                <span className="font-medium text-white/87">{pl.bestSong}</span>
                <span className="text-white/30"> in </span>
                <span className="text-[#0A84FF]">{pl.bestPlaylistName}</span>
                {pl.bestPlaylistReach != null && (
                  <span className="text-[11px] text-white/35 ml-1 font-mono">({fmtNum(pl.bestPlaylistReach)} reach)</span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-3 border-t border-white/[0.04]">
            {pl.bestPositionOverall != null && <StatChip label="Best Position" value={`#${pl.bestPositionOverall}`} />}
            {pl.avgPlaylistPosition != null && <StatChip label="Avg Position" value={`#${Math.round(pl.avgPlaylistPosition)}`} />}
            {pl.highReachPlacements > 0 && <StatChip label="High Reach" value={String(pl.highReachPlacements)} />}
            {pl.overallReachTier && (
              <span className="self-end text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ color: reachTierColor[pl.overallReachTier] ?? "rgba(255,255,255,0.4)", background: `${reachTierColor[pl.overallReachTier] ?? "#8E8E93"}18` }}>
                {pl.overallReachTier} reach
              </span>
            )}
          </div>

          {Array.isArray(pl.topPlaylistSongs) && pl.topPlaylistSongs.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/[0.04]">
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Top Songs in Playlists</div>
              <div className="space-y-1.5">
                {pl.topPlaylistSongs.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-white/60 truncate">{s.song_name ?? `Song ${i + 1}`}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      {s.playlist_count != null && <span className="font-mono text-white/35 tabular-nums">{s.playlist_count} playlists</span>}
                      {s.total_reach != null && <span className="font-mono text-white/45 tabular-nums">{fmtNum(s.total_reach)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Empty state */}
      {data.topSongs.length === 0 && data.songVelocity.length === 0 && !sp && (
        <div className="rounded-xl border border-white/[0.06] p-8 text-center" style={{ background: "#1C1C1E" }}>
          <p className="text-[14px] text-white/30">Sound and streaming data not yet available for this artist</p>
        </div>
      )}
    </div>
  );
}
