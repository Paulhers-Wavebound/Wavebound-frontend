import { ShieldAlert, CheckCircle2 } from "lucide-react";
import type { DataQuality } from "./types";
import { formatNumber, formatPct, getPlatformColor } from "./helpers";
import { CollapsibleSection } from "./shared";

export default function DataQualitySection({ dq }: { dq: DataQuality }) {
  const hasIssues =
    dq.duplicate_observations > 0 ||
    dq.null_value_observations > 0 ||
    dq.orphan_entities > 0 ||
    dq.zero_heavy_metrics.length > 0;

  return (
    <CollapsibleSection title="Data quality" icon={ShieldAlert}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {/* Duplicates */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: `1px solid ${dq.duplicate_observations > 0 ? "#ef444444" : "var(--border)"}`,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 4,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Duplicate observations
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: dq.duplicate_observations > 0 ? "#ef4444" : "#34d399",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(dq.duplicate_observations)}
          </div>
        </div>

        {/* NULLs */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: `1px solid ${dq.null_value_observations > 0 ? "#f59e0b44" : "var(--border)"}`,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 4,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            NULL values
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: dq.null_value_observations > 0 ? "#f59e0b" : "#34d399",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(dq.null_value_observations)}
          </div>
        </div>

        {/* Orphans */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            border: `1px solid ${dq.orphan_entities > 0 ? "#f59e0b44" : "var(--border)"}`,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 4,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Orphan entities
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: dq.orphan_entities > 0 ? "#f59e0b" : "#34d399",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            {formatNumber(dq.orphan_entities)}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--ink-faint)",
              marginTop: 2,
            }}
          >
            Entities with 0 observations
          </div>
        </div>
      </div>

      {/* Zero-heavy metrics */}
      {dq.zero_heavy_metrics.length > 0 && (
        <div
          style={{
            marginTop: 12,
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid #f59e0b44",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#f59e0b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            High-zero metrics ({">"}50% zeros)
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {dq.zero_heavy_metrics.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--ink-secondary)",
                }}
              >
                <span>
                  <span style={{ color: getPlatformColor(m.platform) }}>
                    {m.platform}
                  </span>
                  <span style={{ color: "var(--ink-faint)" }}> / </span>
                  {m.metric}
                </span>
                <span style={{ color: "#f59e0b" }}>
                  {formatPct(m.zero_pct)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasIssues && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--green-light)",
            border: "1px solid #34d39933",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontFamily: '"DM Sans", sans-serif',
            color: "#34d399",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} />
          No data quality issues detected
        </div>
      )}
    </CollapsibleSection>
  );
}
