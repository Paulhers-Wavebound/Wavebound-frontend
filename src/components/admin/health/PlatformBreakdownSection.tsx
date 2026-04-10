import { useState } from "react";
import { Layers } from "lucide-react";
import type { PlatformBreakdownEntry } from "./types";
import { formatNumber, getPlatformColor } from "./helpers";
import { SectionHeader } from "./shared";

export default function PlatformBreakdownSection({
  items,
}: {
  items: PlatformBreakdownEntry[];
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div>
      <SectionHeader icon={Layers} label="Platform breakdown" />
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 1fr 1fr 80px",
            gap: 8,
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ink-faint)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <span>Platform</span>
          <span style={{ textAlign: "right" }}>Observations</span>
          <span style={{ textAlign: "right" }}>Geo obs</span>
          <span style={{ textAlign: "right" }}>Entities</span>
          <span style={{ textAlign: "right" }}>Countries</span>
        </div>

        {items.map((item) => {
          const isExpanded = expandedRow === item.platform;
          return (
            <div key={item.platform}>
              <button
                onClick={() =>
                  setExpandedRow(isExpanded ? null : item.platform)
                }
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr 1fr 1fr 80px",
                  gap: 8,
                  width: "100%",
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border)",
                  background: isExpanded
                    ? "var(--surface-hover)"
                    : "transparent",
                  border: "none",
                  borderBlockEnd: "1px solid var(--border)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                  transition: "background 150ms",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: getPlatformColor(item.platform),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                    {item.platform}
                  </span>
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color: "var(--ink-secondary)",
                  }}
                >
                  {formatNumber(item.total_observations)}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color:
                      item.total_geo_observations > 0
                        ? "var(--ink-secondary)"
                        : "var(--ink-faint)",
                  }}
                >
                  {item.total_geo_observations > 0
                    ? formatNumber(item.total_geo_observations)
                    : "\u2014"}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color: "var(--ink-secondary)",
                  }}
                >
                  {formatNumber(item.unique_entities)}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    color:
                      item.unique_countries > 0
                        ? "var(--ink-secondary)"
                        : "var(--ink-faint)",
                  }}
                >
                  {item.unique_countries > 0
                    ? formatNumber(item.unique_countries)
                    : "\u2014"}
                </span>
              </button>

              {isExpanded && (
                <div
                  style={{
                    padding: "10px 16px 10px 40px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-subtle)",
                    fontSize: 12,
                    color: "var(--ink-tertiary)",
                  }}
                >
                  <span style={{ fontWeight: 600, marginRight: 8 }}>
                    Metrics:
                  </span>
                  {item.distinct_metrics.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
