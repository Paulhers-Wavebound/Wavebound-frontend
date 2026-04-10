import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { countryFlag, formatNumber, formatDollar } from "./utils";
import type { EnrichedOpportunity, EvidenceItem } from "./types";
import type { EnrichedMarketIntel } from "./useMarketIntelligence";

interface EvidenceWallProps {
  opportunity: EnrichedOpportunity | null;
  evidence: EvidenceItem[];
  marketIntel?: EnrichedMarketIntel;
  onClose: () => void;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 600,
          color: "var(--ink-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.10em",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function SignalRow({
  label,
  score,
  detail,
}: {
  label: string;
  score: number;
  detail?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          {label}
        </span>
        {detail && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "var(--ink-tertiary)",
              marginLeft: 8,
            }}
          >
            {detail}
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 60,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(score, 100)}%`,
              height: "100%",
              borderRadius: 2,
              background:
                score >= 60
                  ? "#34d399"
                  : score >= 30
                    ? "#f59e0b"
                    : "rgba(255,255,255,0.20)",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            fontWeight: 600,
            color:
              score >= 60
                ? "#34d399"
                : score >= 30
                  ? "#f59e0b"
                  : "var(--ink-tertiary)",
            width: 28,
            textAlign: "right",
          }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export default function EvidenceWall({
  opportunity: opp,
  evidence,
  marketIntel,
  onClose,
}: EvidenceWallProps) {
  return (
    <AnimatePresence>
      {opp && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 999,
            }}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 440,
              maxWidth: "90vw",
              background: "#0a0a0a",
              borderLeft: "1px solid var(--border)",
              zIndex: 1000,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: "#0a0a0a",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>
                  {countryFlag(opp.country_code)}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {opp.country_name}
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    Enriched Score: {opp.enriched_score} (was{" "}
                    {opp.opportunity_score})
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: 6,
                  padding: 6,
                  cursor: "pointer",
                  color: "var(--ink-secondary)",
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {/* Signal Scores */}
              <Section label="Signal Breakdown">
                <SignalRow
                  label="Audience Geo"
                  score={opp.audience_signal.score}
                  detail={
                    opp.audience_signal.tiktok_pct
                      ? `${opp.audience_signal.tiktok_pct.toFixed(1)}% TikTok`
                      : undefined
                  }
                />
                <SignalRow
                  label="Language"
                  score={opp.language_signal.score}
                  detail={
                    opp.language_signal.languages.length > 0
                      ? opp.language_signal.languages.join(", ")
                      : undefined
                  }
                />
                <SignalRow
                  label="Fan Intensity"
                  score={opp.fan_intensity.score}
                  detail={
                    opp.fan_intensity.energy > 0
                      ? `${opp.fan_intensity.vibe}`
                      : undefined
                  }
                />
                <SignalRow
                  label="Platform Fit"
                  score={opp.platform_signal.score}
                  detail={opp.platform_signal.dominant}
                />
                <SignalRow
                  label="Touring"
                  score={opp.touring_signal.score}
                  detail={opp.touring_signal.status.replace(/_/g, " ")}
                />
                <SignalRow
                  label="Playlist Reach"
                  score={opp.playlist_signal.score}
                  detail={opp.playlist_signal.reach_tier}
                />
                <SignalRow
                  label="Discovery"
                  score={opp.score_breakdown.discovery * 5}
                  detail={opp.discovery_signal_type || undefined}
                />
                <SignalRow
                  label="Spillover"
                  score={opp.score_breakdown.spillover * 6.67}
                  detail={
                    opp.spillover_from
                      ? `from ${opp.spillover_from.market_name}`
                      : undefined
                  }
                />
              </Section>

              {/* Evidence Items */}
              {evidence.length > 0 && (
                <Section label="Evidence">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {evidence.map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background:
                              ev.confidence === "high"
                                ? "#34d399"
                                : ev.confidence === "medium"
                                  ? "#f59e0b"
                                  : "rgba(255,255,255,0.20)",
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: 13,
                              color: "var(--ink)",
                              lineHeight: 1.4,
                            }}
                          >
                            {ev.text}
                          </div>
                          <div
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 10,
                              color: "var(--ink-tertiary)",
                              marginTop: 2,
                              textTransform: "uppercase",
                            }}
                          >
                            {ev.type.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Entry Song */}
              {opp.entry_song && (
                <Section label="Recommended Entry Song">
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {opp.entry_song.name}
                    </div>
                    <div
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "var(--ink-tertiary)",
                        marginTop: 4,
                      }}
                    >
                      Score: {opp.entry_song.score} &middot;{" "}
                      {opp.entry_song.velocity} &middot;{" "}
                      {opp.entry_song.adjacent_markets} adjacent markets
                    </div>
                  </div>
                </Section>
              )}

              {/* Market Economics */}
              {marketIntel && (
                <Section label="Market Economics">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {[
                      {
                        label: "CPM",
                        value: `$${marketIntel.avg_cpm_blended.toFixed(2)}`,
                      },
                      {
                        label: "Fan Value",
                        value: marketIntel.fan_value_index.toFixed(0),
                      },
                      {
                        label: "ROI vs US",
                        value: `${marketIntel.roi_vs_us?.toFixed(1) || "—"}x`,
                      },
                      {
                        label: "Est. Revenue",
                        value: formatDollar(opp.estimated_revenue_monthly),
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: 6,
                          padding: "8px 10px",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 9,
                            color: "var(--ink-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {stat.label}
                        </div>
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--ink)",
                            marginTop: 2,
                          }}
                        >
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
