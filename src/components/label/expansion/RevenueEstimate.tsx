import { motion } from "framer-motion";

interface RevenueItem {
  market: string;
  label: string;
  value: number;
  subtext: string;
}

interface RevenueEstimateProps {
  items: RevenueItem[];
}

export default function RevenueEstimate({ items }: RevenueEstimateProps) {
  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${items.length}, 1fr) auto`,
          gap: 16,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              background: "var(--surface, #1C1C1E)",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
              borderRadius: 16,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>{item.market}</span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-tertiary, rgba(255,255,255,0.55))",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 26,
                fontWeight: 700,
                color: "var(--green, #30D158)",
                letterSpacing: "-0.02em",
              }}
            >
              +${item.value.toLocaleString()}
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                color: "var(--ink-faint, rgba(255,255,255,0.35))",
              }}
            >
              {item.subtext}
            </span>
          </div>
        ))}

        <div
          style={{
            background: "rgba(48, 209, 88, 0.06)",
            border: "1px solid rgba(48, 209, 88, 0.15)",
            borderRadius: 16,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            minWidth: 180,
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(48, 209, 88, 0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Total Opportunity
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 32,
              fontWeight: 700,
              color: "var(--green, #30D158)",
              letterSpacing: "-0.02em",
            }}
          >
            +${total.toLocaleString()}
          </span>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              color: "var(--ink-faint, rgba(255,255,255,0.35))",
            }}
          >
            /month projected
          </span>
        </div>
      </div>
    </motion.div>
  );
}
