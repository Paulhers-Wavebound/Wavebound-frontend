import { motion } from "framer-motion";
import { countryFlag } from "./utils";
import type { BudgetAllocation } from "./types";

interface BudgetAllocationChartProps {
  allocations: BudgetAllocation[];
}

export default function BudgetAllocationChart({
  allocations,
}: BudgetAllocationChartProps) {
  if (!allocations || allocations.length === 0) return null;

  const maxPct = Math.max(...allocations.map((a) => a.recommended_pct));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
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
          Budget Allocation Recommendation
        </span>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {allocations.map((alloc, i) => (
            <motion.div
              key={alloc.country_code}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 50px 80px",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Country */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>
                  {countryFlag(alloc.country_code)}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink)",
                      lineHeight: 1.2,
                    }}
                  >
                    {alloc.country_name}
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 9,
                      color: "var(--ink-tertiary)",
                    }}
                  >
                    {alloc.signal_convergence} signals
                  </div>
                </div>
              </div>

              {/* Bar */}
              <div
                style={{
                  height: 20,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${maxPct > 0 ? (alloc.recommended_pct / maxPct) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.6, delay: 0.1 * i }}
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background:
                      "linear-gradient(90deg, rgba(232,67,10,0.3) 0%, rgba(232,67,10,0.6) 100%)",
                  }}
                />
              </div>

              {/* Percentage */}
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#e8430a",
                  textAlign: "right",
                }}
              >
                {alloc.recommended_pct}%
              </div>

              {/* ROI */}
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color:
                    alloc.estimated_roi_index > 1.5
                      ? "#34d399"
                      : "var(--ink-tertiary)",
                  textAlign: "right",
                }}
              >
                {alloc.estimated_roi_index > 0
                  ? `${alloc.estimated_roi_index}x ROI`
                  : "—"}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reasoning summary */}
        {allocations[0]?.reasoning && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 6,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-tertiary)",
              lineHeight: 1.5,
            }}
          >
            Top market: {allocations[0].reasoning}
          </div>
        )}

        {/* Methodology note */}
        <div
          style={{
            marginTop: 12,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9,
            color: "rgba(255,255,255,0.20)",
            lineHeight: 1.5,
          }}
        >
          Based on enriched opportunity scores weighted by market ROI index (fan
          value / CPM relative to US). Signal convergence adds 10% bonus per
          converging signal. Allocations are directional, not financial advice.
        </div>
      </div>
    </motion.div>
  );
}
