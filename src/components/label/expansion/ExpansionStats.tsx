import { motion } from "framer-motion";
import type { ExpansionArtist } from "./mockData";

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toLocaleString();
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  delay: number;
}

function StatCard({ label, value, sub, accent, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: accent
          ? "linear-gradient(180deg, rgba(232,67,10,0.10) 0%, rgba(232,67,10,0.04) 100%)"
          : "var(--surface, #1C1C1E)",
        border: accent
          ? "1px solid rgba(232,67,10,0.25)"
          : "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        borderRadius: 16,
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent
            ? "linear-gradient(90deg, #e8430a 0%, rgba(232,67,10,0.2) 100%)"
            : "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        }}
      />

      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 500,
          color: accent
            ? "rgba(232,67,10,0.7)"
            : "var(--ink-tertiary, rgba(255,255,255,0.45))",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 36,
          fontWeight: 700,
          color: accent
            ? "var(--accent, #e8430a)"
            : "var(--ink, rgba(255,255,255,0.87))",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            fontWeight: 500,
            color: "var(--green, #30D158)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {sub}
        </span>
      )}
    </motion.div>
  );
}

interface ExpansionStatsProps {
  artist: ExpansionArtist;
}

export default function ExpansionStats({ artist }: ExpansionStatsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
      }}
    >
      <StatCard
        label="Monthly Listeners"
        value={formatNumber(artist.monthly_listeners)}
        sub={`\u2191 ${artist.monthly_listeners_change_pct}%`}
        delay={0.1}
      />
      <StatCard
        label="Markets Reached"
        value={String(artist.markets_reached)}
        sub={`\u2191 ${artist.new_markets_this_month} new`}
        delay={0.15}
      />
      <StatCard
        label="Untapped Markets"
        value={String(artist.untapped_markets)}
        accent
        delay={0.2}
      />
      <StatCard
        label="Est. Missed Reach"
        value={formatNumber(artist.estimated_missed_reach)}
        delay={0.25}
      />
    </div>
  );
}
