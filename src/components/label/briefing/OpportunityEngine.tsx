import { useMemo, useState } from "react";
import type {
  BriefingData,
  MarketOpportunityV2,
  MarketIntelligence,
  MarketSpillover,
} from "@/types/artistBriefing";
import { URGENCY_CONFIG } from "@/types/artistBriefing";
import {
  computeRoiVsUs,
  computeProjectedReach,
} from "@/utils/artistBriefingApi";
import { estimateOpportunityWindow } from "@/utils/briefingGenerator";

// ─── Helpers ───────────────────────────────────────────────────────

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(Math.round(n));
}

// ─── Opportunity Assembly ──────────────────────────────────────────

interface AssembledOpportunity {
  priority: number;
  type: "strike_now" | "test" | "reallocate" | "defend" | "explore";
  countryCode: string;
  market: MarketOpportunityV2;
  intel: MarketIntelligence | null;
  spilloverTargets: Array<{
    countryCode: string;
    probability: number;
    lagDays: number;
  }>;
  window: { days: number; urgency: "critical" | "high" | "medium" | "normal" };
  roiVsUs: number | null;
  projectedReach: number;
  suggestedBudget: number;
}

function assembleOpportunities(data: BriefingData): AssembledOpportunity[] {
  const { marketsV2, marketIntel, spillovers } = data;

  // Build lookup maps
  const intelByCountry = new Map<string, MarketIntelligence>();
  for (const mi of marketIntel) {
    intelByCountry.set(mi.country_code, mi);
  }

  const spilloverByFrom = new Map<string, MarketSpillover[]>();
  for (const sp of spillovers) {
    const existing = spilloverByFrom.get(sp.from_country) ?? [];
    existing.push(sp);
    spilloverByFrom.set(sp.from_country, existing);
  }

  // Filter to actionable markets
  const actionableMarkets = marketsV2
    .filter(
      (m) =>
        m.opportunity_score >= 30 &&
        (m.urgency === "act_now" ||
          m.urgency === "plan" ||
          m.velocity === "surging" ||
          m.velocity === "rising" ||
          m.discovery_signal_type === "pre_breakout" ||
          m.discovery_signal_type === "early_demand"),
    )
    .sort((a, b) => b.opportunity_score - a.opportunity_score);

  return actionableMarkets.slice(0, 8).map((market, i) => {
    const intel = intelByCountry.get(market.country_code) ?? null;
    const cpm = intel?.avg_cpm_tiktok ?? intel?.avg_cpm_blended ?? 5;
    const roiVsUs = computeRoiVsUs(cpm);

    // Suggest budget based on opportunity tier
    const suggestedBudget =
      market.opportunity_tier === "high"
        ? 500
        : market.opportunity_tier === "medium"
          ? 250
          : 100;

    const projectedReach = computeProjectedReach(suggestedBudget, cpm);

    // Get spillover targets from this market
    const spills = (spilloverByFrom.get(market.country_code) ?? [])
      .filter((s) => s.confidence_pct >= 20)
      .sort((a, b) => b.confidence_pct - a.confidence_pct)
      .slice(0, 3)
      .map((s) => ({
        countryCode: s.to_country,
        probability: s.confidence_pct,
        lagDays: s.median_lag_days,
      }));

    // Determine type
    let type: AssembledOpportunity["type"] = "explore";
    if (
      market.urgency === "act_now" &&
      (market.velocity === "surging" ||
        market.discovery_signal_type === "pre_breakout")
    ) {
      type = "strike_now";
    } else if (market.urgency === "act_now" || market.velocity === "rising") {
      type = "test";
    } else if (
      market.velocity === "declining" ||
      market.velocity === "exiting"
    ) {
      type = "defend";
    } else if (
      market.spillover_probability &&
      market.spillover_probability >= 50
    ) {
      type = "test";
    }

    // Window estimation
    const platformCount = market.platforms_charting ?? 1;
    const isDecelerating =
      market.velocity === "declining" || market.velocity === "exiting";
    const window = estimateOpportunityWindow(platformCount, isDecelerating);

    return {
      priority: i + 1,
      type,
      countryCode: market.country_code,
      market,
      intel,
      spilloverTargets: spills,
      window,
      roiVsUs,
      projectedReach,
      suggestedBudget,
    };
  });
}

// ─── Window Bar ────────────────────────────────────────────────────

function WindowBar({ days, urgency }: { days: number; urgency: string }) {
  const maxDays = 21;
  const pct = Math.min((days / maxDays) * 100, 100);
  const color =
    urgency === "critical"
      ? "#FF453A"
      : urgency === "high"
        ? "#FF9F0A"
        : urgency === "medium"
          ? "#FFD60A"
          : "#8E8E93";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          flexShrink: 0,
        }}
      >
        WINDOW:
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            transition: "width 800ms ease-out",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 600,
          color,
          flexShrink: 0,
        }}
      >
        ~{days} days remaining
      </span>
    </div>
  );
}

// ─── Opportunity Card ──────────────────────────────────────────────

