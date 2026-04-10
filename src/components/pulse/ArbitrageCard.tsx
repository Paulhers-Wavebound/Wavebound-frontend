import type { CountryArbitrage } from "@/types/pulse";
import { roiColor } from "./pulseConstants";

interface ArbitrageCardProps {
  arbitrage: CountryArbitrage;
}

const TIER_STYLES = {
  HIGH: {
    bg: "linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.04) 100%)",
    border: "rgba(34,197,94,0.25)",
    text: "#4ADE80",
    bar: "#22C55E",
  },
  MEDIUM: {
    bg: "linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(234,179,8,0.04) 100%)",
    border: "rgba(234,179,8,0.25)",
    text: "#FACC15",
    bar: "#EAB308",
  },
  LOW: {
    bg: "linear-gradient(135deg, rgba(107,114,128,0.18) 0%, rgba(107,114,128,0.04) 100%)",
    border: "rgba(107,114,128,0.25)",
    text: "#9CA3AF",
    bar: "#6B7280",
  },
} as const;

export default function ArbitrageCard({ arbitrage }: ArbitrageCardProps) {
  const s = TIER_STYLES[arbitrage.label];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Hero card */}
      <div
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow for HIGH */}
        {arbitrage.label === "HIGH" && (
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              filter: "blur(20px)",
              animation: "arb-glow 2s ease-in-out infinite",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>{""}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: s.text,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Market Opportunity
          </span>
        </div>

        {/* Score bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 3,
            background: "rgba(255,255,255,0.08)",
            marginBottom: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${arbitrage.score}%`,
              height: "100%",
              borderRadius: 3,
              background: s.bar,
              transition: "width 800ms cubic-bezier(0.25,1,0.5,1)",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 14,
          }}
        >
          <span>Score: {arbitrage.score}/100</span>
          <span style={{ color: s.text, fontWeight: 600 }}>
            {arbitrage.label}
          </span>
        </div>

        {/* Hero ROI number */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: roiColor(arbitrage.roi_vs_us),
            lineHeight: 1,
            marginBottom: 2,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {arbitrage.roi_vs_us}×
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 12,
          }}
        >
          ROI vs US baseline
        </div>

        {/* Recommendation */}
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.65)",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          "{arbitrage.recommendation}"
        </div>
      </div>

      {/* Ad Costs */}
      <SidebarSection title="Ad Costs">
        <StatRow
          label="TikTok"
          value={`$${arbitrage.ad_costs.tiktok_cpm.toFixed(2)} CPM`}
        />
        <StatRow
          label="Meta"
          value={`$${arbitrage.ad_costs.meta_cpm.toFixed(2)} CPM`}
        />
        <StatRow
          label="YouTube"
          value={`$${arbitrage.ad_costs.youtube_cpm.toFixed(2)} CPM`}
        />
        <StatRow
          label="US avg"
          value="$12.50 CPM"
          highlight
          suffix={`(${Math.round(12.5 / arbitrage.ad_costs.tiktok_cpm)}×)`}
        />
      </SidebarSection>

      {/* Fan Value */}
      <SidebarSection title="Fan Value">
        <ScoreRow
          label="Merch enthusiasm"
          value={arbitrage.fan_value.merch_enthusiasm}
        />
        <ScoreRow
          label="Live attendance"
          value={arbitrage.fan_value.live_attendance}
        />
        <ScoreRow
          label="Streaming payout"
          value={arbitrage.fan_value.streaming_payout}
        />
        <StatRow
          label="Avg ticket price"
          value={`$${arbitrage.fan_value.avg_ticket_price}`}
        />
      </SidebarSection>

      {/* Market Growth */}
      <SidebarSection title="Market Growth">
        <StatRow
          label="Streaming YoY"
          value={`+${arbitrage.market_growth.streaming_yoy}%`}
        />
        <StatRow
          label="Social penetration"
          value={`${arbitrage.market_growth.social_penetration}%`}
        />
        <StatRow label="Tier" value={arbitrage.market_growth.tier} />
      </SidebarSection>

      <style>{`
        @keyframes arb-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
          margin: "0 0 8px",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
  suffix,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  suffix?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      <span
        style={{
          color: highlight ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
        {suffix && (
          <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${rounded}%`,
              height: "100%",
              borderRadius: 2,
              background:
                rounded > 70 ? "#22C55E" : rounded > 40 ? "#EAB308" : "#6B7280",
              transition: "width 600ms ease-out",
            }}
          />
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontVariantNumeric: "tabular-nums",
            minWidth: 28,
            textAlign: "right",
          }}
        >
          {rounded}
        </span>
      </div>
    </div>
  );
}
