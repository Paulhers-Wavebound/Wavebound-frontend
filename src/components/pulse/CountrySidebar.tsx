import { useEffect } from "react";
import { X } from "lucide-react";
import type { CountryDetailSong, CountryArbitrage } from "@/types/pulse";
import { VELOCITY_COLORS, genreColor } from "./pulseConstants";
import { usePulseCountryDetail } from "@/hooks/use-pulse-data";
import ArbitrageCard from "./ArbitrageCard";

interface CountrySidebarProps {
  countryCode: string | null;
  onClose: () => void;
  arbitrage?: CountryArbitrage | null;
}

export default function CountrySidebar({
  countryCode,
  onClose,
  arbitrage,
}: CountrySidebarProps) {
  const { data, isLoading } = usePulseCountryDetail(countryCode);

  const isOpen = !!countryCode;

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 30,
            transition: "opacity 300ms",
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        role="dialog"
        aria-label={data ? `${data.country_name} detail` : "Country detail"}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          maxWidth: "90vw",
          background: "rgba(10, 10, 15, 0.95)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          zIndex: 40,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {isLoading && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
            }}
          >
            Loading...
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* Header */}
            <div
              style={{
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#e2e8f0",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {data.country_name}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.45)",
                    margin: "4px 0 0",
                  }}
                >
                  {data.song_count.toLocaleString()} songs &middot;{" "}
                  {data.platform_count} platforms
                  {data.trending_up > 0 && (
                    <span style={{ color: "#22C55E", marginLeft: 8 }}>
                      {data.trending_up} trending up
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close country detail"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.55)",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              className="pulse-sidebar-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 20px 80px",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.12) transparent",
              }}
            >
              {/* Arbitrage card (when data available) */}
              {arbitrage && <ArbitrageCard arbitrage={arbitrage} />}

              {/* Label roster songs */}
              {data.songs.some((s) => s.is_label_roster) && (
                <Section title="Your Roster">
                  {sortSongs(data.songs.filter((s) => s.is_label_roster)).map(
                    (song) => (
                      <SongRow key={song.entity_id} song={song} />
                    ),
                  )}
                </Section>
              )}

              {/* All songs */}
              <Section title="All Songs">
                {sortSongs(data.songs.filter((s) => !s.is_label_roster)).map(
                  (song) => (
                    <SongRow key={song.entity_id} song={song} />
                  ),
                )}
              </Section>

              {/* Genre breakdown */}
              <Section title="Genre Breakdown">
                {data.genre_breakdown.map((g) => {
                  const max = data.genre_breakdown[0]?.count ?? 1;
                  const pct = (g.count / max) * 100;
                  return (
                    <div
                      key={g.genre}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: "rgba(255,255,255,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 3,
                            background: genreColor(g.genre.toLowerCase()),
                            transition:
                              "width 600ms cubic-bezier(0.25,1,0.5,1)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.55)",
                          width: 90,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {g.genre}{" "}
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>
                          {g.count}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </Section>

              {/* Platform split */}
              <Section title="Platform Split">
                {data.platform_breakdown.map((p) => (
                  <div
                    key={p.platform}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>
                      {p.platform}
                    </span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {p.count.toLocaleString()} songs
                    </span>
                  </div>
                ))}
              </Section>
            </div>
          </>
        )}
      </div>

      <style>{`
        .pulse-sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .pulse-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .pulse-sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }
        .pulse-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

const POSITION_METRICS = new Set([
  "chart_position",
  "trending_position",
  "position",
]);
const MAX_ALSO_IN = 5;

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function SongRow({ song }: { song: CountryDetailSong }) {
  const velColor = VELOCITY_COLORS[song.velocity_class] ?? "#6B7280";
  const artistDisplay =
    !song.artist_name || song.artist_name === "Unknown"
      ? null
      : song.artist_name;

  // Partition platforms: position metrics (shown as #X) vs count metrics
  const positionBadges = song.platforms.filter(
    (p) => POSITION_METRICS.has(p.metric) && p.rank != null && p.rank <= 500,
  );
  const countBadges = song.platforms.filter(
    (p) => !POSITION_METRICS.has(p.metric) || (p.rank != null && p.rank > 500),
  );
  // If no position badges, show platform presence from count metrics
  const platformsToShow =
    positionBadges.length > 0 ? positionBadges : countBadges;

  // "Also in:" capped at 5
  const alsoInDisplayed = song.also_in.slice(0, MAX_ALSO_IN);
  const alsoInRemaining = song.also_in.length - MAX_ALSO_IN;

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span
          style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", flex: 1 }}
        >
          {song.song_name}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: velColor,
            background: `${velColor}18`,
            padding: "2px 8px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            flexShrink: 0,
          }}
        >
          {song.velocity_class}
        </span>
      </div>
      {artistDisplay && (
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            marginBottom: 4,
          }}
        >
          {artistDisplay}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {platformsToShow.map((p, i) => {
          const isPosition =
            POSITION_METRICS.has(p.metric) && p.rank != null && p.rank <= 500;
          return (
            <span
              key={`${p.platform}-${p.metric}-${i}`}
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {p.platform}{" "}
              {isPosition
                ? `#${p.rank}`
                : p.rank != null
                  ? formatLargeNumber(p.rank)
                  : ""}
              {p.is_new && (
                <span style={{ color: "#A855F7", marginLeft: 3 }}>NEW</span>
              )}
              {!p.is_new &&
                isPosition &&
                p.rank_change &&
                p.rank_change !== "0" && (
                  <span style={{ color: "#3B82F6", marginLeft: 3 }}>
                    {p.rank_change}
                  </span>
                )}
            </span>
          );
        })}
      </div>
      {song.also_in.length > 0 && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            marginTop: 4,
          }}
        >
          Also in: {alsoInDisplayed.join(", ")}
          {alsoInRemaining > 0 && ` and ${alsoInRemaining} more`}
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

const VELOCITY_ORDER: Record<string, number> = {
  viral: 0,
  accelerating: 1,
  growing: 2,
  new: 3,
  steady: 4,
  decelerating: 5,
  declining: 6,
};

function getBestRank(song: CountryDetailSong): number {
  const positions = song.platforms
    .filter(
      (p) => POSITION_METRICS.has(p.metric) && p.rank != null && p.rank <= 500,
    )
    .map((p) => p.rank!);
  return positions.length > 0 ? Math.min(...positions) : 9999;
}

function sortSongs(songs: CountryDetailSong[]): CountryDetailSong[] {
  return [...songs].sort((a, b) => {
    const velA = VELOCITY_ORDER[a.velocity_class] ?? 9;
    const velB = VELOCITY_ORDER[b.velocity_class] ?? 9;
    if (velA !== velB) return velA - velB;
    // Within same velocity class, sort by best chart position (lower = better)
    return getBestRank(a) - getBestRank(b);
  });
}
