import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  countryFlag,
  velocityArrow,
  velocityColor,
  formatNumber,
  formatDollar,
} from "./utils";
import type {
  ExpansionRadarResponse,
  Velocity,
  ActiveMarket,
  MarketIntelligence,
  ArbitrageAction,
} from "./types";
import type { EnrichedMarketIntel } from "./useMarketIntelligence";
import { deriveAction, ACTION_CONFIG } from "./useMarketIntelligence";

// ── Types ────────────────────────────────────────────────────────

type SortMode = "opportunity" | "signal" | "roi";

interface MarketHeatGridProps {
  heatData: ExpansionRadarResponse["market_heat"];
  opportunities: ExpansionRadarResponse["expansion_opportunities"];
  activeMarkets: ActiveMarket[];
  artistName: string;
  marketIntel: Map<string, EnrichedMarketIntel>;
}

// ── Small sub-components ─────────────────────────────────────────

function HealthBar({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = pct >= 70 ? "#e8430a" : pct >= 40 ? "#f59e0b" : "#6366f1";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 50,
          height: 5,
          background: "var(--bg)",
          borderRadius: 3,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 400ms ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: "var(--ink-secondary)",
          width: 24,
        }}
      >
        {Math.round(score)}
      </span>
    </div>
  );
}

function ActionBadge({ action }: { action: ArbitrageAction }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: cfg.color,
        background: cfg.bg,
        padding: "3px 8px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function RoiBadge({ roi }: { roi: number }) {
  const color =
    roi >= 2.5 ? "#34d399" : roi >= 1.5 ? "#f59e0b" : "rgba(255,255,255,0.45)";
  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12,
        fontWeight: 600,
        color,
      }}
    >
      {roi.toFixed(1)}×
    </span>
  );
}

// ── Sort pill control ────────────────────────────────────────────

