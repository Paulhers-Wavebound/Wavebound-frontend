import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Clock } from "lucide-react";
import {
  countryFlag,
  formatNumber,
  formatDollar,
  formatRevenue,
  perStreamRate,
  urgencyConfig,
  confidenceBorder,
  velocityArrow,
  velocityColor,
  platformColor,
} from "./utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ExpansionRadarResponse, Velocity } from "./types";
import type { EnrichedMarketIntel } from "./useMarketIntelligence";

interface ExpansionOpportunityCardsProps {
  opportunities: ExpansionRadarResponse["expansion_opportunities"];
  artistName: string;
  marketIntel?: Map<string, EnrichedMarketIntel>;
}

export default function ExpansionOpportunityCards({
  opportunities,
  artistName,
  marketIntel,
}: ExpansionOpportunityCardsProps) {
  const navigate = useNavigate();
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(
    null,
  );

  const top6 = [...opportunities]
    .sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0))
    .slice(0, 6);

  if (top6.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
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
          Top Expansion Opportunities
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
        Highest-confidence markets ranked by composite score. Includes entry
        song, spillover context, and revenue estimates.
      </p>

      <div
        className="er-two-col"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {top6.map((opp, i) => {
          const urg = urgencyConfig(opp.urgency);
          const confBorder = confidenceBorder(opp.window_confidence);
          const vel = opp.velocity as Velocity;
          const isExpanded = expandedBreakdown === opp.country_code;
          const rate = perStreamRate(opp.country_code);
          const intel = marketIntel?.get(opp.country_code);
          const roi = intel?.roi_vs_us;

          return (
            <motion.div
              key={opp.country_code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              whileHover={{ y: -2 }}
              style={{
                background: "var(--surface)",
                border: `1px ${confBorder} var(--border)`,
                borderTop: `2px solid ${urg.color}`,
                borderRadius: 12,
                padding: 20,
                cursor: "default",
                transition: "border-color 150ms",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 20 }}>
                    {countryFlag(opp.country_code)}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--ink)",
                    }}
                  >
                    {opp.country_name}
                  </span>
                  {/* Velocity */}
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      color: velocityColor(vel),
                    }}
                  >
                    {velocityArrow(vel)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {/* ROI badge */}
                  {roi != null && roi > 1 && (
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        color:
                          roi >= 2.5
                            ? "#34d399"
                            : roi >= 1.5
                              ? "#f59e0b"
                              : "rgba(255,255,255,0.45)",
                        background:
                          roi >= 2.5
                            ? "rgba(52,211,153,0.12)"
                            : roi >= 1.5
                              ? "rgba(245,158,11,0.10)"
                              : "rgba(255,255,255,0.04)",
                        padding: "3px 8px",
                        borderRadius: 3,
                      }}
                    >
                      {roi.toFixed(1)}× ROI
                    </span>
                  )}
                  {/* Urgency badge */}
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: urg.color,
                      background: urg.bg,
                      padding: "3px 8px",
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {opp.urgency === "act_now" && <Clock size={10} />}
                    {urg.label}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                      marginBottom: 2,
                    }}
                  >
                    Score
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    {(opp.opportunity_score ?? 0).toFixed(0)}
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 28,
                    background: "var(--border)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                      marginBottom: 2,
                    }}
                  >
                    Est. streams
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {formatNumber(opp.estimated_monthly_streams)}
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--ink-tertiary)",
                        fontWeight: 400,
                        marginLeft: 2,
                      }}
                    >
                      /mo
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 28,
                    background: "var(--border)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                      marginBottom: 2,
                    }}
                  >
                    Est. revenue
                  </div>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--ink)",
                            cursor: "help",
                            borderBottom: "1px dashed var(--border)",
                            display: "inline-block",
                          }}
                        >
                          {formatDollar(opp.estimated_revenue_monthly)}
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--ink-tertiary)",
                              fontWeight: 400,
                              marginLeft: 2,
                            }}
                          >
                            /mo
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" style={{ maxWidth: 240 }}>
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                          }}
                        >
                          {opp.country_name} rate: ${(rate ?? 0).toFixed(4)}
                          /stream
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 28,
                    background: "var(--border)",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                      marginBottom: 2,
                    }}
                  >
                    Confidence
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--ink-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    {opp.window_confidence}
                  </div>
                </div>
              </div>

              {/* Entry song recommendation */}
              {opp.entry_song && (
                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg)",
                    borderRadius: 8,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      color: "var(--ink-tertiary)",
                      letterSpacing: "0.06em",
                      flexShrink: 0,
                    }}
                  >
                    PUSH
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    &ldquo;{opp.entry_song.name}&rdquo;
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    on{" "}
                    <span
                      style={{
                        color: platformColor(opp.platform_to_activate_first),
                        fontWeight: 600,
                      }}
                    >
                      {opp.platform_to_activate_first}
                    </span>
                  </span>
                </div>
              )}

              {/* Spillover context */}
              {opp.spillover_from && (
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-tertiary)",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  Predicted from{" "}
                  <span
                    style={{ color: "var(--ink-secondary)", fontWeight: 500 }}
                  >
                    {opp.spillover_from.market_name}
                  </span>{" "}
                  entry ({opp.spillover_from.probability}% confidence
                  {opp.spillover_from.estimated_weeks
                    ? `, ~${opp.spillover_from.estimated_weeks} weeks`
                    : ""}
                  )
                </div>
              )}

              {/* Score breakdown toggle */}
              <button
                onClick={() =>
                  setExpandedBreakdown(isExpanded ? null : opp.country_code)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "var(--ink-tertiary)",
                  padding: "4px 0",
                  letterSpacing: "0.04em",
                }}
              >
                <ChevronDown
                  size={10}
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 200ms",
                  }}
                />
                SCORE BREAKDOWN
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 8,
                        paddingTop: 8,
                        borderTop: "1px solid var(--border)",
                        marginTop: 4,
                      }}
                    >
                      {(
                        [
                          ["Base", opp.score_breakdown.base],
                          ["Discovery", opp.score_breakdown.discovery],
                          ["Song", opp.score_breakdown.song],
                          ["Spillover", opp.score_breakdown.spillover],
                          ["Platform", opp.score_breakdown.platform_fit],
                          ["Velocity", opp.score_breakdown.velocity],
                        ] as [string, number][]
                      ).map(([label, val]) => (
                        <div key={label}>
                          <div
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 9,
                              color: "var(--ink-tertiary)",
                              letterSpacing: "0.04em",
                              marginBottom: 2,
                            }}
                          >
                            {label.toUpperCase()}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 4,
                                background: "var(--bg)",
                                borderRadius: 2,
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(val * 5, 100)}%`,
                                  height: "100%",
                                  background: "var(--accent)",
                                  borderRadius: 2,
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: '"JetBrains Mono", monospace',
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--ink-secondary)",
                                width: 20,
                                textAlign: "right",
                              }}
                            >
                              {(val ?? 0).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <button
                onClick={() =>
                  navigate("/label/assistant", {
                    state: {
                      prefill: `Create an expansion strategy for ${artistName} in ${opp.country_name}. The recommended entry song is "${opp.entry_song?.name ?? "TBD"}" on ${opp.platform_to_activate_first}. ${opp.spillover_from ? `This market is predicted to activate from ${opp.spillover_from.market_name} (${opp.spillover_from.probability}% confidence).` : ""} What content approach, local partnerships, playlist strategy, and timeline would you recommend?`,
                    },
                  })
                }
                style={{
                  marginTop: 12,
                  width: "100%",
                  padding: "8px 0",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--ink-secondary)",
                  transition: "all 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--ink-secondary)";
                }}
              >
                View Strategy &rarr;
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
