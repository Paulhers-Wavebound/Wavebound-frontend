import { motion } from "framer-motion";
import { countryFlag, formatNumber, formatDollar } from "./utils";
import type { ExpansionRadarResponse } from "./types";

interface RevenueSizingProps {
  revenueSizing: ExpansionRadarResponse["revenue_sizing"];
}

export default function RevenueSizing({ revenueSizing }: RevenueSizingProps) {
  if (!revenueSizing || revenueSizing.top_markets.length === 0) return null;

  const total = revenueSizing.total_uncaptured_monthly;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
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
          Revenue Opportunity
        </span>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        {/* Headline number */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-tertiary)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Estimated uncaptured monthly revenue
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 36,
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "-0.02em",
            }}
          >
            {formatDollar(total)}
            <span
              style={{
                fontSize: 16,
                color: "var(--ink-tertiary)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              /mo
            </span>
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-tertiary)",
              marginTop: 4,
            }}
          >
            across {revenueSizing.top_markets.length} expansion markets
          </div>
        </div>

        {/* Per-market breakdown table */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 16,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <thead>
              <tr>
                {[
                  "Market",
                  "Est. Streams",
                  "Per-Stream Rate",
                  "Est. Revenue",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 10px",
                      textAlign: h === "Market" ? "left" : "right",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      fontWeight: 500,
                      color: "var(--ink-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenueSizing.top_markets
                .sort((a, b) => b.estimated_revenue - a.estimated_revenue)
                .slice(0, 15)
                .map((market, i) => (
                  <motion.tr
                    key={market.country_code}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.03 * i }}
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td style={{ padding: "10px 10px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 13 }}>
                          {countryFlag(market.country_code)}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--ink)",
                          }}
                        >
                          {market.country_name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 10px",
                        textAlign: "right",
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 12,
                        color: "var(--ink-secondary)",
                      }}
                    >
                      {formatNumber(market.estimated_streams)}
                    </td>
                    <td
                      style={{
                        padding: "10px 10px",
                        textAlign: "right",
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "var(--ink-tertiary)",
                      }}
                    >
                      ${(market.per_stream_rate ?? 0).toFixed(4)}
                    </td>
                    <td
                      style={{
                        padding: "10px 10px",
                        textAlign: "right",
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {formatDollar(market.estimated_revenue)}
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Methodology disclaimer */}
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            background: "var(--bg)",
            borderRadius: 6,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            color: "var(--ink-tertiary)",
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {revenueSizing.methodology}
        </div>
      </div>
    </motion.div>
  );
}
