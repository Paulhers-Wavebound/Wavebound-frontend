import { useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────

interface FocusedSound {
  title: string;
  reason: string;
  action: string;
}

interface CatalogueAlert {
  title: string;
  delta: string;
  reason: string;
  action: string;
}

export interface WeeklyPulse {
  focused_sound?: FocusedSound | null;
  catalogue_alert?: CatalogueAlert | null;
  avoid?: string[];
  items?: Array<{
    why: string;
    date: string;
    type: string;
    summary: string;
    headline: string;
    sentiment: string;
    plan_action: string;
  }>;
  content_opportunities?: Array<{
    idea: string;
    reason: string;
    format: string;
    urgency: string;
  }>;
  sensitive_topics?: Array<{
    topic: string;
    guidance: string;
  }>;
  competitor_moves?: Array<{
    artist: string;
    move: string;
    implication: string;
  }>;
  week_of?: string;
  generated_at?: string;
  source?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

// ─── Main Component ──────────────────────────────────────────────

interface AIFocusProps {
  pulse: WeeklyPulse | null;
  generatedAt: string | null;
}

export default function AIFocus({ pulse, generatedAt }: AIFocusProps) {
  if (!pulse) {
    return (
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 16,
          borderTop: "0.5px solid rgba(255,255,255,0.04)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "rgba(255,255,255,0.20)",
          }}
        >
          AI focus analysis not yet available for this artist
        </span>
      </div>
    );
  }

  if (pulse.error) {
    return (
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 16,
          borderTop: "0.5px solid rgba(255,255,255,0.04)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "rgba(255,255,255,0.20)",
          }}
        >
          AI analysis unavailable: {pulse.error}
        </span>
      </div>
    );
  }

  const hasFocusedSound = !!pulse.focused_sound;
  const hasCatalogueAlert = !!pulse.catalogue_alert;
  const hasOldFormat = !hasFocusedSound && pulse.items && pulse.items.length > 0;

  const derivedFocus = useMemo(() => {
    if (hasFocusedSound) return null;
    if (!pulse.items || pulse.items.length === 0) return null;
    const topItem = pulse.items.find(
      (i) => i.type === "new_release" || i.type === "viral_moment",
    ) ?? pulse.items[0];
    return {
      title: topItem.headline,
      reason: topItem.summary,
      action: topItem.plan_action === "reference"
        ? "Reference in upcoming content"
        : topItem.plan_action === "react"
          ? "Create reactive content"
          : "Monitor this development",
    };
  }, [hasFocusedSound, pulse.items]);

  const focus = pulse.focused_sound ?? derivedFocus;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ─── Focused Sound — Editorial Card ─── */}
      {focus && (
        <div
          style={{
            background: "#1C1C1E",
            borderRadius: 16,
            borderTop: "0.5px solid rgba(232,67,10,0.15)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Subtle accent gradient at top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
              background: "linear-gradient(180deg, rgba(232,67,10,0.04) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ padding: "28px 28px 32px", position: "relative" }}>
            {/* Section label + timestamp */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#e8430a",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                AI FOCUS THIS WEEK
              </span>
              {generatedAt && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: "rgba(255,255,255,0.20)",
                  }}
                >
                  {timeAgo(generatedAt)}
                </span>
              )}
            </div>

            {/* Song title — editorial serif */}
            <h2
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 26,
                fontWeight: 700,
                color: "rgba(255,255,255,0.90)",
                margin: "0 0 20px",
                lineHeight: 1.2,
                letterSpacing: "-0.3px",
              }}
            >
              {focus.title}
            </h2>

            {/* Reason — AI narrative in Tiempos Text */}
            <div
              style={{
                fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
                fontSize: 15,
                lineHeight: 1.75,
                letterSpacing: "0.005em",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 24,
                WebkitFontSmoothing: "antialiased",
              }}
            >
              {focus.reason}
            </div>

            {/* Decision — the actionable takeaway */}
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(232,67,10,0.05)",
                borderRadius: 12,
                borderLeft: "2px solid rgba(232,67,10,0.4)",
              }}
            >
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#e8430a",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                DECISION
              </div>
              <div
                style={{
                  fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.80)",
                }}
              >
                {focus.action}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Catalogue Alert ─── */}
      {hasCatalogueAlert && pulse.catalogue_alert && (
        <div
          style={{
            background: "#1C1C1E",
            borderRadius: 16,
            borderTop: "0.5px solid rgba(191,90,242,0.12)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              background: "linear-gradient(180deg, rgba(191,90,242,0.03) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ padding: "24px 28px 28px", position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#BF5AF2",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                CATALOGUE ALERT
              </span>
              {pulse.catalogue_alert.delta && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#BF5AF2",
                  }}
                >
                  {pulse.catalogue_alert.delta}
                </span>
              )}
            </div>

            <h3
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 20,
                fontWeight: 700,
                color: "rgba(255,255,255,0.87)",
                margin: "0 0 12px",
                lineHeight: 1.2,
              }}
            >
              {pulse.catalogue_alert.title}
            </h3>
            <div
              style={{
                fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.55)",
                marginBottom: 12,
              }}
            >
              {pulse.catalogue_alert.reason}
            </div>
            <div
              style={{
                fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
                fontSize: 14,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.70)",
                fontStyle: "italic",
              }}
            >
              {pulse.catalogue_alert.action}
            </div>
          </div>
        </div>
      )}

      {/* ─── Old format: content opportunities ─── */}
      {hasOldFormat &&
        pulse.content_opportunities &&
        pulse.content_opportunities.length > 0 && (
          <div
            style={{
              background: "#1C1C1E",
              borderRadius: 16,
              borderTop: "0.5px solid rgba(255,255,255,0.04)",
              padding: "24px 28px",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.30)",
                letterSpacing: "1.5px",
                marginBottom: 16,
              }}
            >
              CONTENT OPPORTUNITIES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pulse.content_opportunities.slice(0, 3).map((opp, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color:
                        opp.urgency === "high"
                          ? "#FF453A"
                          : opp.urgency === "medium"
                            ? "#FFD60A"
                            : "rgba(255,255,255,0.25)",
                      flexShrink: 0,
                      width: 16,
                      textAlign: "center",
                      marginTop: 3,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.87)",
                        marginBottom: 2,
                      }}
                    >
                      {opp.idea}
                    </div>
                    <div
                      style={{
                        fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {opp.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ─── Avoid list ─── */}
      {pulse.avoid && pulse.avoid.length > 0 && (
        <div
          style={{
            background: "#1C1C1E",
            borderRadius: 16,
            borderTop: "0.5px solid rgba(255,69,58,0.08)",
            padding: "20px 28px 24px",
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 600,
              color: "#FF453A",
              letterSpacing: "1.5px",
              marginBottom: 12,
            }}
          >
            AVOID
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pulse.avoid.slice(0, 3).map((item, i) => (
              <div
                key={i}
                style={{
                  fontFamily: '"Tiempos Text", "Newsreader", Georgia, serif',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.50)",
                }}
              >
                {item}
              </div>
            ))}
            {pulse.avoid.length > 3 && (
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "rgba(255,255,255,0.20)",
                }}
              >
                + {pulse.avoid.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
