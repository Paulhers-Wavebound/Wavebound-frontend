import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { formatNumber, countryFlag } from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface ComparableOverlayProps {
  artist: ExpansionRadarResponse["artist"];
  comparables: ExpansionRadarResponse["comparable_artists"];
}

export default function ComparableOverlay({
  artist,
  comparables,
}: ComparableOverlayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (comparables.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
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
          Comparable Artists
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
            marginLeft: "auto",
          }}
        >
          Market overlap analysis
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
        These {comparables.length} artists share a similar global audience size.
        Their unique markets reveal where {artist.name}&apos;s music would
        likely perform.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {comparables.map((comp, i) => {
          const isExpanded = expandedId === comp.entity_id;
          const uniqueCount = comp.unique_markets.length;

          return (
            <motion.div
              key={comp.entity_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                {comp.name}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink-secondary)",
                    }}
                  >
                    {comp.markets_reached}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 10,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    markets
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "var(--border)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#34d399",
                    }}
                  >
                    {comp.common_markets}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 10,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    shared
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "var(--border)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13,
                      fontWeight: 500,
                      color:
                        uniqueCount > 0 ? "#e8430a" : "var(--ink-tertiary)",
                    }}
                  >
                    {uniqueCount}
                  </div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 10,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    unique
                  </div>
                </div>
              </div>

              {/* Unique markets highlight */}
              {uniqueCount > 0 && (
                <div
                  style={{
                    padding: "6px 10px",
                    background:
                      uniqueCount > 5 ? "rgba(232,67,10,0.06)" : "var(--bg)",
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : comp.entity_id)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      width: "100%",
                    }}
                  >
                    <ChevronDown
                      size={10}
                      style={{
                        color: "var(--ink-tertiary)",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 200ms",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 11,
                        fontWeight: 500,
                        color:
                          uniqueCount > 5
                            ? "var(--accent)"
                            : "var(--ink-secondary)",
                      }}
                    >
                      {uniqueCount} market
                      {uniqueCount !== 1 ? "s" : ""} you don&apos;t have
                    </span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                            paddingTop: 8,
                          }}
                        >
                          {comp.unique_market_names.map((name, mi) => (
                            <span
                              key={mi}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: 11,
                                color: "var(--ink-secondary)",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 4,
                                padding: "2px 6px",
                              }}
                            >
                              {comp.unique_markets[mi] && (
                                <span style={{ fontSize: 11 }}>
                                  {countryFlag(comp.unique_markets[mi])}
                                </span>
                              )}
                              {name}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
