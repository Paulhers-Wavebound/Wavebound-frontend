import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber, trendLabel, crossPlatformBadge } from "./utils";

interface ArtistOption {
  id: string;
  canonical_name: string;
  artist_score: number | null;
}

const RECENT_KEY = "er_recent_artists";
const MAX_RECENT = 8;

function loadRecent(): ArtistOption[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(artist: ArtistOption) {
  const existing = loadRecent().filter((a) => a.id !== artist.id);
  const updated = [artist, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

interface ArtistSelectorProps {
  selectedId: string | null;
  artistName?: string;
  monthlyListeners?: number;
  globalRank?: number | null;
  marketsReached?: number;
  totalMarkets?: number;
  artistScore?: number;
  tier?: string;
  trend?: string;
  momentumScore?: number;
  crossPlatformSignal?: string;
  platformsGrowing?: number;
  onSelect: (entityId: string) => void;
}

export default function ArtistSelector({
  selectedId,
  artistName,
  monthlyListeners,
  globalRank,
  marketsReached,
  totalMarkets,
  artistScore,
  tier,
  trend,
  momentumScore,
  crossPlatformSignal,
  platformsGrowing,
  onSelect,
}: ArtistSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ArtistOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [recents] = useState<ArtistOption[]>(loadRecent);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Search wb_entities
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim() || search.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("artist_score")
        .select("entity_id, canonical_name, artist_score")
        .ilike("canonical_name", `%${search.trim()}%`)
        .order("artist_score", { ascending: false })
        .limit(15);
      const mapped: ArtistOption[] = (data ?? []).map((r) => ({
        id: r.entity_id,
        canonical_name: r.canonical_name,
        artist_score: r.artist_score,
      }));
      setResults(mapped);
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const trendInfo = trend ? trendLabel(trend) : null;
  const cpBadge = crossPlatformSignal
    ? crossPlatformBadge(crossPlatformSignal)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 38,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Expansion Radar
          </h1>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: "#30D158",
              background: "rgba(48, 209, 88, 0.1)",
              border: "1px solid rgba(48, 209, 88, 0.2)",
              padding: "4px 10px",
              borderRadius: 4,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#30D158",
                animation: "livePulse 2s ease-in-out infinite",
              }}
            />
            V2 Live
          </span>
        </div>
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
            margin: 0,
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          Untapped markets where demand is forming — powered by cross-platform
          chart intelligence from {totalMarkets ?? "70+"} markets.
        </p>
      </div>

      {/* Artist bar */}
      <div
        className="er-artist-bar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 24px",
        }}
      >
        {/* Left: stats */}
        <div
          className="er-artist-stats"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {artistName ? (
            <>
              <div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Artist
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {artistName}
                  </span>
                  {tier && (
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color:
                          tier === "elite"
                            ? "#FFD60A"
                            : tier === "strong"
                              ? "#34d399"
                              : "var(--ink-tertiary)",
                        background:
                          tier === "elite"
                            ? "rgba(255,214,10,0.12)"
                            : tier === "strong"
                              ? "rgba(52,211,153,0.12)"
                              : "rgba(255,255,255,0.06)",
                        padding: "2px 6px",
                        borderRadius: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {tier}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{ width: 1, height: 36, background: "var(--border)" }}
              />
              <div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Monthly Listeners
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {formatNumber(monthlyListeners ?? 0)}
                </div>
              </div>
              {globalRank && (
                <>
                  <div
                    style={{
                      width: 1,
                      height: 36,
                      background: "var(--border)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--ink-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 4,
                      }}
                    >
                      Global Rank
                    </div>
                    <div
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 20,
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      #{globalRank}
                    </div>
                  </div>
                </>
              )}
              <div
                style={{ width: 1, height: 36, background: "var(--border)" }}
              />
              <div>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  Markets
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {marketsReached ?? 0}{" "}
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ink-tertiary)",
                      fontWeight: 400,
                    }}
                  >
                    / {totalMarkets ?? "\u2014"}
                  </span>
                </div>
              </div>
              {artistScore != null && (
                <>
                  <div
                    style={{
                      width: 1,
                      height: 36,
                      background: "var(--border)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--ink-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 4,
                      }}
                    >
                      Artist Score
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 20,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {artistScore}
                      </span>
                      {trendInfo && (
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 10,
                            fontWeight: 500,
                            color: trendInfo.color,
                          }}
                        >
                          {trendInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
              {cpBadge && (
                <>
                  <div
                    style={{
                      width: 1,
                      height: 36,
                      background: "var(--border)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--ink-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 4,
                      }}
                    >
                      Cross-Platform
                    </div>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        fontWeight: 600,
                        color: cpBadge.color,
                      }}
                    >
                      {cpBadge.label}
                      {platformsGrowing != null && (
                        <span
                          style={{
                            color: "var(--ink-tertiary)",
                            fontWeight: 400,
                            marginLeft: 6,
                          }}
                        >
                          {platformsGrowing} growing
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 15,
                color: "var(--ink-tertiary)",
              }}
            >
              Select an artist to begin
            </div>
          )}
        </div>

        {/* Right: selector */}
        <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => {
              setOpen(!open);
              setSearch("");
              setResults([]);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              transition: "border-color 150ms",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: 500,
              color: selectedId ? "var(--ink)" : "var(--ink-secondary)",
            }}
          >
            <Search size={14} style={{ color: "var(--ink-tertiary)" }} />
            {selectedId ? "Change artist" : "Search artists"}
            <ChevronDown size={14} style={{ color: "var(--ink-tertiary)" }} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: 320,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 8,
                  zIndex: 50,
                  boxShadow: "var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.4))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    background: "var(--bg)",
                    borderRadius: 8,
                    marginBottom: 6,
                  }}
                >
                  <Search
                    size={14}
                    style={{ color: "var(--ink-tertiary)", flexShrink: 0 }}
                  />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search 25K+ artists..."
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      color: "var(--ink)",
                    }}
                  />
                  {searching && (
                    <Loader2
                      size={14}
                      style={{
                        color: "var(--ink-tertiary)",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  )}
                </div>

                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {/* Recent searches — show when no search text */}
                  {search.length < 2 && recents.length > 0 && (
                    <>
                      <div
                        style={{
                          padding: "6px 10px 4px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--ink-faint)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Recent
                      </div>
                      {recents.map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => {
                            saveRecent(artist);
                            onSelect(artist.id);
                            setOpen(false);
                            setSearch("");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "10px 10px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            background:
                              artist.id === selectedId
                                ? "rgba(232,67,10,0.08)"
                                : "transparent",
                            textAlign: "left",
                            transition: "background 150ms",
                          }}
                          onMouseEnter={(e) => {
                            if (artist.id !== selectedId)
                              e.currentTarget.style.background = "var(--bg)";
                          }}
                          onMouseLeave={(e) => {
                            if (artist.id !== selectedId)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 13,
                              fontWeight: artist.id === selectedId ? 600 : 400,
                              color:
                                artist.id === selectedId
                                  ? "var(--ink)"
                                  : "var(--ink-secondary)",
                            }}
                          >
                            {artist.canonical_name}
                          </div>
                          {artist.artist_score != null && (
                            <div
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: 11,
                                color: "var(--ink-tertiary)",
                              }}
                            >
                              Score {artist.artist_score}
                            </div>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                  {results.length === 0 && search.length >= 2 && !searching && (
                    <div
                      style={{
                        padding: "16px 10px",
                        textAlign: "center",
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      No artists found
                    </div>
                  )}
                  {results.map((artist) => (
                    <button
                      key={artist.id}
                      onClick={() => {
                        saveRecent(artist);
                        onSelect(artist.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 10px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background:
                          artist.id === selectedId
                            ? "rgba(232,67,10,0.08)"
                            : "transparent",
                        textAlign: "left",
                        transition: "background 150ms",
                      }}
                      onMouseEnter={(e) => {
                        if (artist.id !== selectedId)
                          e.currentTarget.style.background = "var(--bg)";
                      }}
                      onMouseLeave={(e) => {
                        if (artist.id !== selectedId)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 13,
                          fontWeight: artist.id === selectedId ? 600 : 400,
                          color:
                            artist.id === selectedId
                              ? "var(--ink)"
                              : "var(--ink-secondary)",
                        }}
                      >
                        {artist.canonical_name}
                      </div>
                      {artist.metadata?.kworb_rank && (
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          #{artist.metadata.kworb_rank}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
