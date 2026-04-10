import { motion } from "framer-motion";
import { countryFlag } from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface SpilloverTimelineProps {
  predictions: ExpansionRadarResponse["spillover_predictions"];
  activeMarketCodes: Set<string>;
}

function ConfidenceBadge({ pct }: { pct: number }) {
  const color =
    pct > 70 ? "#34d399" : pct > 40 ? "#f59e0b" : "rgba(255,255,255,0.35)";
  const bg =
    pct > 70
      ? "rgba(52,211,153,0.12)"
      : pct > 40
        ? "rgba(245,158,11,0.12)"
        : "rgba(255,255,255,0.06)";
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        fontWeight: 600,
        color,
        background: bg,
        padding: "2px 6px",
        borderRadius: 3,
      }}
    >
      {pct}%
    </span>
  );
}

export default function SpilloverTimeline({
  predictions,
  activeMarketCodes,
}: SpilloverTimelineProps) {
  // Only show predictions where from_market is active for this artist
  const relevant = predictions
    .filter((p) => activeMarketCodes.has(p.from_market))
    .sort((a, b) => b.probability_pct - a.probability_pct);

  if (relevant.length === 0) return null;

  // Group by source market to build cascades
  const cascades = new Map<string, typeof relevant>();
  for (const pred of relevant) {
    const key = pred.from_market;
    const existing = cascades.get(key);
    if (!existing) {
      cascades.set(key, [pred]);
    } else {
      existing.push(pred);
    }
  }

  // Sort cascades by highest probability first
  const sortedCascades = [...cascades.entries()]
    .map(([source, preds]) => ({
      source,
      sourceName: preds[0].from_market_name,
      predictions: preds
        .sort((a, b) => b.probability_pct - a.probability_pct)
        .slice(0, 4),
    }))
    .sort(
      (a, b) =>
        b.predictions[0].probability_pct - a.predictions[0].probability_pct,
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
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
          Spillover Timeline
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
            marginLeft: "auto",
          }}
        >
          Predicted market cascade
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
        Based on historical patterns, these markets are likely to activate next
        from existing strongholds.
      </p>

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
            flexDirection: "column",
            gap: 20,
          }}
        >
          {sortedCascades.map((cascade, ci) => (
            <motion.div
              key={cascade.source}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * ci }}
            >
              {/* Cascade flow */}
              <div
                className="er-spillover-flow"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  flexWrap: "wrap",
                }}
              >
                {/* Source market (checkmark = active) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    {countryFlag(cascade.source)}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#34d399",
                    }}
                  >
                    {cascade.sourceName}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#34d399",
                    }}
                  >
                    {"\u2713"}
                  </span>
                </div>

                {/* Predictions chain */}
                {cascade.predictions.map((pred, pi) => (
                  <div
                    key={pred.to_market}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                    }}
                  >
                    {/* Arrow connector */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 8px",
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      <svg
                        width="32"
                        height="16"
                        viewBox="0 0 32 16"
                        fill="none"
                      >
                        <line
                          x1="0"
                          y1="8"
                          x2="24"
                          y2="8"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="1"
                          strokeDasharray="3,2"
                        />
                        <path
                          d="M22 4L28 8L22 12"
                          fill="none"
                          stroke="rgba(255,255,255,0.25)"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>

                    {/* Target market */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        background: "var(--bg)",
                        border: `1px ${pred.probability_pct > 70 ? "solid" : pred.probability_pct > 40 ? "dashed" : "dotted"} var(--border)`,
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {countryFlag(pred.to_market)}
                      </span>
                      <div>
                        <div
                          style={{
                            fontFamily: '"DM Sans", sans-serif',
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--ink)",
                          }}
                        >
                          {pred.to_market_name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          <ConfidenceBadge pct={pred.probability_pct} />
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 10,
                              color: "var(--ink-tertiary)",
                            }}
                          >
                            ~{pred.median_days}d
                          </span>
                          {pred.region_cluster && (
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: 9,
                                color: "var(--ink-tertiary)",
                                background: "var(--bg)",
                                padding: "1px 4px",
                                borderRadius: 2,
                              }}
                            >
                              {pred.region_cluster}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Separator between cascades */}
              {ci < sortedCascades.length - 1 && (
                <div
                  style={{
                    height: 1,
                    background: "var(--border)",
                    marginTop: 20,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
