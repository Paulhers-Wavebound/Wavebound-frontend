import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Radio } from "lucide-react";
import { countryFlag } from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface Signal {
  id: string;
  timestamp: string;
  color: "red" | "orange" | "amber" | "blue" | "green";
  location: string;
  description: string;
}

const COLOR_MAP = {
  red: "#ef4444",
  orange: "#e8430a",
  amber: "#f59e0b",
  blue: "#0A84FF",
  green: "#34d399",
};

function deriveSignals(data: ExpansionRadarResponse): Signal[] {
  const signals: Signal[] = [];
  let id = 0;

  // Pre-breakout discovery signals (highest priority)
  for (const d of data.discovery_radar) {
    if (d.signal_type === "pre_breakout") {
      signals.push({
        id: String(++id),
        timestamp: "Live",
        color: "red",
        location: `${countryFlag(d.country_code)} ${d.country_name}`,
        description: `Pre-breakout detected \u2014 discovery score ${d.discovery_score} vs streaming ${d.streaming_score}. ${d.discovery_platform_count} discovery platform${d.discovery_platform_count !== 1 ? "s" : ""} firing ahead of streaming.`,
      });
    }
  }

  // Act-now urgency markets
  for (const opp of data.expansion_opportunities) {
    if (opp.urgency === "act_now") {
      signals.push({
        id: String(++id),
        timestamp: "Now",
        color: "orange",
        location: `${countryFlag(opp.country_code)} ${opp.country_name}`,
        description: `ACT NOW \u2014 opportunity score ${(opp.opportunity_score ?? 0).toFixed(0)}${opp.entry_song ? `. Push "${opp.entry_song.name}" on ${opp.platform_to_activate_first}` : ""}.`,
      });
    }
  }

  // Surging active markets
  for (const m of data.active_markets) {
    if (m.velocity === "surging") {
      signals.push({
        id: String(++id),
        timestamp: "7d trend",
        color: "green",
        location: `${countryFlag(m.country_code)} ${m.country_name}`,
        description: `Surging \u2014 streams up ${m.stream_pct_change_7d > 0 ? "+" : ""}${(m.stream_pct_change_7d ?? 0).toFixed(0)}% in 7 days. Position improved by ${Math.abs(m.position_delta_7d ?? 0)} spots.`,
      });
    }
  }

  // Early demand discovery signals
  for (const d of data.discovery_radar) {
    if (d.signal_type === "early_demand" && d.divergence > 15) {
      signals.push({
        id: String(++id),
        timestamp: "Live",
        color: "blue",
        location: `${countryFlag(d.country_code)} ${d.country_name}`,
        description: `Early demand forming \u2014 +${(d.divergence ?? 0).toFixed(0)} discovery-streaming gap. ${d.discovery_platform_count} platform${d.discovery_platform_count !== 1 ? "s" : ""} showing organic traction.`,
      });
    }
  }

  // High-confidence spillover predictions
  for (const s of data.spillover_predictions) {
    if (s.probability_pct > 70) {
      signals.push({
        id: String(++id),
        timestamp: `~${s.median_days}d`,
        color: "amber",
        location: `${countryFlag(s.from_market)} ${s.from_market_name} \u2192 ${countryFlag(s.to_market)} ${s.to_market_name}`,
        description: `Spillover predicted at ${s.probability_pct}% confidence. Based on ${s.sample_size} historical patterns${s.region_cluster ? ` in ${s.region_cluster}` : ""}.`,
      });
    }
  }

  // Declining active markets (warnings)
  for (const m of data.active_markets) {
    if (m.velocity === "declining" || m.velocity === "exiting") {
      signals.push({
        id: String(++id),
        timestamp: "7d trend",
        color: "amber",
        location: `${countryFlag(m.country_code)} ${m.country_name}`,
        description: `${m.velocity === "exiting" ? "Exiting" : "Declining"} \u2014 streams ${(m.stream_pct_change_7d ?? 0).toFixed(0)}% in 7 days. Position dropped ${Math.abs(m.position_delta_7d ?? 0)} spots.`,
      });
    }
  }

  return signals;
}

interface SignalFeedProps {
  data: ExpansionRadarResponse | null;
}

export default function SignalFeed({ data }: SignalFeedProps) {
  const [open, setOpen] = useState(false);

  const signals = useMemo(() => {
    if (!data) return [];
    return deriveSignals(data);
  }, [data]);

  const signalCount = signals.length;

  if (signalCount === 0) return null;

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "10px 16px",
          cursor: "pointer",
          zIndex: 40,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ink)",
          transition: "border-color 150ms",
        }}
        whileHover={{ y: -2 }}
      >
        <Radio size={16} style={{ color: "#e8430a" }} />
        <span>
          {signalCount} Signal{signalCount !== 1 ? "s" : ""}
        </span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#e8430a",
            animation: "signalPulse 2s ease-in-out infinite",
          }}
        />
      </motion.button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.3)",
                zIndex: 50,
              }}
            />

            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: 380,
                background: "var(--surface)",
                borderLeft: "1px solid var(--border)",
                zIndex: 51,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 20px 16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Radio size={16} style={{ color: "#e8430a" }} />
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    Signal Feed
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#e8430a",
                      background: "rgba(232,67,10,0.12)",
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    {signalCount}
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-tertiary)",
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Signals list */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {signals.map((signal, i) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: COLOR_MAP[signal.color],
                          flexShrink: 0,
                          boxShadow:
                            signal.color === "red"
                              ? `0 0 6px ${COLOR_MAP.red}`
                              : undefined,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--ink)",
                        }}
                      >
                        {signal.location}
                      </span>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: "var(--ink-tertiary)",
                          marginLeft: "auto",
                        }}
                      >
                        {signal.timestamp}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 12,
                        color: "var(--ink-secondary)",
                        margin: 0,
                        lineHeight: 1.5,
                        paddingLeft: 15,
                      }}
                    >
                      {signal.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: "var(--ink-tertiary)",
                    letterSpacing: "0.04em",
                  }}
                >
                  SIGNALS DERIVED FROM V2 EXPANSION DATA
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes signalPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </>
  );
}
