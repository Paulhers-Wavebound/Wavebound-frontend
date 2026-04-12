import { useMemo, useState } from "react";
import type {
  BriefingData,
  MarketOpportunityV2,
  MarketIntelligence,
} from "@/types/artistBriefing";
import { URGENCY_CONFIG } from "@/types/artistBriefing";

// ─── Helpers ─────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────

interface CompactOpportunity {
  type: "strike_now" | "test" | "reallocate" | "defend" | "explore";
  countryCode: string;
  score: number;
  why: string;
  urgency: string | null;
  entrySong: string | null;
  velocity: string | null;
  discoverySignal: string | null;
}

function assembleCompactOpportunities(
  data: BriefingData,
): CompactOpportunity[] {
  const { marketsV2 } = data;

  const actionable = marketsV2
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

  return actionable.slice(0, 8).map((market) => {
    let type: CompactOpportunity["type"] = "explore";
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
    }

    // Build why
    const whyParts: string[] = [];
    if (
      market.discovery_signal_type === "pre_breakout" ||
      market.discovery_signal_type === "early_demand"
    ) {
      whyParts.push("Discovery signals detected");
    }
    if (market.velocity === "surging" || market.velocity === "rising") {
      whyParts.push(
        `Charts ${market.velocity}${market.position_delta_7d ? ` (${Math.abs(market.position_delta_7d)} positions)` : ""}`,
      );
    }
    if (market.entry_song_name) {
      whyParts.push(`via "${market.entry_song_name}"`);
    }
    if (whyParts.length === 0) {
      whyParts.push(`Score ${market.opportunity_score}/100`);
    }

    return {
      type,
      countryCode: market.country_code,
      score: market.opportunity_score,
      why: whyParts.join(" · "),
      urgency: market.urgency,
      entrySong: market.entry_song_name,
      velocity: market.velocity,
      discoverySignal: market.discovery_signal_type,
    };
  });
}

// ─── Opportunity Row ─────────────────────────────────────────────

function OpportunityRow({ opp }: { opp: CompactOpportunity }) {
  const typeConfig = URGENCY_CONFIG[opp.type] ?? URGENCY_CONFIG.explore;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
      }}
    >
      {/* Flag */}
      <span style={{ fontSize: 14, width: 22, flexShrink: 0 }}>
        {countryFlag(opp.countryCode)}
      </span>

      {/* Country */}
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.87)",
          width: 90,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {countryName(opp.countryCode)}
      </span>

      {/* Type badge */}
      <span
        style={{
          display: "inline-flex",
          padding: "2px 7px",
          borderRadius: 6,
          background: typeConfig.bg,
          color: typeConfig.color,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.3px",
          flexShrink: 0,
        }}
      >
        {typeConfig.label}
      </span>

      {/* Why */}
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {opp.why}
      </span>

      {/* Score */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
          width: 28,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {opp.score}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

interface TopOpportunitiesProps {
  data: BriefingData;
}

export default function TopOpportunities({ data }: TopOpportunitiesProps) {
  const [expanded, setExpanded] = useState(false);
  const opportunities = useMemo(
    () => assembleCompactOpportunities(data),
    [data],
  );

  const visible = expanded ? opportunities : opportunities.slice(0, 3);
  const hiddenCount = opportunities.length - 3;

  if (opportunities.length === 0) {
    return (
      <div
        style={{
          background: "#1C1C1E",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 20px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "rgba(255,255,255,0.30)",
          }}
        >
          No actionable opportunities right now
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1C1C1E",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "1px",
          }}
        >
          OPPORTUNITIES
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          by impact
        </span>
      </div>

      {/* Rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {visible.map((opp) => (
          <OpportunityRow key={opp.countryCode} opp={opp} />
        ))}
      </div>

      {/* Expand */}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "8px 0",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "rgba(255,255,255,0.40)",
            cursor: "pointer",
          }}
        >
          + {hiddenCount} more markets
        </button>
      )}
    </div>
  );
}
