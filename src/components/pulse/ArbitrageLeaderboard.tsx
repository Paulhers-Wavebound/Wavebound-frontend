import { useState } from "react";
import type { ArbitrageData, ArbitrageMarket } from "@/types/pulse";
import { ARBITRAGE_COLORS, roiColor } from "./pulseConstants";

type SortKey = "arbitrage_score" | "roi_vs_us";

interface ArbitrageLeaderboardProps {
  data: ArbitrageData;
  onCountrySelect: (countryCode: string) => void;
  hoveredCountry: string | null;
  onCountryHover: (countryCode: string | null) => void;
}

const FLAG_FALLBACK: Record<string, string> = {
  NG: "\u{1F1F3}\u{1F1EC}",
  KE: "\u{1F1F0}\u{1F1EA}",
  BR: "\u{1F1E7}\u{1F1F7}",
  PH: "\u{1F1F5}\u{1F1ED}",
  GH: "\u{1F1EC}\u{1F1ED}",
  ID: "\u{1F1EE}\u{1F1E9}",
  MX: "\u{1F1F2}\u{1F1FD}",
  CO: "\u{1F1E8}\u{1F1F4}",
  IN: "\u{1F1EE}\u{1F1F3}",
  ZA: "\u{1F1FF}\u{1F1E6}",
  TH: "\u{1F1F9}\u{1F1ED}",
  TR: "\u{1F1F9}\u{1F1F7}",
  EG: "\u{1F1EA}\u{1F1EC}",
  AR: "\u{1F1E6}\u{1F1F7}",
  VN: "\u{1F1FB}\u{1F1F3}",
  PE: "\u{1F1F5}\u{1F1EA}",
  CL: "\u{1F1E8}\u{1F1F1}",
  MA: "\u{1F1F2}\u{1F1E6}",
  SA: "\u{1F1F8}\u{1F1E6}",
  RO: "\u{1F1F7}\u{1F1F4}",
};

function getFlag(code: string): string {
  if (FLAG_FALLBACK[code]) return FLAG_FALLBACK[code];
  const codePoints = [...code.toUpperCase()].map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65,
  );
  return String.fromCodePoint(...codePoints);
}

function labelDot(label: string): string {
  if (label === "HIGH") return "\u25CF";
  if (label === "MEDIUM") return "\u25CF";
  return "\u25CB";
}

export default function ArbitrageLeaderboard({
  data,
  onCountrySelect,
  hoveredCountry,
  onCountryHover,
}: ArbitrageLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortKey>("arbitrage_score");

  const sorted = [...(data.leaderboard ?? [])].sort(
    (a: ArbitrageMarket, b: ArbitrageMarket) => b[sortBy] - a[sortBy],
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        top: 16,
        width: 280,
        background: "rgba(0, 0, 0, 0.80)",
        backdropFilter: "blur(16px)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        padding: 16,
        maxHeight: "calc(100% - 80px)",
        overflowY: "auto",
        zIndex: 25,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        animation: "slide-in-left 400ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 16 }}>{""}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#e2e8f0",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Underpriced Markets
        </span>
      </div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          margin: "0 0 12px",
        }}
      >
        Top opportunities right now
      </p>

      {/* Sort toggle */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 12,
        }}
      >
        {(
          [
            { key: "arbitrage_score", label: "Score" },
            { key: "roi_vs_us", label: "ROI" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            style={{
              flex: 1,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background:
                sortBy === opt.key
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.04)",
              color:
                sortBy === opt.key
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.4)",
              transition: "all 150ms",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Leaderboard entries */}
      {sorted.slice(0, 10).map((market, i) => (
        <div
          key={market.country_code}
          onClick={() => onCountrySelect(market.country_code)}
          onMouseEnter={() => onCountryHover(market.country_code)}
          onMouseLeave={() => onCountryHover(null)}
          style={{
            padding: "8px 8px",
            borderRadius: 8,
            cursor: "pointer",
            marginBottom: 2,
            background:
              hoveredCountry === market.country_code
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            transition: "background 150ms",
            animation: `fade-in-entry 300ms ease-out ${i * 50}ms both`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#e2e8f0",
              }}
            >
              {i + 1}. {getFlag(market.country_code)} {market.country_name}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: ARBITRAGE_COLORS[market.arbitrage_label],
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {market.arbitrage_score}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              marginTop: 3,
            }}
          >
            <span style={{ color: roiColor(market.roi_vs_us) }}>
              {market.roi_vs_us}×
            </span>{" "}
            ROI · ${market.avg_cpm_blended.toFixed(2)} CPM
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              marginTop: 2,
            }}
          >
            {market.total_songs} songs · {market.dominant_genre}{" "}
            {market.dominant_genre_pct}%
          </div>
        </div>
      ))}

      {/* Bucket summary */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          marginTop: 8,
          paddingTop: 10,
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.8,
        }}
      >
        {data.opportunity_buckets && (
          <>
            <div>
              {labelDot("HIGH")} HIGH: {data.opportunity_buckets.high} markets
            </div>
            <div>
              {labelDot("MEDIUM")} MEDIUM: {data.opportunity_buckets.medium}{" "}
              markets
            </div>
            <div>
              {labelDot("LOW")} LOW: {data.opportunity_buckets.low} markets
            </div>
          </>
        )}
        <div
          style={{
            marginTop: 6,
            color: "rgba(255,255,255,0.25)",
            fontSize: 10,
          }}
        >
          US baseline: ${(data.us_baseline_cpm ?? 12.5).toFixed(2)} CPM
          <br />
          "×" = ROI multiple vs US
        </div>
      </div>

      <style>{`
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-entry {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
