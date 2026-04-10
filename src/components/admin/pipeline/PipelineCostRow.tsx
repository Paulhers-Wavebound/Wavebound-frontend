import { Sparkles, Globe, Upload, DollarSign } from "lucide-react";
import type { ReactNode } from "react";

interface CostData {
  gemini_calls: number;
  apify_calls: number;
  storage_uploads: number;
  est_gemini_cost_usd: number;
}

interface Props {
  cost: CostData;
}

function CostCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: 14,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span style={{ color: "var(--ink-tertiary)" }}>{icon}</span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 20,
          fontWeight: 600,
          color: "var(--ink)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          color: "var(--ink-faint)",
          marginTop: 2,
        }}
      >
        Last 24h
      </div>
    </div>
  );
}

export default function PipelineCostRow({ cost }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      <CostCard
        icon={<Sparkles size={14} />}
        label="Gemini calls"
        value={cost.gemini_calls.toLocaleString()}
      />
      <CostCard
        icon={<Globe size={14} />}
        label="Apify calls"
        value={cost.apify_calls.toLocaleString()}
      />
      <CostCard
        icon={<Upload size={14} />}
        label="Uploads"
        value={cost.storage_uploads.toLocaleString()}
      />
      <CostCard
        icon={<DollarSign size={14} />}
        label="Est. cost"
        value={`$${cost.est_gemini_cost_usd.toFixed(2)}`}
      />
    </div>
  );
}

export type { CostData };
