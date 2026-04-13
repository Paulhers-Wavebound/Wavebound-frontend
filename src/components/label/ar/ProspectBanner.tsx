/**
 * Prospect Banner — top section of the drill-down page.
 * Artist name, avatar, genre, origin, pipeline stage, Rise Probability hero number,
 * Ghost Curve comparison sparkline, social links, and viral discovery video.
 */
import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { ARProspect, EnrichedVideo } from "@/types/arTypes";
import {
  getRiseProbabilityColor,
  PIPELINE_STAGE_CONFIG,
} from "@/types/arTypes";

export interface PlatformRecord {
  platform: string;
  platform_id: string;
  platform_url: string | null;
}

export interface SourceStats {
  platform: string;
  handle: string;
  total_rag_videos: number;
  total_rag_plays: number;
  avg_viral_score: number;
}

function BannerAvatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (!url || failed) {
    return (
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/[0.06] text-white/50 font-semibold text-[20px] shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="w-16 h-16 rounded-full object-cover shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

function GhostCurveSparkline({ prospect }: { prospect: ARProspect }) {
  if (!prospect.ghost_curve_match) return null;
  const w = 180;
  const h = 48;
  const data = prospect.sparkline_data;
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 4 - ((v - min) / range) * (h - 8);
      return `${x},${y}`;
    })
    .join(" ");

  // Simulated ghost curve (offset slightly higher to show the comparison)
  const ghostPoints = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const adjusted =
        v * (1 + (100 - prospect.ghost_curve_match!.match_pct) / 200);
      const y = h - 4 - ((adjusted - min) / range) * (h - 8);
      return `${x},${Math.max(4, y)}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-end gap-1">
      <svg width={w} height={h}>
        {/* Ghost curve (reference artist) */}
        <polyline
          points={ghostPoints}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
          strokeDasharray="4,3"
          strokeLinecap="round"
        />
        {/* Prospect curve */}
        <polyline
          points={points}
          fill="none"
          stroke={getRiseProbabilityColor(prospect.rise_probability)}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-0.5 rounded"
            style={{
              background: getRiseProbabilityColor(prospect.rise_probability),
            }}
          />
          <span className="text-white/40">{prospect.artist_name}</span>
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />
          <span className="text-white/25">
            {prospect.ghost_curve_match.artist_name} wk{" "}
            {prospect.ghost_curve_match.week_offset}
          </span>
        </span>
      </div>
    </div>
  );
}

function formatPlayCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const LINK_CLS =
  "flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors hover:bg-white/[0.06]";

export default function ProspectBanner({
  prospect,
  platforms = [],
  recentVideos = [],
  source,
}: {
  prospect: ARProspect;
  platforms?: PlatformRecord[];
  recentVideos?: EnrichedVideo[];
  source?: SourceStats;
}) {
  const stage = PIPELINE_STAGE_CONFIG[prospect.pipeline_stage];
  const rpColor = getRiseProbabilityColor(prospect.rise_probability);

  // Build social links from handles (direct fields) + platforms array
  const tiktokHandle =
    prospect.tiktok_handle ||
    (prospect.source_platform === "tiktok" ? prospect.source_handle : null);
  const igHandle =
    prospect.instagram_handle ||
    (prospect.source_platform === "instagram" ? prospect.source_handle : null);

  const spotifyFromPlatforms = platforms.find(
    (p) => p.platform === "spotify" && p.platform_url,
  );
  const spotifyUrl = prospect.spotify_url || spotifyFromPlatforms?.platform_url;

  const soundcloudFromPlatforms = platforms.find(
    (p) => p.platform === "soundcloud" && p.platform_url,
  );

  // Discovery video — top viral video from recent_videos
  const discoveryVideo =
    recentVideos.length > 0
      ? recentVideos.reduce((best, v) =>
          v.play_count > best.play_count ? v : best,
        )
      : null;

  return (
    <div
      className="rounded-xl border border-white/[0.06] px-7 py-6"
      style={{ background: "#1C1C1E" }}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        {/* Left: artist info */}
        <div className="flex items-start gap-4">
          <BannerAvatar name={prospect.artist_name} url={prospect.avatar_url} />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1
                className="text-[24px] md:text-[28px] font-semibold"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {prospect.artist_name}
              </h1>
              <span
                className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
                style={{ color: stage.color, background: stage.bg }}
              >
                {stage.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-white/45">
              <span>{countryFlag(prospect.origin_country)}</span>
              <span>{prospect.genre}</span>
              {prospect.assigned_to && (
                <>
                  <span className="text-white/15">|</span>
                  <span>Assigned: {prospect.assigned_to}</span>
                </>
              )}
              {prospect.unreleased_test && (
                <>
                  <span className="text-white/15">|</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: "#30D158",
                      background: "rgba(48,209,88,0.12)",
                    }}
                  >
                    Unreleased Test {prospect.unreleased_test.label}
                  </span>
                </>
              )}
            </div>

            {/* Social links row */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {tiktokHandle && (
                <a
                  href={`https://www.tiktok.com/@${tiktokHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLS}
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="rgba(255,255,255,0.55)"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.2 8.2 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z" />
                  </svg>
                  <span className="text-[11px] text-white/50">
                    @{tiktokHandle}
                  </span>
                </a>
              )}
              {igHandle && (
                <a
                  href={`https://www.instagram.com/${igHandle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLS}
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <svg
                    width="13"
                    height="13"
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
                  <span className="text-[11px] text-white/50">@{igHandle}</span>
                </a>
              )}
              {spotifyUrl && (
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLS}
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="rgba(255,255,255,0.55)"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  <span className="text-[11px] text-white/50">Spotify</span>
                </a>
              )}
              {soundcloudFromPlatforms?.platform_url && (
                <a
                  href={soundcloudFromPlatforms.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLS}
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="rgba(255,255,255,0.55)"
                  >
                    <path d="M11.56 8.87V17h8.76c1.85 0 3.35-1.66 3.35-3.71 0-2.04-1.5-3.7-3.35-3.7-.37 0-.73.06-1.06.18C18.87 6.57 16.3 4 13.12 4c-.62 0-1.21.12-1.75.33v4.54zM10.13 9.43c-.08-.83-.73-1.48-1.53-1.48-.85 0-1.53.72-1.53 1.6v7.46h3.06V9.43zM5.64 11.07c-.08-.42-.4-.73-.78-.73-.43 0-.78.38-.78.86V17h1.56v-5.93zM2.65 12.18c-.08-.32-.33-.56-.64-.56-.36 0-.64.3-.64.68V17h1.28v-4.82zM0 13.3v3.03c0 .37.24.67.54.67.3 0 .54-.3.54-.67V13.3c0-.37-.24-.68-.54-.68-.3 0-.54.3-.54.68z" />
                  </svg>
                  <span className="text-[11px] text-white/50">SoundCloud</span>
                </a>
              )}
            </div>

            {/* RAG stats */}
            {source && source.total_rag_videos > 0 && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {source.total_rag_videos} videos in RAG
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {formatPlayCount(source.total_rag_plays)} total plays
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded tabular-nums"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(255,255,255,0.04)",
                    color:
                      source.avg_viral_score >= 70
                        ? "#30D158"
                        : source.avg_viral_score >= 40
                          ? "#FFD60A"
                          : "rgba(255,255,255,0.35)",
                  }}
                >
                  Avg viral {source.avg_viral_score.toFixed(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Rise Probability hero */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span
              className="text-[42px] font-bold tabular-nums leading-none"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: rpColor,
              }}
            >
              {prospect.rise_probability.toFixed(1)}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider block mt-1">
              Rise Probability
            </span>
          </div>
        </div>

        {/* Right: Ghost Curve sparkline */}
        <GhostCurveSparkline prospect={prospect} />
      </div>

      {/* Discovery video — top viral video with thumbnail */}
      {discoveryVideo?.web_url && (
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <a
            href={discoveryVideo.web_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-white/[0.03] group"
          >
            {/* Thumbnail */}
            <div className="w-[56px] h-[56px] rounded-md bg-white/[0.04] shrink-0 flex items-center justify-center overflow-hidden relative">
              {discoveryVideo.video_cover_url ? (
                <>
                  <img
                    src={discoveryVideo.video_cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={16} fill="white" className="text-white" />
                  </div>
                </>
              ) : (
                <Play size={18} className="text-white/25" />
              )}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "#e8430a" }}
                >
                  Discovery Video
                </span>
                <ExternalLink
                  size={10}
                  className="text-white/20 group-hover:text-white/40 transition-colors"
                />
              </div>
              <p className="text-[11px] text-white/45 truncate mt-0.5">
                {discoveryVideo.caption || "Viral video"}
              </p>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30">
                <span
                  className="font-medium tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPlayCount(discoveryVideo.play_count)} plays
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPlayCount(discoveryVideo.like_count)} likes
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {formatPlayCount(discoveryVideo.share_count)} shares
                </span>
              </div>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
