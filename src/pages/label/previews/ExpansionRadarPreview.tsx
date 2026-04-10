import { Link } from "react-router-dom";
import { ArrowRight, Radio } from "lucide-react";

export default function ExpansionRadarPreview() {
  return (
    <div
      style={{ padding: "40px 44px 72px", maxWidth: 1280, margin: "0 auto" }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "56px 40px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            fontWeight: 600,
            color: "#30D158",
            background: "rgba(48, 209, 88, 0.1)",
            border: "1px solid rgba(48, 209, 88, 0.2)",
            padding: "4px 12px",
            borderRadius: 4,
          }}
        >
          <Radio size={12} />
          NOW LIVE
        </div>

        <h2
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 28,
            fontWeight: 800,
            color: "var(--ink)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Expansion Radar
        </h2>

        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            color: "var(--ink-tertiary)",
            margin: 0,
            maxWidth: 480,
            lineHeight: 1.6,
          }}
        >
          Cross-platform market intelligence across 7 platforms and 90+ markets.
          Identify untapped markets where comparable artists chart but your
          roster doesn&apos;t.
        </p>

        <Link
          to="/label/expansion-radar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent)",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            transition: "opacity 150ms",
          }}
        >
          Open Expansion Radar
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
