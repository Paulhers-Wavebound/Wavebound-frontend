import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { NicheProofItem } from "./mockData";

interface NicheProofProps {
  items: NicheProofItem[];
}

export default function NicheProof({ items }: NicheProofProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {items.map((item) => (
        <motion.div
          key={item.artist}
          whileHover={{ borderColor: "rgba(255,255,255,0.12)" }}
          style={{
            background: "var(--surface, #1C1C1E)",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
            borderRadius: 16,
            overflow: "hidden",
            transition: "border-color 200ms",
          }}
        >
          <div
            style={{
              height: 160,
              background: `linear-gradient(135deg, var(--bg, #0A0A0A) 0%, var(--surface, #1C1C1E) 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--overlay-hover, rgba(255,255,255,0.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play
                size={20}
                color="var(--ink-tertiary, rgba(255,255,255,0.5))"
                style={{ marginLeft: 2 }}
              />
            </div>
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink, rgba(255,255,255,0.87))",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                padding: "4px 8px",
                borderRadius: 6,
              }}
            >
              {item.views}
            </span>
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink, rgba(255,255,255,0.87))",
                background: "rgba(232,67,10,0.2)",
                padding: "4px 8px",
                borderRadius: 6,
              }}
            >
              {item.market_badge}
            </span>
          </div>

          <div style={{ padding: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--ink, rgba(255,255,255,0.87))",
                }}
              >
                {item.artist}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--accent, #e8430a)",
                  background: "rgba(232,67,10,0.1)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {item.format}
              </span>
            </div>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                color: "var(--ink-tertiary, rgba(255,255,255,0.55))",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {item.description}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
