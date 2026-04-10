import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ExpansionRadarResponse } from "./types";

interface MethodologyExplainerProps {
  artistName: string;
  totalMarkets: number;
  comparables: ExpansionRadarResponse["comparable_artists"];
}

export default function MethodologyExplainer({
  artistName,
  totalMarkets,
  comparables,
}: MethodologyExplainerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "14px 20px",
          cursor: "pointer",
          transition: "border-color 150ms",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <ChevronDown
            size={14}
            style={{
              color: "var(--ink-tertiary)",
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 200ms",
              flexShrink: 0,
              marginTop: 3,
            }}
          />
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              color: "var(--ink-secondary)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Tracking{" "}
            <strong style={{ color: "var(--ink)" }}>{artistName}</strong> across
            7 platforms in{" "}
            <strong style={{ color: "var(--ink)" }}>{totalMarkets}</strong>{" "}
            markets. Compared against{" "}
            <strong style={{ color: "var(--ink)" }}>
              {comparables.length}
            </strong>{" "}
            artists with similar audience size to identify markets where demand
            exists but {artistName} has no presence. V2 adds discovery-streaming
            divergence, spillover predictions, and per-market song
            recommendations.
          </p>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <p
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-tertiary)",
                  margin: 0,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                  paddingLeft: 24,
                  lineHeight: 1.6,
                }}
              >
                Data sources: Spotify Charts, Apple Music Charts, iTunes Charts,
                Shazam Top 200, TikTok Charts, YouTube Charts, Deezer Charts.
                Updated daily. Scores combine 6 factors: base market signal,
                discovery divergence, entry song strength, spillover
                probability, platform fit, and velocity trend.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
