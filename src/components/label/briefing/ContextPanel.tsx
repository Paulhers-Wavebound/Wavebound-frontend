import { useMemo } from "react";
import type { ArtistCard } from "@/types/artistIntelligence";
import type { BriefingData } from "@/types/artistBriefing";
import type { RosterScoreEntry } from "@/utils/artistBriefingApi";

// ─── Helpers ─────────────────────────────────────────────────────

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

// ─── Audience Pulse ──────────────────────────────────────────────

function AudiencePulse({ card }: { card: ArtistCard }) {
  const sentiment = card.sentiment;
  if (!sentiment) return null;

  const vibeLabel = sentiment.audience_vibe ?? "unknown";
  const vibeColor =
    vibeLabel === "rabid"
      ? "#FF453A"
      : vibeLabel === "engaged"
        ? "#30D158"
        : vibeLabel === "casual"
          ? "#0A84FF"
          : vibeLabel === "mixed"
            ? "#FFD60A"
            : vibeLabel === "cold"
              ? "#8E8E93"
              : "rgba(255,255,255,0.35)";

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "1px",
          marginBottom: 14,
        }}
      >
        AUDIENCE PULSE
      </div>

      {/* Score + vibe */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        {/* Sentiment score circle */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `2px solid ${sentiment.score >= 70 ? "#30D158" : sentiment.score >= 40 ? "#FFD60A" : "#FF453A"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 16,
              fontWeight: 700,
              color: "rgba(255,255,255,0.87)",
            }}
          >
            {sentiment.score}
          </span>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(255,255,255,0.87)",
                textTransform: "capitalize",
              }}
            >
              {vibeLabel}
            </span>
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: vibeColor,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: "rgba(255,255,255,0.30)",
            }}
          >
            Energy: {sentiment.energy}/100 · {sentiment.comments_analyzed} comments
          </span>
        </div>
      </div>

      {/* Themes */}
      {sentiment.themes && sentiment.themes.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: sentiment.content_ideas && sentiment.content_ideas.length > 0 ? 12 : 0,
          }}
        >
          {sentiment.themes.slice(0, 4).map((t) => (
            <span
              key={t.theme}
              style={{
                display: "inline-flex",
                padding: "3px 8px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {t.theme}
              <span
                style={{
                  marginLeft: 4,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                {t.count}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Content ideas */}
      {sentiment.content_ideas && sentiment.content_ideas.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 10,
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(255,255,255,0.30)",
              letterSpacing: "0.8px",
              marginBottom: 6,
            }}
          >
            AI CONTENT IDEAS
          </div>
          {sentiment.content_ideas.slice(0, 2).map((idea, i) => (
            <div
              key={i}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.5,
                marginBottom: 2,
              }}
            >
              {idea}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Platform Status ─────────────────────────────────────────────

function PlatformStatus({ card }: { card: ArtistCard }) {
  const platforms = [
    { key: "spotify", label: "Spotify", trend: card.signals.spotify_trend },
    { key: "tiktok", label: "TikTok", trend: card.signals.tiktok_trend },
    { key: "youtube", label: "YouTube", trend: card.signals.youtube_trend },
    { key: "shazam", label: "Shazam", trend: card.signals.shazam_trend },
  ];

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 20px",
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
          PLATFORMS
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {card.signals.platforms_growing} growing · {card.signals.platforms_declining} declining
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {platforms.map((p) => {
          const trend = p.trend;
          const color =
            trend == null
              ? "rgba(255,255,255,0.15)"
              : trend > 5
                ? "#30D158"
                : trend > 0
                  ? "#30D158"
                  : trend < -5
                    ? "#FF453A"
                    : trend < 0
                      ? "#FF453A"
                      : "#8E8E93";
          const barWidth = trend != null ? Math.min(Math.abs(trend) * 3, 100) : 0;

          return (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  width: 58,
                  flexShrink: 0,
                }}
              >
                {p.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {trend != null && (
                  <div
                    style={{
                      position: "absolute",
                      left: trend >= 0 ? "50%" : `${50 - barWidth / 2}%`,
                      width: `${barWidth / 2}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: color,
                      opacity: 0.6,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  fontWeight: 600,
                  color,
                  width: 40,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {trend != null
                  ? `${trend > 0 ? "+" : ""}${trend.toFixed(0)}%`
                  : "\u2014"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Roster Rank ─────────────────────────────────────────────────

function RosterRank({
  card,
  rosterScores,
}: {
  card: ArtistCard;
  rosterScores: RosterScoreEntry[];
}) {
  const sorted = useMemo(
    () => [...rosterScores].sort((a, b) => b.artist_score - a.artist_score),
    [rosterScores],
  );

  const currentRank = useMemo(
    () =>
      sorted.findIndex(
        (e) =>
          e.canonical_name.toLowerCase() === card.name.toLowerCase() ||
          e.entity_id === card.entity_id,
      ) + 1,
    [sorted, card],
  );

  if (rosterScores.length < 2 || currentRank === 0) return null;

  const percentile = Math.round((currentRank / sorted.length) * 100);
  const avgScore = Math.round(
    sorted.reduce((sum, e) => sum + e.artist_score, 0) / sorted.length,
  );
  const diff = card.artist_score - avgScore;

  // Mini histogram
  const buckets = Array.from({ length: 10 }, () => 0);
  for (const s of sorted) {
    const idx = Math.min(Math.floor(s.artist_score / 10), 9);
    buckets[idx]++;
  }
  const maxBucket = Math.max(...buckets, 1);
  const currentBucket = Math.min(Math.floor(card.artist_score / 10), 9);

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "1px",
          marginBottom: 12,
        }}
      >
        ROSTER RANK
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 24,
            fontWeight: 700,
            color: currentRank <= 3 ? "var(--accent)" : "rgba(255,255,255,0.87)",
          }}
        >
          #{currentRank}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          of {sorted.length}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            marginLeft: "auto",
          }}
        >
          Top {percentile}%
        </span>
      </div>

      {/* Mini histogram */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 28, marginBottom: 8 }}>
        {buckets.map((count, i) => {
          const height = Math.max((count / maxBucket) * 24, 2);
          const isCurrent = i === currentBucket;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height,
                borderRadius: "2px 2px 0 0",
                background: isCurrent ? "var(--accent)" : "rgba(255,255,255,0.06)",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {diff > 0 ? `+${diff}` : diff} vs roster avg ({avgScore})
      </div>
    </div>
  );
}

// ─── Risks ───────────────────────────────────────────────────────

interface Risk {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

function detectRisks(data: BriefingData): Risk[] {
  const { artistCard: card, marketsV2, songs } = data;
  const risks: Risk[] = [];

  const safeMarkets = marketsV2 ?? [];
  const safeSongs = songs ?? [];

  const decliningMarkets = safeMarkets.filter(
    (m) =>
      m.is_present && (m.velocity === "declining" || m.velocity === "exiting"),
  );
  if (decliningMarkets.length > 0) {
    const names = decliningMarkets
      .slice(0, 3)
      .map((m) => countryName(m.country_code))
      .join(", ");
    risks.push({
      title: `Declining in ${decliningMarkets.length} market${decliningMarkets.length > 1 ? "s" : ""}`,
      detail: names,
      severity: decliningMarkets.length >= 3 ? "high" : "medium",
    });
  }

  const decliningSongs = safeSongs.filter(
    (s) =>
      s.velocity_class === "declining" || s.velocity_class === "decelerating",
  );
  if (
    decliningSongs.length > 0 &&
    safeSongs.length > 0 &&
    decliningSongs.length >= safeSongs.length * 0.4
  ) {
    risks.push({
      title: `${decliningSongs.length}/${safeSongs.length} songs cooling`,
      detail: "Catalog momentum at risk",
      severity:
        decliningSongs.length >= safeSongs.length * 0.6 ? "high" : "medium",
    });
  }

  const missingPlatforms = card?.coverage?.missing ?? [];
  if (missingPlatforms.length >= 3) {
    risks.push({
      title: `Missing ${missingPlatforms.length} platforms`,
      detail: missingPlatforms.slice(0, 3).join(", "),
      severity: missingPlatforms.length >= 5 ? "high" : "low",
    });
  }

  if (card.momentum?.zone === "negative") {
    risks.push({
      title: "Negative momentum zone",
      detail: "Below baseline trajectory",
      severity: "medium",
    });
  }

  return risks.slice(0, 3);
}

function RisksCard({ data }: { data: BriefingData }) {
  const risks = useMemo(() => detectRisks(data), [data]);

  if (risks.length === 0) return null;

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 14,
        border: "1px solid rgba(255,69,58,0.10)",
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 700,
          color: "#FF453A",
          letterSpacing: "1px",
          marginBottom: 10,
        }}
      >
        RISKS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {risks.map((risk, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>
              {risk.severity === "high" ? "\uD83D\uDED1" : "\u26A0\uFE0F"}
            </span>
            <div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.87)",
                }}
              >
                {risk.title}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {risk.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

interface ContextPanelProps {
  card: ArtistCard;
  data: BriefingData;
  rosterScores: RosterScoreEntry[];
}

export default function ContextPanel({
  card,
  data,
  rosterScores,
}: ContextPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AudiencePulse card={card} />
      <PlatformStatus card={card} />
      <RosterRank card={card} rosterScores={rosterScores} />
      <RisksCard data={data} />
    </div>
  );
}
