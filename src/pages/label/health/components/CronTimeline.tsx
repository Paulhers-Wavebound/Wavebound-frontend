import type { ScraperRunHistoryEntry } from "@/components/admin/health/types";
import { SCRAPER_LABELS } from "@/components/admin/health/constants";

const TIMELINE_HOURS = 48;
const ROW_HEIGHT = 28;
const LABEL_WIDTH = 180;
const DOT_SIZE = 6;

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export default function CronTimeline({
  history,
}: {
  history: ScraperRunHistoryEntry[];
}) {
  // Group by scraper
  const byName: Record<string, ScraperRunHistoryEntry[]> = {};
  for (const entry of history) {
    if (!byName[entry.scraper_name]) byName[entry.scraper_name] = [];
    byName[entry.scraper_name].push(entry);
  }

  const scraperNames = Object.keys(byName).sort();
  if (scraperNames.length === 0) return null;

  const totalHeight = scraperNames.length * ROW_HEIGHT + 24; // +24 for axis
  const chartWidth = 600;

  // Tick marks at 6h intervals
  const ticks = [0, 6, 12, 18, 24, 30, 36, 42, 48];

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "16px",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          48h Run Timeline
        </span>
      </div>

      <div style={{ display: "flex", minWidth: LABEL_WIDTH + chartWidth + 20 }}>
        {/* Labels */}
        <div style={{ width: LABEL_WIDTH, flexShrink: 0 }}>
          <div style={{ height: 24 }} /> {/* axis spacer */}
          {scraperNames.map((name) => (
            <div
              key={name}
              style={{
                height: ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                paddingRight: 8,
              }}
            >
              {SCRAPER_LABELS[name] || name}
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, position: "relative", minWidth: chartWidth }}>
          <svg
            width="100%"
            height={totalHeight}
            viewBox={`0 0 ${chartWidth} ${totalHeight}`}
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            {/* Axis ticks */}
            {ticks.map((h) => {
              const x = ((TIMELINE_HOURS - h) / TIMELINE_HOURS) * chartWidth;
              return (
                <g key={h}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={totalHeight}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={14}
                    fill="var(--ink-faint)"
                    fontSize={9}
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {h === 0 ? "now" : `${h}h`}
                  </text>
                </g>
              );
            })}

            {/* Row separators */}
            {scraperNames.map((_, i) => (
              <line
                key={i}
                x1={0}
                y1={24 + i * ROW_HEIGHT}
                x2={chartWidth}
                y2={24 + i * ROW_HEIGHT}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={1}
              />
            ))}

            {/* Run dots */}
            {scraperNames.map((name, i) => {
              const runs = byName[name] || [];
              const cy = 24 + i * ROW_HEIGHT + ROW_HEIGHT / 2;
              return runs.map((run, j) => {
                const h = hoursAgo(run.started_at);
                if (h > TIMELINE_HOURS) return null;
                const cx = ((TIMELINE_HOURS - h) / TIMELINE_HOURS) * chartWidth;
                const color =
                  run.status === "success"
                    ? "#34d399"
                    : run.status === "error"
                      ? "#ef4444"
                      : "#f59e0b";
                return (
                  <circle
                    key={`${name}-${j}`}
                    cx={cx}
                    cy={cy}
                    r={DOT_SIZE / 2}
                    fill={color}
                    opacity={0.85}
                  >
                    <title>
                      {name} — {run.status} at{" "}
                      {new Date(run.started_at).toLocaleTimeString()}
                    </title>
                  </circle>
                );
              });
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 8,
          paddingLeft: LABEL_WIDTH,
        }}
      >
        {[
          { color: "#34d399", label: "Success" },
          { color: "#ef4444", label: "Error" },
          { color: "#f59e0b", label: "Running" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: item.color,
              }}
            />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                color: "var(--ink-faint)",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