function OpportunityCard({ opp }: { opp: AssembledOpportunity }) {
  const typeConfig = URGENCY_CONFIG[opp.type] ?? URGENCY_CONFIG.explore;
  const cName = countryName(opp.countryCode);
  const flag = countryFlag(opp.countryCode);
  const cpm = opp.intel?.avg_cpm_tiktok ?? opp.intel?.avg_cpm_blended ?? null;

  // Build the "why" text from market signals
  const whyParts: string[] = [];
  if (
    opp.market.discovery_signal_type === "pre_breakout" ||
    opp.market.discovery_signal_type === "early_demand"
  ) {
    whyParts.push(
      "Discovery signals detected — demand forming before streaming catches up.",
    );
  }
  if (opp.market.velocity === "surging" || opp.market.velocity === "rising") {
    whyParts.push(
      `Chart positions improving${opp.market.position_delta_7d ? ` (${Math.abs(opp.market.position_delta_7d)} positions up this week)` : ""}.`,
    );
  }
  if (opp.market.entry_song_name) {
    whyParts.push(
      `"${opp.market.entry_song_name}" is the entry point${opp.market.song_velocity ? ` (${opp.market.song_velocity})` : ""}.`,
    );
  }
  if (opp.market.spillover_source_market) {
    whyParts.push(
      `Spillover from ${countryName(opp.market.spillover_source_market)} (${Math.round(opp.market.spillover_probability ?? 0)}% historical probability).`,
    );
  }
  if (whyParts.length === 0) {
    whyParts.push(
      `High opportunity score (${opp.market.opportunity_score}/100) based on market size and growth signals.`,
    );
  }

  return (
    <div
      style={{
        background: "#2C2C2E",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Priority header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "1px",
            }}
          >
            PRIORITY {opp.priority}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 10px",
              borderRadius: 8,
              background: typeConfig.bg,
              color: typeConfig.color,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            {typeConfig.label}
          </span>
        </div>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {flag} {cName}
        </span>
      </div>

      <div style={{ padding: 20 }}>
        {/* WHY */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            WHY
          </span>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.7)",
              margin: "6px 0 0",
            }}
          >
            {whyParts.join(" ")}
          </p>
        </div>

        {/* THE PLAY */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            THE PLAY
          </span>
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {/* Budget */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Budget
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 20,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.87)",
                  marginTop: 2,
                }}
              >
                ${opp.suggestedBudget}
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                TikTok Spark Ads
              </div>
            </div>

            {/* Projected Reach */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 9,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Projected Reach
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 20,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.87)",
                  marginTop: 2,
                }}
              >
                {formatNumber(opp.projectedReach)}
              </div>
              {cpm != null && (
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  at ${cpm.toFixed(2)} CPM
                </div>
              )}
            </div>

            {/* ROI vs US */}
            {opp.roiVsUs != null && opp.roiVsUs > 1 && (
              <div
                style={{
                  background: "rgba(48,209,88,0.06)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: "1px solid rgba(48,209,88,0.12)",
                }}
              >
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 9,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  ROI vs US
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#30D158",
                    marginTop: 2,
                  }}
                >
                  {opp.roiVsUs}x
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  more fans per $
                </div>
              </div>
            )}

            {/* Revenue Estimate */}
            {opp.market.estimated_revenue_monthly != null &&
              opp.market.estimated_revenue_monthly > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                    }}
                  >
                    Est. Monthly Rev
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 20,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.87)",
                      marginTop: 2,
                    }}
                  >
                    ${formatNumber(opp.market.estimated_revenue_monthly)}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Spillover targets */}
        {opp.spilloverTargets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              SPILLOVER POTENTIAL
            </span>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {opp.spilloverTargets.map((sp) => (
                <div
                  key={sp.countryCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    background: "rgba(191,90,242,0.08)",
                    borderRadius: 8,
                    border: "1px solid rgba(191,90,242,0.12)",
                  }}
                >
                  <span style={{ fontSize: 12 }}>
                    {countryFlag(sp.countryCode)}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {countryName(sp.countryCode)}
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#BF5AF2",
                    }}
                  >
                    {sp.probability}%
                  </span>
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    ~{sp.lagDays}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Window bar */}
        <WindowBar days={opp.window.days} urgency={opp.window.urgency} />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export default function OpportunityEngine({ data }: { data: BriefingData }) {
  const opportunities = useMemo(() => assembleOpportunities(data), [data]);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? opportunities : opportunities.slice(0, 3);
  const hiddenCount = opportunities.length - 3;

  if (opportunities.length === 0) {
    return (
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          No actionable opportunities detected right now. Market data may still
          be loading.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 17,
            fontWeight: 600,
            color: "rgba(255,255,255,0.87)",
            margin: 0,
          }}
        >
          OPPORTUNITIES
        </h2>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Sorted by: Impact
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visible.map((opp) => (
          <OpportunityCard key={opp.countryCode} opp={opp} />
        ))}
      </div>

      {/* Show more */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            width: "100%",
            marginTop: 14,
            padding: "12px 0",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            cursor: "pointer",
          }}
        >
          + {hiddenCount} more opportunities
        </button>
      )}
    </div>
  );
}
