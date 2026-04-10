import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { countryFlag, platformColor } from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface EntrySongsProps {
  entrySongs: ExpansionRadarResponse["entry_songs"];
  artistName: string;
}

function VelocityBadge({ velocity }: { velocity: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    viral: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    accelerating: { color: "#e8430a", bg: "rgba(232,67,10,0.12)" },
    growing: { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
    steady: { color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
  };
  const c = config[velocity] ?? config.steady;
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color: c.color,
        background: c.bg,
        padding: "2px 6px",
        borderRadius: 3,
        textTransform: "uppercase",
      }}
    >
      {velocity}
    </span>
  );
}

function ReachBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    massive: "#FFD60A",
    high: "#34d399",
    medium: "#0A84FF",
    low: "var(--ink-tertiary)",
  };
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 9,
        fontWeight: 500,
        color: colors[tier] ?? "var(--ink-tertiary)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {tier} reach
    </span>
  );
}

export default function EntrySongs({
  entrySongs,
  artistName,
}: EntrySongsProps) {
  if (entrySongs.length === 0) return null;

  // Group by country, take rank 1 per market
  const byCountry = new Map<string, typeof entrySongs>();
  for (const song of entrySongs) {
    const existing = byCountry.get(song.country_code);
    if (!existing) {
      byCountry.set(song.country_code, [song]);
    } else {
      existing.push(song);
    }
  }

  // Sort markets by best entry score of their #1 song
  const markets = [...byCountry.entries()]
    .map(([code, songs]) => ({
      code,
      name: songs[0].country_name,
      topSong: songs.sort((a, b) => a.rank_for_market - b.rank_for_market)[0],
      alternates: songs.slice(1, 3),
    }))
    .sort((a, b) => b.topSong.entry_score - a.topSong.entry_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            borderRadius: 1,
            background:
              "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
          }}
        />
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.10em",
          }}
        >
          Entry Songs
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
            marginLeft: "auto",
          }}
        >
          What to push where
        </span>
      </div>
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "var(--ink-tertiary)",
          margin: 0,
          marginBottom: 16,
          marginTop: -8,
          paddingLeft: 13,
          lineHeight: 1.5,
        }}
      >
        The best-performing song to activate each expansion market, based on
        adjacent market momentum and playlist reach.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {markets.slice(0, 12).map((market, i) => {
          const song = market.topSong;
          return (
            <motion.div
              key={market.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 16,
              }}
            >
              {/* Market header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 16 }}>{countryFlag(market.code)}</span>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink)",
                    flex: 1,
                  }}
                >
                  {market.name}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--accent)",
                  }}
                >
                  {song.entry_score}
                </span>
              </div>

              {/* Song recommendation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--bg)",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "rgba(232,67,10,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Music size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      marginBottom: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.song_name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <VelocityBadge velocity={song.velocity_class} />
                    <ReachBadge tier={song.reach_tier} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10,
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      {song.adjacent_market_count} adjacent market
                      {song.adjacent_market_count !== 1 ? "s" : ""}
                    </span>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10,
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      {song.platforms_charting} platform
                      {song.platforms_charting !== 1 ? "s" : ""}
                    </span>
                    {song.best_position > 0 && (
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: "var(--accent)",
                        }}
                      >
                        #{song.best_position}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alternate songs if available */}
              {market.alternates.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      color: "var(--ink-tertiary)",
                      letterSpacing: "0.04em",
                      marginBottom: 4,
                    }}
                  >
                    ALTERNATIVES
                  </div>
                  {market.alternates.map((alt) => (
                    <div
                      key={alt.song_entity_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "3px 0",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 11,
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {alt.song_name}
                      </span>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: "var(--ink-tertiary)",
                        }}
                      >
                        {alt.entry_score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
