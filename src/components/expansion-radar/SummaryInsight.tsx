import { motion } from "framer-motion";
import { formatNumber, formatDollar } from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface SummaryInsightProps {
  artist: ExpansionRadarResponse["artist"];
  opportunities: ExpansionRadarResponse["expansion_opportunities"];
  revenueSizing: ExpansionRadarResponse["revenue_sizing"];
  discoveryRadar: ExpansionRadarResponse["discovery_radar"];
}

export default function SummaryInsight({
  artist,
  opportunities,
  revenueSizing,
  discoveryRadar,
}: SummaryInsightProps) {
  if (opportunities.length === 0) return null;

  const sorted = [...opportunities].sort(
    (a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0),
  );
  const top3 = sorted.slice(0, 3).map((o) => o.country_name);
  const preBreakoutCount = discoveryRadar.filter(
    (d) => d.signal_type === "pre_breakout",
  ).length;
  const earlyDemandCount = discoveryRadar.filter(
    (d) => d.signal_type === "early_demand",
  ).length;
  const totalUncaptured = revenueSizing?.total_uncaptured_monthly ?? 0;
  const actNowCount = opportunities.filter(
    (o) => o.urgency === "act_now",
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{
        padding: "20px 24px",
        borderLeft: "3px solid #e8430a",
        background: "rgba(232,67,10,0.04)",
        borderRadius: "0 10px 10px 0",
      }}
    >
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 15,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1.7,
          fontWeight: 500,
        }}
      >
        {artist.name} is active in {artist.markets_reached} markets but has zero
        presence in{" "}
        <strong style={{ color: "#e8430a" }}>
          {opportunities.length} market
          {opportunities.length !== 1 ? "s" : ""}
        </strong>{" "}
        where expansion signals are firing. The biggest gaps are{" "}
        <strong>{top3.join(", ")}</strong>.
        {preBreakoutCount > 0 && (
          <>
            {" "}
            <strong style={{ color: "#0A84FF" }}>
              {preBreakoutCount} pre-breakout signal
              {preBreakoutCount !== 1 ? "s" : ""}
            </strong>{" "}
            detected — discovery demand is forming ahead of streaming.
          </>
        )}
        {earlyDemandCount > 0 && preBreakoutCount === 0 && (
          <>
            {" "}
            <strong style={{ color: "#e8430a" }}>
              {earlyDemandCount} early demand signal
              {earlyDemandCount !== 1 ? "s" : ""}
            </strong>{" "}
            detected across discovery platforms.
          </>
        )}
        {totalUncaptured > 0 && (
          <>
            {" "}
            These markets represent an estimated{" "}
            <strong style={{ color: "#e8430a" }}>
              {formatDollar(totalUncaptured)}/month
            </strong>{" "}
            in uncaptured streaming revenue.
          </>
        )}
        {actNowCount > 0 && (
          <>
            {" "}
            <strong>
              {actNowCount} market{actNowCount !== 1 ? "s" : ""} marked ACT NOW.
            </strong>
          </>
        )}
      </p>
    </motion.div>
  );
}
