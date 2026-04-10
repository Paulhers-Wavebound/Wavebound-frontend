import type { ArtistCard } from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";

function Gauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        {/* Background circle */}
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        {/* Value arc */}
        <circle
          cx="44"
          cy="44"
          r="36"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 800ms ease-out" }}
        />
        {/* Value text */}
        <text
          x="44"
          y="44"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 20,
            fontWeight: 700,
            fill: "var(--ink)",
          }}
        >
          {value}
        </text>
      </svg>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: "var(--ink-secondary)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

const VIBE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  rabid: { label: "Rabid", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  engaged: { label: "Engaged", color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  casual: { label: "Casual", color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
  mixed: { label: "Mixed", color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  cold: { label: "Cold", color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
};

function sentimentColor(score: number): string {
  if (score >= 70) return "#30D158";
  if (score >= 50) return "#0A84FF";
  if (score >= 30) return "#FFD60A";
  return "#FF453A";
}

function energyColor(energy: number): string {
  if (energy >= 70) return "#FF9F0A";
  if (energy >= 40) return "#0A84FF";
  return "#8E8E93";
}

export default function FanSentiment({ card }: { card: ArtistCard }) {
  const sentiment = card.sentiment;

  if (!sentiment) {
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
          No fan sentiment data — requires TikTok comments
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
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
          Fan Sentiment{" "}
          <InfoTooltip text="Sentiment (0-100) and energy (0-100) from AI analysis of TikTok comments on the artist's videos. Themes are the most common topics fans discuss. Updated daily at 06:30 UTC via Gemini classification." />
        </h3>
        {sentiment.audience_vibe &&
          (() => {
            const vibe =
              VIBE_CONFIG[sentiment.audience_vibe!] ?? VIBE_CONFIG.mixed;
            return (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: vibe.bg,
                  color: vibe.color,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {vibe.label}
              </span>
            );
          })()}
      </div>

      {/* Gauges */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 40,
          marginBottom: 20,
        }}
      >
        <Gauge
          label="Sentiment"
          value={sentiment.score}
          color={sentimentColor(sentiment.score)}
        />
        <Gauge
          label="Energy"
          value={sentiment.energy}
          color={energyColor(sentiment.energy)}
        />
      </div>

      {/* Theme chips */}
      {sentiment.themes && sentiment.themes.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {sentiment.themes.map((t) => (
            <span
              key={t.theme}
              title={t.sample}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: "var(--ink-secondary)",
                cursor: "default",
              }}
            >
              {t.theme}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "var(--ink-tertiary)",
                }}
              >
                {t.count}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Intent breakdown — what fans are saying */}
      {sentiment.intent_breakdown &&
        (() => {
          const ib = sentiment.intent_breakdown!;
          const entries: Array<{
            key: string;
            label: string;
            value: number;
            color: string;
          }> = [
            {
              key: "praise",
              label: "Praise",
              value: ib.praise,
              color: "#30D158",
            },
            { key: "hype", label: "Hype", value: ib.hype, color: "#FF9F0A" },
            {
              key: "lyric_quote",
              label: "Lyric Quotes",
              value: ib.lyric_quote,
              color: "#BF5AF2",
            },
            {
              key: "trend_reference",
              label: "Trend Refs",
              value: ib.trend_reference,
              color: "#0A84FF",
            },
            {
              key: "question",
              label: "Questions",
              value: ib.question,
              color: "#5AC8FA",
            },
            {
              key: "collab_request",
              label: "Collab Requests",
              value: ib.collab_request,
              color: "#FFD60A",
            },
            {
              key: "complaint",
              label: "Complaints",
              value: ib.complaint,
              color: "#FF453A",
            },
          ].filter((e) => e.value > 0);
          const max = Math.max(...entries.map((e) => e.value), 1);

          return entries.length > 0 ? (
            <div
              style={{
                marginBottom: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                What Fans Are Saying
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {entries.map((e) => (
                  <div
                    key={e.key}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        color: "var(--ink-secondary)",
                        width: 90,
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    >
                      {e.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: "var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(e.value / max) * 100}%`,
                          borderRadius: 3,
                          background: e.color,
                          transition: "width 500ms ease-out",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "var(--ink-tertiary)",
                        width: 28,
                        flexShrink: 0,
                        textAlign: "right",
                      }}
                    >
                      {e.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

      {/* Content ideas from fan signals */}
      {sentiment.content_ideas && sentiment.content_ideas.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Content Ideas from Fans
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sentiment.content_ideas.map((idea) => (
              <div
                key={idea}
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink)",
                  paddingLeft: 12,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    color: "var(--ink-tertiary)",
                  }}
                >
                  ·
                </span>
                {idea}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top fan requests */}
      {sentiment.top_requests && sentiment.top_requests.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "#FFD60A",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Fan Requests
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sentiment.top_requests.map((req) => (
              <span
                key={req}
                style={{
                  display: "inline-flex",
                  padding: "4px 10px",
                  borderRadius: 16,
                  background: "rgba(255,214,10,0.08)",
                  border: "1px solid rgba(255,214,10,0.2)",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink)",
                }}
              >
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "var(--ink-tertiary)",
          textAlign: "center",
        }}
      >
        Based on {sentiment.comments_analyzed.toLocaleString()} comments
        {sentiment.as_of ? ` — ${sentiment.as_of}` : ""}
      </div>
    </div>
  );
}
