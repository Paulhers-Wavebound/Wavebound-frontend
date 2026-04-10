import { useState } from "react";
import type {
  MarketMapResponse,
  MarketEntry,
} from "@/types/artistIntelligence";
import InfoTooltip from "./InfoTooltip";

const STRENGTH_COLORS: Record<string, string> = {
  dominant: "#30D158",
  strong: "#0A84FF",
  medium: "#FFD60A",
  fringe: "#FF9F0A",
};

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  expand: { label: "Expand", color: "#BF5AF2", bg: "rgba(191,90,242,0.1)" },
  grow: { label: "Grow", color: "#30D158", bg: "rgba(48,209,88,0.1)" },
  push: { label: "Push", color: "#0A84FF", bg: "rgba(10,132,255,0.1)" },
  maintain: {
    label: "Maintain",
    color: "#8E8E93",
    bg: "rgba(142,142,147,0.1)",
  },
  monitor: {
    label: "Monitor",
    color: "var(--ink-tertiary)",
    bg: "rgba(255,255,255,0.03)",
  },
};

const OPP_TIER_COLORS: Record<string, string> = {
  high: "#30D158",
  medium: "#FFD60A",
  low: "#8E8E93",
  minimal: "var(--ink-tertiary)",
};

// Country code to flag emoji
function countryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

// Country code to name — uses browser Intl API for full ISO 3166-1 coverage
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function MarketRow({ market }: { market: MarketEntry }) {
  const action =
    ACTION_CONFIG[market.recommended_action] ?? ACTION_CONFIG.monitor;
  const strength = market.market_strength
    ? STRENGTH_COLORS[market.market_strength]
    : "var(--ink-tertiary)";
  const oppColor =
    OPP_TIER_COLORS[market.opportunity_tier] ?? OPP_TIER_COLORS.minimal;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Flag + name */}
      <span style={{ fontSize: 16, flexShrink: 0 }}>
        {countryFlag(market.country_code)}
      </span>
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ink)",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {countryName(market.country_code)}
      </span>

      {/* Strength indicator */}
      {market.market_strength && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: strength,
            flexShrink: 0,
          }}
          title={market.market_strength}
        />
      )}

      {/* Position */}
      {market.best_position != null && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "var(--ink-secondary)",
            width: 32,
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          #{market.best_position}
        </span>
      )}

      {/* Opportunity score */}
      <div
        style={{
          width: 48,
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${market.opportunity_score}%`,
              borderRadius: 2,
              background: oppColor,
            }}
          />
        </div>
      </div>

      {/* Action badge */}
      <span
        style={{
          display: "inline-flex",
          padding: "2px 8px",
          borderRadius: 10,
          background: action.bg,
          color: action.color,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          flexShrink: 0,
        }}
      >
        {action.label}
      </span>
    </div>
  );
}

type FilterAction = "all" | "expand" | "grow" | "push" | "maintain" | "monitor";

export default function GeoMarketMap({
  marketMap,
}: {
  marketMap: MarketMapResponse | null;
}) {
  const [filter, setFilter] = useState<FilterAction>("all");

  if (!marketMap) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-sm)",
          padding: "40px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
          }}
        >
          Geographic market data not yet available
        </div>
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? marketMap.markets
      : marketMap.markets.filter((m) => m.recommended_action === filter);

  const filterButtons: Array<{
    key: FilterAction;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: marketMap.markets.length },
    {
      key: "expand",
      label: "Expand",
      count: marketMap.markets.filter((m) => m.recommended_action === "expand")
        .length,
    },
    {
      key: "grow",
      label: "Grow",
      count: marketMap.markets.filter((m) => m.recommended_action === "grow")
        .length,
    },
    {
      key: "push",
      label: "Push",
      count: marketMap.markets.filter((m) => m.recommended_action === "push")
        .length,
    },
  ];

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Geographic Markets{" "}
          <InfoTooltip text="Market presence from cross-platform chart positions (Spotify, Apple Music, Shazam, YouTube). Strength = charting performance in each country. Opportunity score combines market size, current presence, and growth potential. 'Expand' = not present in a high-value market." />
        </h3>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: "var(--ink-tertiary)",
          }}
        >
          {marketMap.presence.total_markets} markets ·{" "}
          {marketMap.presence.dominant_markets} dominant
        </div>
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {marketMap.summary.high_opportunity > 0 && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "#30D158",
            }}
          >
            {marketMap.summary.high_opportunity} high opportunity
          </span>
        )}
        {marketMap.summary.markets_to_expand > 0 && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "#BF5AF2",
            }}
          >
            {marketMap.summary.markets_to_expand} to expand
          </span>
        )}
        {marketMap.summary.markets_to_grow > 0 && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "#0A84FF",
            }}
          >
            {marketMap.summary.markets_to_grow} to grow
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {filterButtons.map((fb) => (
          <button
            key={fb.key}
            onClick={() => setFilter(fb.key)}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: filter === fb.key ? 600 : 400,
              color: filter === fb.key ? "var(--ink)" : "var(--ink-tertiary)",
              background:
                filter === fb.key ? "rgba(255,255,255,0.06)" : "transparent",
              border: "1px solid",
              borderColor: filter === fb.key ? "var(--border)" : "transparent",
              borderRadius: 16,
              padding: "4px 12px",
              cursor: "pointer",
              transition: "all 150ms",
            }}
          >
            {fb.label}
            {fb.count > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  opacity: 0.6,
                }}
              >
                {fb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Market list */}
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-tertiary)",
            }}
          >
            No markets match this filter
          </div>
        ) : (
          filtered.map((market) => (
            <MarketRow key={market.country_code} market={market} />
          ))
        )}
      </div>
    </div>
  );
}
