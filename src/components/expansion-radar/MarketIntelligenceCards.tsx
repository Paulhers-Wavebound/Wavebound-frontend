import { useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { countryFlag, formatNumber, formatDollar } from "./utils";
import type { EnrichedOpportunity, EvidenceItem } from "./types";
import type { EnrichedMarketIntel } from "./useMarketIntelligence";
import EvidenceWall from "./EvidenceWall";

interface MarketIntelligenceCardsProps {
  opportunities: EnrichedOpportunity[];
  artistName: string;
  marketIntel?: Map<string, EnrichedMarketIntel>;
  marketEvidence?: Record<string, EvidenceItem[]>;
}

function ConfidenceMeter({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background:
              i < count
                ? count >= 5
                  ? "#34d399"
                  : count >= 3
                    ? "#f59e0b"
                    : "rgba(255,255,255,0.25)"
                : "rgba(255,255,255,0.08)",
            transition: "background 0.3s",
          }}
        />
      ))}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          color:
            count >= 5
              ? "#34d399"
              : count >= 3
                ? "#f59e0b"
                : "var(--ink-tertiary)",
          marginLeft: 4,
        }}
      >
        {count >= 5
          ? "Very High"
          : count >= 3
            ? "High"
            : count >= 2
              ? "Medium"
              : "Early"}
      </span>
    </div>
  );
}

function confidenceColor(c: string): string {
  return c === "high"
    ? "#34d399"
    : c === "medium"
      ? "#f59e0b"
      : "var(--ink-tertiary)";
}

function ScoreBar({
  chartScore,
  rosterScore,
}: {
  chartScore: number;
  rosterScore: number;
}) {
  const total = chartScore + rosterScore;
  if (total === 0) return null;
  const chartPct = (chartScore / total) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${chartPct}%`,
            background: "rgba(255,255,255,0.20)",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          style={{
            flex: 1,
            background: "rgba(232,67,10,0.5)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          color: "var(--ink-tertiary)",
        }}
      >
        <span>Chart {Math.round(chartPct)}%</span>
        <span style={{ color: "rgba(232,67,10,0.8)" }}>
          Roster {Math.round(100 - chartPct)}%
        </span>
      </div>
    </div>
  );
}

export default function MarketIntelligenceCards({
  opportunities,
  artistName,
  marketIntel,
  marketEvidence,
}: MarketIntelligenceCardsProps) {
  const [drawerCountry, setDrawerCountry] = useState<string | null>(null);

  const top6 = [...opportunities]
    .sort((a, b) => b.enriched_score - a.enriched_score)
    .slice(0, 6);

  if (top6.length === 0) return null;

  const drawerOpp = drawerCountry
    ? opportunities.find((o) => o.country_code === drawerCountry) || null
    : null;

  return (
    <>
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
            Expansion Intelligence — {artistName}
          </span>
        </div>

        <div
          className="er-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {top6.map((opp, i) => {
            const chartContribution = Math.round(opp.opportunity_score * 0.5);
            const rosterContribution = opp.enriched_score - chartContribution;
            const intel = marketIntel?.get(opp.country_code);

            return (
              <motion.div
                key={opp.country_code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${opp.enriched_urgency === "act_now" ? "rgba(232,67,10,0.3)" : "var(--border)"}`,
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onClick={() => setDrawerCountry(opp.country_code)}
                whileHover={{
                  borderColor: "rgba(232,67,10,0.4)",
                  transition: { duration: 0.15 },
                }}
              >
                {/* Header: Flag + Name + Score */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>
                        {countryFlag(opp.country_code)}
                      </span>
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {opp.country_name}
                      </span>
                    </div>
                    {opp.enriched_urgency === "act_now" && (
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 9,
                          fontWeight: 600,
                          color: "#e8430a",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          background: "rgba(232,67,10,0.1)",
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}
                      >
                        Act Now
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 28,
                        fontWeight: 700,
                        color:
                          opp.enriched_score >= 50
                            ? "#34d399"
                            : opp.enriched_score >= 30
                              ? "#f59e0b"
                              : "var(--ink)",
                        lineHeight: 1,
                      }}
                    >
                      {opp.enriched_score}
                    </div>
                    <div
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9,
                        color: "var(--ink-tertiary)",
                        marginTop: 2,
                      }}
                    >
                      was {opp.opportunity_score}
                    </div>
                  </div>
                </div>

                {/* Confidence meter */}
                <ConfidenceMeter count={opp.signal_convergence} />

                {/* Evidence bullets */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  {opp.evidence_items.slice(0, 4).map((ev, j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: confidenceColor(ev.confidence),
                          marginTop: 5,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 12,
                          color: "var(--ink-secondary)",
                          lineHeight: 1.4,
                        }}
                      >
                        {ev.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Score breakdown bar */}
                <ScoreBar
                  chartScore={chartContribution}
                  rosterScore={rosterContribution}
                />

                {/* Revenue estimate */}
                {opp.estimated_revenue_monthly > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    <span>Est. monthly</span>
                    <span style={{ color: "var(--ink-secondary)" }}>
                      {formatDollar(opp.estimated_revenue_monthly)}
                    </span>
                  </div>
                )}

                {/* View evidence link */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: "rgba(232,67,10,0.7)",
                    marginTop: "auto",
                  }}
                >
                  <Eye size={11} />
                  <span>View Full Evidence</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Evidence Wall Drawer */}
      <EvidenceWall
        opportunity={drawerOpp}
        evidence={drawerCountry ? marketEvidence?.[drawerCountry] || [] : []}
        marketIntel={
          drawerCountry ? marketIntel?.get(drawerCountry) : undefined
        }
        onClose={() => setDrawerCountry(null)}
      />
    </>
  );
}
