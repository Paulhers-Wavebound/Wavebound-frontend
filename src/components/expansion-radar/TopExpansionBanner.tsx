import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crosshair, ExternalLink } from "lucide-react";
import { countryFlag } from "./utils";
import type { ExpansionRadarResponse, ActiveMarket } from "./types";
import type { EnrichedMarketIntel } from "./useMarketIntelligence";

interface TopExpansionBannerProps {
  heatData: ExpansionRadarResponse["market_heat"];
  activeMarkets: ActiveMarket[];
  artistName: string;
  marketIntel: Map<string, EnrichedMarketIntel>;
}

export default function TopExpansionBanner({
  heatData,
  activeMarkets,
  artistName,
  marketIntel,
}: TopExpansionBannerProps) {
  const navigate = useNavigate();

  const activeSet = useMemo(
    () => new Set(activeMarkets.map((m) => m.country_code)),
    [activeMarkets],
  );

  // Pick best market: highest (signal_score × roi_vs_us), excluding US baseline
  const best = useMemo(() => {
    let topScore = 0;
    let topMarket: (typeof heatData)[number] | null = null;
    let topIntel: EnrichedMarketIntel | null = null;

    for (const h of heatData) {
      if (h.country_code === "US") continue;
      const intel = marketIntel.get(h.country_code);
      if (!intel) continue;
      const composite = h.signal_score * intel.roi_vs_us;
      if (composite > topScore) {
        topScore = composite;
        topMarket = h;
        topIntel = intel;
      }
    }
    return topMarket && topIntel
      ? { market: topMarket, intel: topIntel }
      : null;
  }, [heatData, marketIntel]);

  if (!best) return null;

  const { market, intel } = best;
  const isActive = activeSet.has(market.country_code);
  const trendingSongs = activeMarkets.find(
    (m) => m.country_code === market.country_code,
  )?.entry_song;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        background:
          "linear-gradient(135deg, rgba(232,67,10,0.10) 0%, rgba(232,67,10,0.03) 100%)",
        border: "1px solid rgba(232,67,10,0.18)",
        borderRadius: 12,
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle accent glow */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(232,67,10,0.08)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="er-banner-row"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          position: "relative",
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Crosshair
              size={14}
              style={{ color: "var(--accent)", flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                fontWeight: 600,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.10em",
              }}
            >
              Top Expansion Opportunity for {artistName}
            </span>
          </div>

          {/* Country + stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>
              {countryFlag(market.country_code)}
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {market.country_name}
            </span>
          </div>

          {/* Stat pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              lineHeight: 1,
            }}
          >
            <StatPill
              label={`${intel.roi_vs_us.toFixed(1)}× ROI vs US`}
              highlight
            />
            <StatPill label={`$${intel.avg_cpm_blended.toFixed(2)} CPM`} />
            {isActive && <StatPill label="Already streaming" />}
            {trendingSongs && (
              <StatPill label={`Song trending: ${trendingSongs.name}`} />
            )}
            {intel.yoy_streaming_growth > 15 && (
              <StatPill label={`+${intel.yoy_streaming_growth}% YoY growth`} />
            )}
            <StatPill label={`Signal: ${Math.round(market.signal_score)}`} />
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() =>
            navigate(
              `/label/admin/pulse?mode=arbitrage&country=${market.country_code}`,
            )
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            background: "var(--accent)",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
            alignSelf: "center",
          }}
        >
          View in Pulse <ExternalLink size={12} />
        </button>
      </div>
    </motion.div>
  );
}

function StatPill({
  label,
  highlight,
}: {
  label: string;
  highlight?: boolean;
}) {
  return (
    <span
      style={{
        color: highlight ? "var(--accent)" : "var(--ink-secondary)",
        background: highlight
          ? "rgba(232,67,10,0.12)"
          : "rgba(255,255,255,0.04)",
        border: highlight
          ? "1px solid rgba(232,67,10,0.20)"
          : "1px solid var(--border)",
        borderRadius: 5,
        padding: "4px 8px",
        fontWeight: highlight ? 600 : 400,
      }}
    >
      {label}
    </span>
  );
}