function SortPills({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (m: SortMode) => void;
}) {
  const opts: { key: SortMode; label: string }[] = [
    { key: "opportunity", label: "Opportunity" },
    { key: "signal", label: "Signal" },
    { key: "roi", label: "ROI" },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          color: "var(--ink-tertiary)",
          alignSelf: "center",
          marginRight: 4,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Sort
      </span>
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: value === o.key ? 600 : 400,
            color: value === o.key ? "var(--accent)" : "var(--ink-tertiary)",
            background:
              value === o.key
                ? "rgba(232,67,10,0.12)"
                : "rgba(255,255,255,0.04)",
            border:
              value === o.key
                ? "1px solid rgba(232,67,10,0.25)"
                : "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 10px",
            cursor: "pointer",
            transition: "all 150ms",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── "Why This Market" expandable ─────────────────────────────────

function WhyThisMarket({
  intel,
  opp,
  activeMarket,
  artistName,
}: {
  intel: EnrichedMarketIntel | undefined;
  opp:
    | ExpansionRadarResponse["expansion_opportunities"][number]
    | ActiveMarket
    | undefined;
  activeMarket: ActiveMarket | undefined;
  artistName: string;
}) {
  const navigate = useNavigate();

  if (!intel)
    return (
      <div
        style={{
          padding: "12px 16px 16px 44px",
          background: "var(--bg)",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "var(--ink-tertiary)",
        }}
      >
        No market intelligence data for this country.
      </div>
    );

  const songCount = opp?.entry_song ? 1 : 0;
  const reach = Math.round((500 / intel.avg_cpm_blended) * 1000);

  const recommendation = (() => {
    if (intel.roi_vs_us > 2 && (songCount > 0 || activeMarket)) {
      const trending = activeMarket
        ? "organic streaming presence"
        : `${songCount} trending song${songCount !== 1 ? "s" : ""}`;
      return `Run a $500 ${intel.top_platform === "tiktok" ? "TikTok" : "social"} test campaign targeting ${intel.country_name}. At $${intel.avg_cpm_blended.toFixed(2)} CPM you'll reach ${reach.toLocaleString()} fans. Your ${trending} give${songCount === 1 || activeMarket ? "s" : ""} you organic momentum to amplify.`;
    }
    if (intel.roi_vs_us > 2) {
      return `Emerging opportunity. $${intel.avg_cpm_blended.toFixed(2)} CPM means ${intel.roi_vs_us}× the reach per dollar vs US. Start with playlist pitching and monitor for organic traction.`;
    }
    return `Established market. Focus on optimizing existing campaigns rather than expanding spend. Consider retargeting engaged fans.`;
  })();

  return (
    <div style={{ padding: "16px 20px 20px 44px", background: "var(--bg)" }}>
      {/* Two-column layout */}
      <div
        className="er-why-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 16,
        }}
      >
        {/* Left: Your Signal */}
        <div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            📊 Your Signal
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-secondary)",
              lineHeight: 1.5,
            }}
          >
            {activeMarket && (
              <span>
                • Active market — position #{activeMarket.best_position}
              </span>
            )}
            {opp?.entry_song && (
              <span>
                • Entry song: {opp.entry_song.name} (score{" "}
                {opp.entry_song.score})
              </span>
            )}
            {opp && (
              <span>
                • Platform to activate: {opp.platform_to_activate_first}
              </span>
            )}
            {opp?.spillover_from && (
              <span>
                • Spillover from {opp.spillover_from.market_name} (
                {opp.spillover_from.probability}% confidence)
              </span>
            )}
            {!activeMarket && !opp?.entry_song && !opp?.spillover_from && (
              <span style={{ color: "var(--ink-tertiary)" }}>
                • No direct streaming presence yet
              </span>
            )}
          </div>
        </div>

        {/* Right: The Opportunity */}
        <div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 600,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            💰 The Opportunity
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 20px",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-secondary)",
              lineHeight: 1.5,
            }}
          >
            <span>
              CPM:{" "}
              <b style={{ color: "var(--ink)" }}>
                ${intel.avg_cpm_blended.toFixed(2)}
              </b>
            </span>
            <span>
              Merch:{" "}
              <b style={{ color: "var(--ink)" }}>
                {intel.merch_enthusiasm_index}/100
              </b>
            </span>
            <span>
              Live:{" "}
              <b style={{ color: "var(--ink)" }}>
                {intel.live_attendance_index}/100
              </b>
            </span>
            <span>
              Ticket:{" "}
              <b style={{ color: "var(--ink)" }}>
                {formatDollar(intel.avg_ticket_price_usd)}
              </b>
            </span>
            <span>
              YoY growth:{" "}
              <b
                style={{
                  color:
                    intel.yoy_streaming_growth > 15 ? "#34d399" : "var(--ink)",
                }}
              >
                +{intel.yoy_streaming_growth}%
              </b>
            </span>
            <span>
              Internet:{" "}
              <b style={{ color: "var(--ink)" }}>
                {intel.internet_penetration}%
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div
        style={{
          background: "rgba(232,67,10,0.06)",
          border: "1px solid rgba(232,67,10,0.12)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            fontWeight: 600,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          🎯 Recommendation
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink)",
            lineHeight: 1.55,
            fontStyle: "italic",
          }}
        >
          "{recommendation}"
        </div>
      </div>

      {/* Navigate to The Pulse */}
      <button
        onClick={() =>
          navigate(
            `/label/admin/pulse?mode=arbitrage&country=${intel.country_code}`,
          )
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 500,
          color: "var(--accent)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        Open in The Pulse <ExternalLink size={12} />
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function MarketHeatGrid({
  heatData,
  opportunities,
  activeMarkets,
  artistName,
  marketIntel,
}: MarketHeatGridProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("opportunity");

  const oppMap = useMemo(
    () => new Map(opportunities.map((o) => [o.country_code, o])),
    [opportunities],
  );
  const activeMap = useMemo(
    () => new Map(activeMarkets.map((m) => [m.country_code, m])),
    [activeMarkets],
  );

  // Merge all markets from heat data (includes both present + non-present)
  const rows = useMemo(() => {
    const sorted = [...heatData].sort((a, b) => {
      const intelA = marketIntel.get(a.country_code);
      const intelB = marketIntel.get(b.country_code);
      const roiA = intelA?.roi_vs_us ?? 1;
      const roiB = intelB?.roi_vs_us ?? 1;

      switch (sortMode) {
        case "signal":
          return b.signal_score - a.signal_score;
        case "roi":
          return roiB - roiA;
        case "opportunity":
        default:
          // Composite: signal × arbitrage
          return b.signal_score * roiB - a.signal_score * roiA;
      }
    });
    return sorted.slice(0, 30);
  }, [heatData, marketIntel, sortMode]);

  if (rows.length === 0) return null;

  const headers = [
    "Country",
    "Status",
    "Velocity",
    "Signal",
    "Health",
    "ROI vs US",
    "Action",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            Market Heat Grid
          </span>
        </div>
        <SortPills value={sortMode} onChange={setSortMode} />
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
        Cross-platform signal strength enriched with market arbitrage
        intelligence. Click any row for the full expansion case.
      </p>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table
          className="er-heat-grid"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {headers.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 12px",
                    textAlign:
                      h === "Country" || h === "Status" ? "left" : "center",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--ink-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const expanded = expandedRow === row.country_code;
              const opp = oppMap.get(row.country_code);
              const active = activeMap.get(row.country_code);
              const intel = marketIntel.get(row.country_code);
              const vel = (row.velocity || "stable") as Velocity;
              const roi = intel?.roi_vs_us ?? 1;
              const action = deriveAction(
                row.signal_score,
                intel?.arbitrage_score ?? 1,
                row.country_code,
              );

              // Background intensity based on composite score
              const composite =
                (row.signal_score / 100) * (Math.min(roi, 4) / 4);
              const healthAlpha = Math.min(composite * 0.12, 0.1);

              return (
                <motion.tbody
                  key={row.country_code}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.02 * i }}
                  style={{ display: "contents" }}
                >
                  <tr
                    onClick={() =>
                      setExpandedRow(expanded ? null : row.country_code)
                    }
                    style={{
                      cursor: "pointer",
                      borderBottom: expanded
                        ? "none"
                        : "1px solid var(--border)",
                      transition: "background 150ms",
                      background: `rgba(232,67,10,${healthAlpha})`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `rgba(232,67,10,${healthAlpha + 0.04})`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `rgba(232,67,10,${healthAlpha})`;
                    }}
                  >
                    {/* Country */}
                    <td style={{ padding: "10px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <ChevronDown
                          size={12}
                          style={{
                            color: "var(--ink-tertiary)",
                            transform: expanded
                              ? "rotate(180deg)"
                              : "rotate(0)",
                            transition: "transform 200ms",
                          }}
                        />
                        <span style={{ fontSize: 14 }}>
                          {countryFlag(row.country_code)}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--ink)",
                          }}
                        >
                          {row.country_name}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          fontWeight: 500,
                          color: row.is_present
                            ? "#34d399"
                            : "var(--ink-tertiary)",
                          background: row.is_present
                            ? "rgba(52,211,153,0.12)"
                            : "rgba(255,255,255,0.04)",
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}
                      >
                        {row.is_present ? "ACTIVE" : "NEW"}
                      </span>
                    </td>

                    {/* Velocity */}
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 13,
                          fontWeight: 700,
                          color: velocityColor(vel),
                        }}
                      >
                        {velocityArrow(vel)}
                      </span>
                    </td>

                    {/* Signal score */}
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <HealthBar score={row.signal_score} />
                    </td>

                    {/* Health score */}
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <HealthBar score={row.market_health_score} />
                    </td>

                    {/* ROI vs US */}
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {intel ? (
                        <RoiBadge roi={roi} />
                      ) : (
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {intel ? (
                        <ActionBadge action={action} />
                      ) : (
                        <span
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 10,
                            color: "var(--ink-tertiary)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded: Why This Market */}
                  <AnimatePresence>
                    {expanded && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            padding: 0,
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}
                          >
                            <WhyThisMarket
                              intel={intel}
                              opp={opp ?? active}
                              activeMarket={active}
                              artistName={artistName}
                            />
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </motion.tbody>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 10,
          padding: "0 4px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
          }}
        >
          Background intensity = signal × arbitrage composite
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
            marginLeft: "auto",
          }}
        >
          Click rows to see expansion case
        </span>
      </div>
    </motion.div>
  );
}
