import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ExpansionOpportunity } from "./mockData";

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  high: {
    bg: "rgba(232, 67, 10, 0.15)",
    text: "var(--accent, #e8430a)",
    label: "HIGH PRIORITY",
  },
  medium: { bg: "rgba(255, 214, 10, 0.12)", text: "#FFD60A", label: "MEDIUM" },
  new: { bg: "rgba(10, 132, 255, 0.12)", text: "#0A84FF", label: "NEW SIGNAL" },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toLocaleString();
}

interface OpportunityCardProps {
  opportunity: ExpansionOpportunity;
  index: number;
  highlighted?: boolean;
  defaultExpanded?: boolean;
}

export default function OpportunityCard({
  opportunity: opp,
  index,
  highlighted,
  defaultExpanded = true,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const priority = PRIORITY_STYLES[opp.priority] || PRIORITY_STYLES.medium;
  const isHigh = opp.priority === "high";

  return (
    <motion.div
      id={`opportunity-${opp.market_name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`}
      data-market={opp.market_name}
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: highlighted
          ? "0 0 30px rgba(232,67,10,0.25), inset 0 0 0 1px rgba(232,67,10,0.4)"
          : "none",
      }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.08 }}
      whileHover={{ scale: 1.005 }}
      style={{
        background: isHigh
          ? "linear-gradient(135deg, rgba(232,67,10,0.04) 0%, var(--surface, #1C1C1E) 60%)"
          : "var(--surface, #1C1C1E)",
        border: highlighted
          ? "1px solid rgba(232,67,10,0.4)"
          : "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        borderRadius: 18,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: expanded ? 20 : 0,
        transition: "border-color 300ms, box-shadow 300ms",
        scrollMarginTop: 24,
      }}
    >
      {/* Header — always visible, clickable to toggle */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{opp.flag}</span>
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink, rgba(255,255,255,0.87))",
                letterSpacing: "-0.01em",
              }}
            >
              {opp.market_name}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {opp.region}
              {!expanded && (
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color: "var(--green, #30D158)",
                  }}
                >
                  +${opp.projected_monthly_revenue.toLocaleString()}/mo
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: priority.text,
              background: priority.bg,
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            {priority.label}
          </span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown
              size={16}
              color="var(--ink-tertiary, rgba(255,255,255,0.35))"
              strokeWidth={2}
            />
          </motion.div>
        </div>
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Metric boxes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Comparable Avg",
                  value: formatNumber(opp.comparable_avg_listeners),
                },
                {
                  label: "Artist Current",
                  value:
                    opp.artist_current_listeners === 0
                      ? "0"
                      : formatNumber(opp.artist_current_listeners),
                },
                {
                  label: "Comment Signal",
                  value: `${opp.comment_signal_pct}%`,
                },
                {
                  label: "GOS Score",
                  value: String(opp.gos_score),
                  highlight: opp.gos_score >= 80,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: "var(--overlay-hover, rgba(255,255,255,0.03))",
                    borderRadius: 10,
                    padding: "10px 12px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 10,
                      color: "var(--ink-tertiary, rgba(255,255,255,0.4))",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: 4,
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 18,
                      fontWeight: 700,
                      color: m.highlight
                        ? "var(--accent, #e8430a)"
                        : "var(--ink, rgba(255,255,255,0.87))",
                    }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Evidence
              </span>
              {opp.evidence.map((e, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--accent, #e8430a)",
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      color: "var(--ink-secondary, rgba(255,255,255,0.7))",
                      lineHeight: 1.5,
                    }}
                  >
                    {e}
                  </span>
                </div>
              ))}
            </div>

            {/* Strategy */}
            <div
              style={{
                borderLeft: "3px solid var(--accent, #e8430a)",
                background: "rgba(232, 67, 10, 0.04)",
                borderRadius: "0 10px 10px 0",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--accent, #e8430a)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                Recommended Strategy
              </div>
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-secondary, rgba(255,255,255,0.7))",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {opp.strategy}
              </p>
            </div>

            {/* Revenue projection */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: "1px solid var(--card-edge, rgba(255,255,255,0.04))",
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-tertiary, rgba(255,255,255,0.4))",
                }}
              >
                Projected Revenue Impact
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--green, #30D158)",
                }}
              >
                +${opp.projected_monthly_revenue.toLocaleString()}/mo
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
