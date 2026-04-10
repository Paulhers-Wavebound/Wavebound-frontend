import { useState } from "react";
import { Clock } from "lucide-react";
import type { DataFreshnessEntry } from "./types";
import { relativeTime, formatNumber } from "./helpers";
import { getPlatformColor } from "./helpers";
import { SectionHeader } from "./shared";

export default function DataFreshnessSection({
  items,
}: {
  items: DataFreshnessEntry[];
}) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  return (
    <div>
      <SectionHeader icon={Clock} label="Data freshness" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => {
          const dotColor =
            item.status === "fresh"
              ? "#34d399"
              : item.status === "stale"
                ? "#f59e0b"
                : "#ef4444";
          const isExpanded = expandedPlatform === item.platform;

          return (
            <button
              key={item.platform}
              onClick={() =>
                setExpandedPlatform(isExpanded ? null : item.platform)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 10,
                border: isExpanded
                  ? `1px solid ${getPlatformColor(item.platform)}44`
                  : "1px solid var(--border)",
                background: isExpanded
                  ? "var(--surface-hover)"
                  : "var(--surface)",
                cursor: "pointer",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                transition: "all 150ms",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dotColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontWeight: 500,
                  color: getPlatformColor(item.platform),
                }}
              >
                {item.platform}
              </span>
              <span
                style={{
                  color: "var(--ink-tertiary)",
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                }}
              >
                {item.hours_ago < 1 ? "<1h" : Math.round(item.hours_ago) + "h"}
              </span>
            </button>
          );
        })}
      </div>
      {expandedPlatform && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--bg-subtle)",
            border: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--ink-secondary)",
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          {(() => {
            const item = items.find((i) => i.platform === expandedPlatform);
            if (!item) return null;
            return (
              <>
                <strong style={{ color: getPlatformColor(item.platform) }}>
                  {item.platform}
                </strong>
                {" \u2014 "}
                {formatNumber(item.observation_count)} observations, last update{" "}
                {relativeTime(item.last_observation_at)}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
