import { useMemo } from "react";
import type { ArtistCard } from "@/types/artistIntelligence";
import type { RosterScoreEntry } from "@/utils/artistBriefingApi";

// ─── Helpers ───────────────────────────────────────────────────────

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  rising_fast: { icon: "\uD83D\uDD25", color: "#30D158" },
  rising: { icon: "\u2191", color: "#30D158" },
  stable: { icon: "\u2192\uFE0F", color: "#8E8E93" },
  falling: { icon: "\u2193", color: "#FF453A" },
  falling_fast: { icon: "\uD83D\uDD3B", color: "#FF453A" },
};

// ─── Roster Ranking Table ──────────────────────────────────────────

function RosterRow({
  entry,
  isCurrent,
  rank,
}: {
  entry: RosterScoreEntry;
  isCurrent: boolean;
  rank: number;
}) {
  const trend = TREND_ICONS[entry.trend] ?? TREND_ICONS.stable;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 8,
        background: isCurrent ? "rgba(232,67,10,0.06)" : "transparent",
        border: isCurrent
          ? "1px solid rgba(232,67,10,0.15)"
          : "1px solid transparent",
      }}
    >
      {/* Rank */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          fontWeight: 700,
          color: isCurrent ? "var(--accent)" : "rgba(255,255,255,0.35)",
          width: 24,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        #{rank}
      </span>

      {/* Name */}
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: isCurrent ? 600 : 400,
          color: isCurrent ? "rgba(255,255,255,0.87)" : "rgba(255,255,255,0.7)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.canonical_name}
        {isCurrent && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: "var(--accent)",
              marginLeft: 6,
            }}
          >
            {"\u2190"}
          </span>
        )}
      </span>

      {/* Score */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 14,
          fontWeight: 700,
          color: "rgba(255,255,255,0.87)",
          width: 36,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {entry.artist_score}
      </span>

      {/* Markets */}
      {entry.total_markets != null && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            width: 28,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          {entry.total_markets}
        </span>
      )}

      {/* Trend */}
      <span
        style={{
          fontSize: 13,
          color: trend.color,
          width: 20,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {trend.icon}
      </span>
    </div>
  );
}

// ─── Distribution Curve (simplified histogram) ─────────────────────

function DistributionCurve({
  scores,
  currentScore,
}: {
  scores: number[];
  currentScore: number;
}) {
  if (scores.length < 5) return null;

  // Build histogram buckets (0-10, 10-20, ..., 90-100)
  const buckets = Array.from({ length: 10 }, () => 0);
  for (const s of scores) {
    const idx = Math.min(Math.floor(s / 10), 9);
    buckets[idx]++;
  }
  const maxBucket = Math.max(...buckets, 1);
  const currentBucket = Math.min(Math.floor(currentScore / 10), 9);

  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 40 }}
    >
      {buckets.map((count, i) => {
        const height = Math.max((count / maxBucket) * 36, 2);
        const isCurrent = i === currentBucket;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height,
              borderRadius: "2px 2px 0 0",
              background: isCurrent
                ? "var(--accent)"
                : "rgba(255,255,255,0.08)",
              transition: "height 600ms ease-out",
              position: "relative",
            }}
          >
            {isCurrent && (
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--accent)",
                  whiteSpace: "nowrap",
                }}
              >
                {currentScore}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

interface CompetitiveLensProps {
  card: ArtistCard;
  rosterScores: RosterScoreEntry[];
}

