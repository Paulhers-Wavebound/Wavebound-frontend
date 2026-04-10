import { useState } from "react";
import { motion } from "framer-motion";
import {
  formatNumber,
  countryFlag,
  velocityArrow,
  velocityColor,
  signalTypeBadge,
  platformColor,
} from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface StreamingVsSocialProps {
  activeMarkets: ExpansionRadarResponse["active_markets"];
  discoveryRadar: ExpansionRadarResponse["discovery_radar"];
  artistName: string;
}

type SortMode = "streams" | "velocity" | "discovery";

export default function StreamingVsSocial({
  activeMarkets,
  discoveryRadar,
  artistName,
}: StreamingVsSocialProps) {
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("streams");

  // Left panel: Market Momentum — sort active markets
  const allSortedMarkets = [...activeMarkets].sort((a, b) => {
    const streams = (m: (typeof activeMarkets)[number]) =>
      m.estimated_monthly_streams || m.chart_streams || 0;
    if (sortMode === "velocity")
      return (b.stream_pct_change_7d ?? 0) - (a.stream_pct_change_7d ?? 0);
    if (sortMode === "discovery")
      return (b.discovery_divergence ?? 0) - (a.discovery_divergence ?? 0);
    return streams(b) - streams(a);
  });
  const getStreams = (m: (typeof activeMarkets)[number]) =>
    m.estimated_monthly_streams || m.chart_streams || 0;
  const sortedMarkets = showAllMarkets
    ? allSortedMarkets
    : allSortedMarkets.slice(0, 10);
  const maxStreams = Math.max(...activeMarkets.map(getStreams), 1);

  // Right panel: Early Signal Radar — show all signals with positive divergence,
  // prioritise pre_breakout and early_demand but include discovery_only too
  const earlySignals = discoveryRadar
    .filter(
      (d) =>
        (d.divergence ?? 0) > 0 ||
        d.signal_type === "pre_breakout" ||
        d.signal_type === "early_demand",
    )
    .sort((a, b) => {
      // Pre-breakout first, then early_demand, then by divergence
      const priority: Record<string, number> = {
        pre_breakout: 3,
        early_demand: 2,
        discovery_only: 1,
      };
      const pa = priority[a.signal_type] ?? 0;
      const pb = priority[b.signal_type] ?? 0;
      if (pa !== pb) return pb - pa;
      return (b.divergence ?? 0) - (a.divergence ?? 0);
    });
  const allSignals = showAllSignals ? earlySignals : earlySignals.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Section label */}
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
          Market Intelligence
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
        Left: where {artistName} currently charts with momentum signals. Right:
        markets where discovery demand is forming ahead of streaming.
      </p>

      {/* Two columns */}
      <div
        className="er-two-col"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
      >
        {/* LEFT — Market Momentum */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: "#34d399",
              }}
            />
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                fontWeight: 600,
                color: "#34d399",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Market Momentum
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-tertiary)",
                marginLeft: "auto",
              }}
            >
              Active presence
            </span>
          </div>

          {/* Sort toggles */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["streams", "velocity", "discovery"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                style={{
                  background:
                    sortMode === mode ? "rgba(52,211,153,0.12)" : "transparent",
                  border: `1px solid ${sortMode === mode ? "rgba(52,211,153,0.3)" : "var(--border)"}`,
                  borderRadius: 4,
                  padding: "3px 8px",
                  cursor: "pointer",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: sortMode === mode ? "#34d399" : "var(--ink-tertiary)",
                  textTransform: "uppercase",
                }}
              >
                {mode === "streams"
                  ? "By Streams"
                  : mode === "velocity"
                    ? "By Velocity"
                    : "By Discovery Gap"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sortedMarkets.map((market, i) => {
              const vArrow = velocityArrow(market.velocity);
              const vColor = velocityColor(market.velocity);
              const delta7d = market.stream_pct_change_7d ?? 0;
              return (
                <motion.div
                  key={market.country_code}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 34,
                  }}
                >
                  <span
                    style={{ fontSize: 14, width: 22, textAlign: "center" }}
                  >
                    {countryFlag(market.country_code)}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      color: "var(--ink-secondary)",
                      width: 90,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {market.country_name}
                  </span>
                  {/* Velocity badge */}
                  <span
                    title={`${market.velocity} \u00b7 ${delta7d >= 0 ? "+" : ""}${delta7d.toFixed(0)}% 7d`}
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      fontWeight: 600,
                      color: vColor,
                      width: 16,
                      textAlign: "center",
                    }}
                  >
                    {vArrow}
                  </span>
                  {/* Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "var(--bg)",
                      borderRadius: 3,
                    }}
                  >
                    <div
                      style={{
                        width: `${(getStreams(market) / maxStreams) * 100}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, rgba(52,211,153,0.3) 0%, #34d399 100%)",
                        borderRadius: 3,
                        transition: "width 500ms ease",
                      }}
                    />
                  </div>
                  {/* 7d delta */}
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      fontWeight: 500,
                      color:
                        delta7d > 0
                          ? "#34d399"
                          : delta7d < 0
                            ? "#f59e0b"
                            : "var(--ink-tertiary)",
                      width: 40,
                      textAlign: "right",
                    }}
                  >
                    {delta7d > 0 ? "+" : ""}
                    {delta7d.toFixed(0)}%
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--ink)",
                      width: 50,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {formatNumber(getStreams(market))}
                  </span>
                </motion.div>
              );
            })}
            {sortedMarkets.length === 0 && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-tertiary)",
                }}
              >
                No active streaming data
              </div>
            )}
            {allSortedMarkets.length > 10 && (
              <button
                onClick={() => setShowAllMarkets(!showAllMarkets)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--accent)",
                  padding: "8px 0 0",
                  transition: "opacity 150ms",
                }}
              >
                {showAllMarkets
                  ? "Show top 10"
                  : `Show all ${allSortedMarkets.length} markets \u2192`}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Early Signal Radar */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: "#0A84FF",
              }}
            />
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                fontWeight: 600,
                color: "#0A84FF",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Early Signal Radar
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-tertiary)",
                marginLeft: "auto",
              }}
            >
              Discovery ahead of streaming
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allSignals.map((signal, i) => {
              const badge = signalTypeBadge(signal.signal_type);
              const maxDiv = Math.max(
                ...earlySignals.map((s) => Math.abs(s.divergence ?? 0)),
                1,
              );
              const divPct = Math.abs(signal.divergence ?? 0 ?? 0) / maxDiv;
              return (
                <motion.div
                  key={signal.country_code}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                  style={{
                    padding: "10px 12px",
                    background:
                      signal.signal_type === "pre_breakout"
                        ? "rgba(10,132,255,0.04)"
                        : "transparent",
                    border: `1px solid ${signal.signal_type === "pre_breakout" ? "rgba(10,132,255,0.15)" : "var(--border)"}`,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {countryFlag(signal.country_code)}
                    </span>
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink)",
                        flex: 1,
                      }}
                    >
                      {signal.country_name}
                    </span>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color: badge.color,
                        background: badge.bg,
                        padding: "2px 6px",
                        borderRadius: 3,
                        animation: badge.pulse
                          ? "preBreakoutBadgePulse 2s ease-in-out infinite"
                          : undefined,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Discovery vs Streaming divergence gauge */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        width: 52,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 9,
                          color: "#0A84FF",
                          letterSpacing: "0.04em",
                        }}
                      >
                        DISC
                      </span>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0A84FF",
                        }}
                      >
                        {signal.discovery_score}
                      </span>
                    </div>
                    {/* Divergence bar */}
                    <div style={{ flex: 1, position: "relative", height: 18 }}>
                      <div
                        style={{
                          position: "absolute",
                          top: 7,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "var(--bg)",
                          borderRadius: 2,
                        }}
                      />
                      {/* Gap highlight */}
                      <div
                        style={{
                          position: "absolute",
                          top: 5,
                          height: 8,
                          left: `${Math.min(signal.streaming_score, signal.discovery_score)}%`,
                          width: `${Math.abs(signal.divergence ?? 0)}%`,
                          background:
                            (signal.divergence ?? 0) > 0
                              ? "rgba(10,132,255,0.25)"
                              : "rgba(52,211,153,0.2)",
                          borderRadius: 2,
                          transition: "all 400ms ease",
                        }}
                      />
                      {/* Streaming marker */}
                      <div
                        style={{
                          position: "absolute",
                          top: 3,
                          left: `${signal.streaming_score}%`,
                          width: 3,
                          height: 12,
                          background: "#34d399",
                          borderRadius: 1,
                          transform: "translateX(-1px)",
                        }}
                      />
                      {/* Discovery marker */}
                      <div
                        style={{
                          position: "absolute",
                          top: 3,
                          left: `${signal.discovery_score}%`,
                          width: 3,
                          height: 12,
                          background: "#0A84FF",
                          borderRadius: 1,
                          transform: "translateX(-1px)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        width: 52,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 9,
                          color: "#34d399",
                          letterSpacing: "0.04em",
                        }}
                      >
                        STRM
                      </span>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#34d399",
                        }}
                      >
                        {signal.streaming_score}
                      </span>
                    </div>
                  </div>

                  {/* Platform count + divergence score */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
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
                      {signal.discovery_platform_count} discovery platform
                      {signal.discovery_platform_count !== 1 ? "s" : ""} firing
                    </span>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 10,
                        fontWeight: 600,
                        color:
                          (signal.divergence ?? 0) > 20
                            ? "#0A84FF"
                            : "var(--ink-tertiary)",
                        marginLeft: "auto",
                      }}
                    >
                      +{(signal.divergence ?? 0).toFixed(0)} gap
                    </span>
                  </div>
                </motion.div>
              );
            })}
            {allSignals.length === 0 && (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  color: "var(--ink-tertiary)",
                }}
              >
                No early signals detected
              </div>
            )}
            {earlySignals.length > 10 && (
              <button
                onClick={() => setShowAllSignals(!showAllSignals)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--accent)",
                  padding: "8px 0 0",
                }}
              >
                {showAllSignals
                  ? "Show top 10"
                  : `Show all ${earlySignals.length} signals \u2192`}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes preBreakoutBadgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </motion.div>
  );
}
