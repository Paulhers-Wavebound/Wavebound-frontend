import type {
  ArtistCard,
  CatalogTikTokEntry,
} from "@/types/artistIntelligence";
import { CATALOG_STATUS_CONFIG } from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";
import { formatNumber } from "@/utils/soundIntelligenceApi";
import { STAT_TOOLTIPS } from "@/lib/statTooltips";

const VELOCITY_COLORS: Record<string, string> = {
  accelerating: "#30D158",
  stable: "#8E8E93",
  decelerating: "#FF9F0A",
  declining: "#FF453A",
};

const GAP_CONFIG: Record<string, { label: string; color: string }> = {
  tiktok_hot_spotify_cold: {
    label: "TikTok hot, Spotify cold",
    color: "#FF9F0A",
  },
  spotify_hot_tiktok_cold: {
    label: "Spotify hot, TikTok cold",
    color: "#0A84FF",
  },
  both_hot: { label: "Both hot", color: "#30D158" },
  normal: { label: "Normal", color: "var(--ink-tertiary)" },
};

const TIKTOK_STATUS_COLORS: Record<string, string> = {
  viral: "#FF453A",
  trending: "#FF9F0A",
  active: "#30D158",
  established: "#0A84FF",
  emerging: "#BF5AF2",
};

export default function CatalogIntelligence({
  card,
  catalogTikTok,
}: {
  card: ArtistCard;
  catalogTikTok: CatalogTikTokEntry[];
}) {
  const catalog = card.catalog;

  if (!catalog) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-sm)",
          padding: "40px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
          }}
        >
          No catalog data available yet
        </div>
      </div>
    );
  }

  const status =
    CATALOG_STATUS_CONFIG[catalog.status] ?? CATALOG_STATUS_CONFIG.stable;
  // Highlight conversion opportunities
  const opportunities = catalogTikTok.filter(
    (s) => s.cross_platform_gap === "tiktok_hot_spotify_cold",
  );

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Catalog Intelligence{" "}
          <InfoTooltip text={STAT_TOOLTIPS.intel.catalogStatus} />
        </h3>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 12px",
            borderRadius: 20,
            background: status.bg,
            color: status.color,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {status.label}
        </span>
      </div>

      {/* Key stats row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--ink-faint)",
              marginBottom: 4,
            }}
          >
            Daily Streams
            <InfoTooltip text={STAT_TOOLTIPS.intel.catalogDailyStreams} />
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 20,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {formatNumber(catalog.daily_streams)}
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: catalog.growth_7d >= 0 ? "#30D158" : "#FF453A",
              marginTop: 2,
            }}
          >
            {catalog.growth_7d >= 0 ? "+" : ""}
            {catalog.growth_7d.toFixed(1)}% 7d
          </div>
        </div>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--ink-faint)",
              marginBottom: 4,
            }}
          >
            Songs
            <InfoTooltip text={STAT_TOOLTIPS.intel.catalogTotalSongs} />
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 20,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {catalog.total_songs}
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "var(--ink-tertiary)",
              marginTop: 2,
            }}
          >
            depth {catalog.depth_score}
          </div>
        </div>
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "var(--ink-faint)",
              marginBottom: 4,
            }}
          >
            Viral / Accel
            <InfoTooltip text={STAT_TOOLTIPS.intel.catalogViralAccel} />
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 20,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {catalog.viral_songs} / {catalog.accelerating_songs}
          </div>
        </div>
        {catalog.songs_in_playlists > 0 && (
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--ink-faint)",
                marginBottom: 4,
              }}
            >
              Playlists
              <InfoTooltip text={STAT_TOOLTIPS.intel.catalogPlaylists} />
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {catalog.songs_in_playlists}
            </div>
            {catalog.best_playlist && (
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                  marginTop: 2,
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {catalog.best_playlist}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top songs */}
      {(catalog.top_song || catalog.fastest_song) && (
        <div
          style={{
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {catalog.top_song && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {catalog.top_song}
                </span>
                {catalog.top_song_velocity && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background:
                        VELOCITY_COLORS[catalog.top_song_velocity] ??
                        "var(--ink-tertiary)",
                      color: "#fff",
                      opacity: 0.9,
                    }}
                  >
                    {catalog.top_song_velocity}
                  </span>
                )}
              </div>
              {catalog.top_song_streams != null && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color: "var(--ink-secondary)",
                  }}
                >
                  {formatNumber(catalog.top_song_streams)}/day
                </span>
              )}
            </div>
          )}
          {catalog.fastest_song &&
            catalog.fastest_song !== catalog.top_song && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink-secondary)",
                  }}
                >
                  {catalog.fastest_song}
                </span>
                {catalog.fastest_pct != null && (
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      color: "#30D158",
                    }}
                  >
                    +{catalog.fastest_pct.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
        </div>
      )}

      {/* Cross-platform conversion opportunities */}
      {opportunities.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "#FF9F0A",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Conversion Opportunities
            <InfoTooltip
              text={STAT_TOOLTIPS.intel.catalogConversionOpportunities}
            />
          </div>
          {opportunities.slice(0, 3).map((song) => (
            <div
              key={song.song_name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  {song.song_name}
                </span>
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 8,
                    background:
                      TIKTOK_STATUS_COLORS[song.tiktok_status] ?? "#8E8E93",
                    color: "#fff",
                    opacity: 0.85,
                  }}
                >
                  {song.tiktok_status}
                </span>
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                  textAlign: "right",
                }}
              >
                <div>{formatNumber(song.total_tiktok_plays)} TT plays</div>
                <div>
                  {formatNumber(song.spotify_daily_streams)}/day Spotify
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TikTok catalog songs (top 5, if no conversion section shown) */}
      {opportunities.length === 0 && catalogTikTok.length > 0 && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-secondary)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            TikTok Performance
          </div>
          {catalogTikTok.slice(0, 5).map((song) => {
            const gap =
              GAP_CONFIG[song.cross_platform_gap] ?? GAP_CONFIG.normal;
            return (
              <div
                key={song.song_name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.song_name}
                  </span>
                  {song.cross_platform_gap !== "normal" && (
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9,
                        padding: "2px 6px",
                        borderRadius: 8,
                        background: gap.color,
                        color: "#fff",
                        opacity: 0.85,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {gap.label}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-tertiary)",
                    flexShrink: 0,
                  }}
                >
                  {song.unique_creators} creators
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
