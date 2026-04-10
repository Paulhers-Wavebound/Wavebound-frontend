import { useMemo, useState } from "react";
import type { BriefingData, MarketOpportunityV2 } from "@/types/artistBriefing";
import { VELOCITY_CONFIG } from "@/types/artistBriefing";
import type { VelocityClass } from "@/types/artistBriefing";

// ─── Helpers ───────────────────────────────────────────────────────

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

function formatStreams(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

function formatDelta(n: number | null): string {
  if (n == null) return "";
  if (n > 0) return `\u25B2${n}`;
  if (n < 0) return `\u25BC${Math.abs(n)}`;
  return "\u2014";
}

// ─── Velocity group logic ──────────────────────────────────────────

type VelocityGroup = "breaking_out" | "growing" | "steady" | "declining";

const VELOCITY_GROUPS: Array<{
  key: VelocityGroup;
  label: string;
  icon: string;
  color: string;
  classes: VelocityClass[];
}> = [
  {
    key: "breaking_out",
    label: "BREAKING OUT",
    icon: "\uD83D\uDD25",
    color: "#FF453A",
    classes: ["viral", "accelerating"],
  },
  {
    key: "growing",
    label: "GROWING",
    icon: "\uD83D\uDCC8",
    color: "#30D158",
    classes: ["growing"],
  },
  {
    key: "steady",
    label: "STEADY",
    icon: "\u27A1\uFE0F",
    color: "#8E8E93",
    classes: ["steady", "new"],
  },
  {
    key: "declining",
    label: "DECLINING",
    icon: "\uD83D\uDD3B",
    color: "#FF453A",
    classes: ["decelerating", "declining"],
  },
];

// ─── Cascade detection ─────────────────────────────────────────────

interface CascadeInfo {
  pattern: string;
  stage: number;
  totalStages: number;
  prediction: string | null;
  confidence: "high" | "medium" | "low";
}

function detectCascade(
  platforms: string[],
  marketCount: number,
): CascadeInfo | null {
  const KNOWN_CASCADES = [
    ["tiktok", "shazam", "spotify"],
    ["tiktok", "apple_music", "spotify"],
    ["spotify", "shazam", "tiktok"],
    ["shazam", "spotify", "apple_music"],
  ];

  const normalized = platforms.map((p) => p.toLowerCase().replace(/\s+/g, "_"));

  for (const pattern of KNOWN_CASCADES) {
    const matchLen = pattern.filter((p, i) => normalized[i] === p).length;
    if (matchLen >= 2) {
      const nextPlatform = matchLen < pattern.length ? pattern[matchLen] : null;
      return {
        pattern: pattern
          .map((p) =>
            p
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
          )
          .join(" \u2192 "),
        stage: matchLen,
        totalStages: pattern.length,
        prediction: nextPlatform
          ? `${nextPlatform
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")} entry predicted within 7-10 days`
          : null,
        confidence: matchLen >= 2 && marketCount >= 2 ? "high" : "medium",
      };
    }
  }
  return null;
}

// ─── Assemble song signals from market data ────────────────────────

interface SongSignal {
  songName: string;
  songEntityId: string;
  velocityClass: VelocityClass;
  dailyStreams: number;
  pctChange7d: number;
  markets: Array<{
    countryCode: string;
    platform: string | null;
    position: number | null;
    positionDelta: number | null;
    velocity: string | null;
    isNew: boolean;
    discoverySignal: string | null;
  }>;
  cascade: CascadeInfo | null;
}

function assembleSongSignals(data: BriefingData): SongSignal[] {
  const { songs, marketsV2 } = data;

  // Group markets by entry song
  const marketsBySong = new Map<string, MarketOpportunityV2[]>();
  for (const m of marketsV2) {
    if (m.entry_song_entity_id) {
      const existing = marketsBySong.get(m.entry_song_entity_id) ?? [];
      existing.push(m);
      marketsBySong.set(m.entry_song_entity_id, existing);
    }
  }

  return songs.map((song) => {
    const songMarkets = marketsBySong.get(song.entity_id) ?? [];

    // Get unique platforms from markets for cascade detection
    const platforms = [
      ...new Set(
        songMarkets
          .filter((m) => m.best_velocity_platform)
          .map((m) => m.best_velocity_platform!),
      ),
    ];

    const cascade = detectCascade(platforms, songMarkets.length);

    return {
      songName: song.song_name,
      songEntityId: song.entity_id,
      velocityClass: song.velocity_class,
      dailyStreams: song.daily_streams,
      pctChange7d: song.pct_change_7d,
      markets: songMarkets.map((m) => ({
        countryCode: m.country_code,
        platform: m.best_velocity_platform,
        position: m.best_position,
        positionDelta: m.position_delta_7d,
        velocity: m.velocity,
        isNew: (m.days_trending ?? 999) <= 7,
        discoverySignal: m.discovery_signal_type,
      })),
      cascade,
    };
  });
}

// ─── Song Signal Card ──────────────────────────────────────────────

function SongSignalCard({ song }: { song: SongSignal }) {
  const vel = VELOCITY_CONFIG[song.velocityClass] ?? VELOCITY_CONFIG.steady;
  const [expanded, setExpanded] = useState(song.markets.length <= 6);

  const visibleMarkets = expanded ? song.markets : song.markets.slice(0, 4);

  return (
    <div
      style={{
        background: "#2C2C2E",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 20,
      }}
    >
      {/* Song header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255,255,255,0.87)",
            }}
          >
            "{song.songName}"
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: 8,
              background: vel.bg,
              color: vel.color,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {vel.icon} {vel.label}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {formatStreams(song.dailyStreams)}/day
          </span>
          {song.pctChange7d !== 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                fontWeight: 600,
                color:
                  song.pctChange7d > 0
                    ? "#30D158"
                    : song.pctChange7d < 0
                      ? "#FF453A"
                      : "rgba(255,255,255,0.35)",
              }}
            >
              {song.pctChange7d > 0 ? "+" : ""}
              {song.pctChange7d.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Market signals */}
      {song.markets.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {visibleMarkets.map((m) => (
            <div
              key={m.countryCode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
              }}
            >
              <span style={{ fontSize: 14, width: 22, flexShrink: 0 }}>
                {countryFlag(m.countryCode)}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "rgba(255,255,255,0.87)",
                  width: 100,
                  flexShrink: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {countryName(m.countryCode)}
              </span>
              {m.platform && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "rgba(255,255,255,0.55)",
                    width: 80,
                    flexShrink: 0,
                  }}
                >
                  {m.platform
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </span>
              )}
              {m.position != null && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.87)",
                    width: 40,
                    flexShrink: 0,
                  }}
                >
                  #{m.position}
                </span>
              )}
              {m.positionDelta != null && m.positionDelta !== 0 && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    fontWeight: 600,
                    color: m.positionDelta < 0 ? "#30D158" : "#FF453A",
                  }}
                >
                  {formatDelta(m.positionDelta * -1)}
                </span>
              )}
              {m.isNew && (
                <span
                  style={{
                    display: "inline-flex",
                    padding: "1px 6px",
                    borderRadius: 6,
                    background: "rgba(191,90,242,0.15)",
                    color: "#BF5AF2",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  NEW
                </span>
              )}
              {m.discoverySignal === "pre_breakout" && (
                <span
                  style={{
                    display: "inline-flex",
                    padding: "1px 6px",
                    borderRadius: 6,
                    background: "rgba(255,69,58,0.12)",
                    color: "#FF453A",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  PRE-BREAKOUT
                </span>
              )}
            </div>
          ))}
          {!expanded && song.markets.length > 4 && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                textAlign: "left",
              }}
            >
              + {song.markets.length - 4} more markets
            </button>
          )}
        </div>
      )}

      {/* Cascade detection */}
      {song.cascade && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "rgba(255,159,10,0.06)",
            borderRadius: 8,
            border: "1px solid rgba(255,159,10,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 13 }}>{"\u26A1"}</span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                fontWeight: 700,
                color: "#FF9F0A",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              CASCADE DETECTED
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Stage {song.cascade.stage}/{song.cascade.totalStages}
            </span>
          </div>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.5,
            }}
          >
            {song.cascade.pattern}.
            {song.cascade.prediction && (
              <>
                {" "}
                {song.cascade.prediction}. Confidence:{" "}
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      song.cascade.confidence === "high"
                        ? "#30D158"
                        : "#FFD60A",
                  }}
                >
                  {song.cascade.confidence.toUpperCase()}
                </span>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export default function SignalMap({ data }: { data: BriefingData }) {
  const [view, setView] = useState<"signals" | "list">("signals");

  const songSignals = useMemo(() => assembleSongSignals(data), [data]);

  // Group songs by velocity
  const groups = useMemo(() => {
    return VELOCITY_GROUPS.map((group) => ({
      ...group,
      songs: songSignals
        .filter((s) => group.classes.includes(s.velocityClass))
        .sort((a, b) => b.dailyStreams - a.dailyStreams),
    })).filter((g) => g.songs.length > 0);
  }, [songSignals]);

  // Collapse steady/declining by default
  const [expandedGroups, setExpandedGroups] = useState<Set<VelocityGroup>>(
    new Set(["breaking_out", "growing"]),
  );

  const toggleGroup = (key: VelocityGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (songSignals.length === 0) {
    return (
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Song velocity data loading or not yet available
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 28,
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
        <h2
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 17,
            fontWeight: 600,
            color: "rgba(255,255,255,0.87)",
            margin: 0,
          }}
        >
          GLOBAL SIGNALS
        </h2>
        <div style={{ display: "flex", gap: 4 }}>
          {(["signals", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: view === v ? 600 : 400,
                color:
                  view === v
                    ? "rgba(255,255,255,0.87)"
                    : "rgba(255,255,255,0.35)",
                background:
                  view === v ? "rgba(255,255,255,0.06)" : "transparent",
                border: "none",
                borderRadius: 8,
                padding: "4px 12px",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {groups.map((g) => (
          <span
            key={g.key}
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: g.color,
            }}
          >
            {g.icon} {g.songs.length} {g.label.toLowerCase()}
          </span>
        ))}
      </div>

      {/* Velocity groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.key);
          const steadyCollapsed =
            (group.key === "steady" || group.key === "declining") &&
            !isExpanded;

          return (
            <div key={group.key}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                  marginBottom: isExpanded ? 8 : 0,
                }}
              >
                <span style={{ fontSize: 14 }}>{group.icon}</span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: group.color,
                    letterSpacing: "1px",
                  }}
                >
                  {group.label}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  ({group.songs.length} song
                  {group.songs.length !== 1 ? "s" : ""}
                  {group.songs.reduce((sum, s) => sum + s.markets.length, 0) > 0
                    ? ` in ${group.songs.reduce((sum, s) => sum + s.markets.length, 0)} markets`
                    : ""}
                  )
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "rgba(255,255,255,0.25)",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 200ms",
                  }}
                >
                  {"\u25B6"}
                </span>
              </button>

              {/* Songs */}
              {isExpanded && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {group.songs.map((song) => (
                    <SongSignalCard key={song.songEntityId} song={song} />
                  ))}
                </div>
              )}

              {/* Collapsed summary for steady/declining */}
              {steadyCollapsed && group.songs.length > 0 && (
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                    paddingLeft: 22,
                  }}
                >
                  {group.songs
                    .slice(0, 3)
                    .map((s) => `"${s.songName}"`)
                    .join(", ")}
                  {group.songs.length > 3
                    ? ` + ${group.songs.length - 3} more`
                    : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