export default function CompetitiveLens({
  card,
  rosterScores,
}: CompetitiveLensProps) {
  // Sort roster by score descending
  const sorted = useMemo(
    () => [...rosterScores].sort((a, b) => b.artist_score - a.artist_score),
    [rosterScores],
  );

  // Find current artist's rank
  const currentRank = useMemo(
    () =>
      sorted.findIndex(
        (e) =>
          e.canonical_name.toLowerCase() === card.name.toLowerCase() ||
          e.entity_id === card.entity_id,
      ) + 1,
    [sorted, card],
  );

  // Compute competitive insights
  const insights = useMemo(() => {
    if (sorted.length < 3) return null;

    const avgScore =
      sorted.reduce((sum, e) => sum + e.artist_score, 0) / sorted.length;
    const avgMarkets =
      sorted.reduce((sum, e) => sum + (e.total_markets ?? 0), 0) /
      sorted.length;

    const accelerating = sorted.filter(
      (e) => e.trend === "rising_fast" || e.trend === "rising",
    );
    const declining = sorted.filter(
      (e) => e.trend === "falling_fast" || e.trend === "falling",
    );

    // How fast is current artist growing vs roster average
    const currentEntry = sorted.find(
      (e) =>
        e.canonical_name.toLowerCase() === card.name.toLowerCase() ||
        e.entity_id === card.entity_id,
    );
    const growthVsAvg =
      currentEntry && currentEntry.platforms_growing != null
        ? currentEntry.platforms_growing -
          sorted.reduce((sum, e) => sum + (e.platforms_growing ?? 0), 0) /
            sorted.length
        : null;

    return {
      avgScore: Math.round(avgScore),
      avgMarkets: Math.round(avgMarkets),
      acceleratingCount: accelerating.length,
      decliningCount: declining.length,
      totalRoster: sorted.length,
      growthVsAvg,
    };
  }, [sorted, card]);

  // Build the insight paragraph
  const insightText = useMemo(() => {
    if (!insights || currentRank === 0) return null;
    const parts: string[] = [];

    if (currentRank <= 3) {
      parts.push(`${card.name} is #${currentRank} on your roster by momentum.`);
    } else if (currentRank <= Math.ceil(sorted.length * 0.25)) {
      parts.push(
        `${card.name} ranks #${currentRank} of ${sorted.length} — top quartile by momentum.`,
      );
    } else {
      parts.push(
        `${card.name} ranks #${currentRank} of ${sorted.length} roster artists.`,
      );
    }

    if (card.artist_score > insights.avgScore + 10) {
      parts.push(
        `Scoring ${card.artist_score - insights.avgScore} points above roster average (${insights.avgScore}).`,
      );
    } else if (card.artist_score < insights.avgScore - 10) {
      parts.push(
        `Scoring ${insights.avgScore - card.artist_score} points below roster average (${insights.avgScore}).`,
      );
    }

    if (card.trend === "rising_fast" && insights.acceleratingCount <= 3) {
      parts.push(
        `One of only ${insights.acceleratingCount} artist${insights.acceleratingCount !== 1 ? "s" : ""} accelerating on the roster.`,
      );
    }

    return parts.join(" ");
  }, [card, insights, currentRank, sorted.length]);

  if (rosterScores.length < 2) {
    return null; // Not enough data for comparison
  }

  // Show top 7 + current artist (if not in top 7)
  const visibleEntries = useMemo(() => {
    const top = sorted.slice(0, 7);
    const currentInTop = top.some(
      (e) =>
        e.canonical_name.toLowerCase() === card.name.toLowerCase() ||
        e.entity_id === card.entity_id,
    );
    if (!currentInTop && currentRank > 0) {
      const currentEntry = sorted[currentRank - 1];
      if (currentEntry) top.push(currentEntry);
    }
    return top;
  }, [sorted, card, currentRank]);

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
          COMPETITIVE INTELLIGENCE
        </h2>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {sorted.length} roster artists
        </span>
      </div>

      {/* VS Your Roster */}
      <div
        style={{
          background: "#2C2C2E",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "1px",
            }}
          >
            VS YOUR ROSTER
          </span>
          {currentRank > 0 && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Momentum ranking:{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.87)",
                }}
              >
                #{currentRank}
              </span>{" "}
              of {sorted.length}
            </span>
          )}
        </div>

        {/* Table header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "4px 12px",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              width: 24,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            #
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              flex: 1,
            }}
          >
            Artist
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              width: 36,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            Score
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              width: 28,
              textAlign: "right",
              flexShrink: 0,
            }}
          >
            Mkts
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              width: 20,
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            Trend
          </span>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visibleEntries.map((entry, i) => {
            const rank =
              sorted.findIndex((e) => e.entity_id === entry.entity_id) + 1;
            const isCurrent =
              entry.canonical_name.toLowerCase() === card.name.toLowerCase() ||
              entry.entity_id === card.entity_id;

            // Add separator if we jumped ranks
            const prevRank =
              i > 0
                ? sorted.findIndex(
                    (e) => e.entity_id === visibleEntries[i - 1].entity_id,
                  ) + 1
                : 0;
            const showGap = i > 0 && rank - prevRank > 1;

            return (
              <div key={entry.entity_id}>
                {showGap && (
                  <div
                    style={{
                      padding: "2px 12px",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      color: "rgba(255,255,255,0.15)",
                      textAlign: "center",
                    }}
                  >
                    ···
                  </div>
                )}
                <RosterRow entry={entry} isCurrent={isCurrent} rank={rank} />
              </div>
            );
          })}
        </div>

        {/* Insight paragraph */}
        {insightText && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.55)",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {insightText}
            </p>
          </div>
        )}
      </div>

      {/* Distribution Curve */}
      {sorted.length >= 5 && (
        <div
          style={{
            background: "#2C2C2E",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "1px",
              marginBottom: 16,
            }}
          >
            ROSTER SCORE DISTRIBUTION
          </div>

          <DistributionCurve
            scores={sorted.map((e) => e.artist_score)}
            currentScore={card.artist_score}
          />

          {/* Axis labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              0
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              50
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
              }}
            >
              100
            </span>
          </div>

          {/* Percentile */}
          {currentRank > 0 && (
            <div
              style={{
                marginTop: 12,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
                textAlign: "center",
              }}
            >
              Top{" "}
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                {Math.round((currentRank / sorted.length) * 100)}%
              </span>{" "}
              of roster by Global Momentum Score
            </div>
          )}
        </div>
      )}
    </div>
  );
}
