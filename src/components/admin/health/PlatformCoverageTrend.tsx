import { GitBranch } from "lucide-react";
import type { PlatformIdTrend, PlatformIdDaily } from "./types";
import { getPlatformColor, formatCompact } from "./helpers";
import { SectionHeader, DeltaArrow } from "./shared";

function Sparkline({
  data,
  color,
  width = 72,
  height = 24,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 2) - 1}`,
    )
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PlatformCoverageTrend({
  trend,
  daily,
}: {
  trend: PlatformIdTrend[];
  daily: PlatformIdDaily[];
}) {
  // Group daily data by platform for sparklines
  const dailyByPlatform: Record<string, number[]> = {};
  for (const d of daily) {
    if (!dailyByPlatform[d.platform]) dailyByPlatform[d.platform] = [];
    dailyByPlatform[d.platform].push(d.count);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "16px",
      }}
    >
      <SectionHeader icon={GitBranch} label="Platform ID coverage (7d)" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 8,
        }}
      >
        {trend.map((t) => {
          const color = getPlatformColor(t.platform);
          const sparkData = dailyByPlatform[t.platform] || [];
          const deltaPct =
            t.total > 0 ? Math.round((t.added_7d / t.total) * 1000) / 10 : 0;

          return (
            <div
              key={t.platform}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Color dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />

              {/* Platform name + total */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ink)",
                    textTransform: "capitalize",
                  }}
                >
                  {t.platform.replace(/_/g, " ")}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {formatCompact(t.total)} total
                </div>
              </div>

              {/* Sparkline */}
              {sparkData.length >= 2 && (
                <Sparkline data={sparkData} color={color} />
              )}

              {/* 7d delta */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color: t.added_7d > 0 ? "#34d399" : "var(--ink-faint)",
                  }}
                >
                  {t.added_7d > 0 ? `+${formatCompact(t.added_7d)}` : "0"}
                </div>
                {deltaPct > 0 && <DeltaArrow value={deltaPct} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
