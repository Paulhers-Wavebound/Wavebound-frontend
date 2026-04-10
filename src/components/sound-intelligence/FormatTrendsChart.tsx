import {
  FormatBreakdown,
  VelocityDay,
  getFormatColor,
} from "@/types/soundIntelligence";
import InfoPopover from "./InfoPopover";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";

type TimeRange = "7d" | "14d" | "30d" | "3m" | "6m" | "9m" | "all";
const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "14d", label: "14D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "9m", label: "9M" },
  { value: "all", label: "ALL" },
];

interface Props {
  formats: FormatBreakdown[];
  velocity: VelocityDay[];
  disabledLines: Set<string>;
  onToggleLine: (name: string) => void;
  onSoloLine?: (name: string) => void;
  onShowAll?: () => void;
}

export default function FormatTrendsChart({
  formats,
  velocity,
  disabledLines,
  onToggleLine,
  onSoloLine,
  onShowAll,
}: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // Build the chart data directly from format daily arrays.
  // Each format has a `daily` array of length N (one entry per day).
  // We generate date labels by working backwards from today.
  const data = useMemo(() => {
    const dailyLen = formats[0]?.daily?.length || 0;
    if (dailyLen === 0) return [];

    const now = new Date();
    // Generate one date label per day, working backwards
    const allDays: { date: Date; label: string; dayIndex: number }[] = [];
    for (let i = 0; i < dailyLen; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (dailyLen - 1 - i));
      allDays.push({
        date: d,
        label: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dayIndex: i,
      });
    }

    // Apply time range filter
    let filtered = allDays;
    if (timeRange !== "all") {
      const monthMap: Record<string, number> = {
        "3m": 90,
        "6m": 180,
        "9m": 270,
      };
      const days = monthMap[timeRange] ?? parseInt(timeRange);
      filtered = allDays.slice(-days);
    }

    // Aggregate into buckets for longer ranges
    let buckets: { label: string; indices: number[] }[];
    if (timeRange === "3m") {
      buckets = [];
      for (let i = 0; i < filtered.length; i += 3) {
        const chunk = filtered.slice(i, i + 3);
        buckets.push({
          label: chunk[0].label,
          indices: chunk.map((c) => c.dayIndex),
        });
      }
    } else if (timeRange === "6m" || timeRange === "9m") {
      buckets = [];
      for (let i = 0; i < filtered.length; i += 7) {
        const chunk = filtered.slice(i, i + 7);
        buckets.push({
          label: chunk[0].label,
          indices: chunk.map((c) => c.dayIndex),
        });
      }
    } else {
      buckets = filtered.map((d) => ({
        label: d.label,
        indices: [d.dayIndex],
      }));
    }

    return buckets.map((bucket) => {
      const point: Record<string, any> = { date: bucket.label };
      formats.forEach((f) => {
        point[f.name] = bucket.indices.reduce(
          (sum, idx) => sum + (f.daily[idx] ?? 0),
          0,
        );
      });
      return point;
    });
  }, [formats, timeRange]);

  const xInterval =
    data.length <= 7 ? 0 : data.length <= 14 ? 1 : Math.floor(data.length / 8);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        padding: 20,
        borderTop: "0.5px solid var(--card-edge)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 14,
              borderRadius: 1,
              background:
                "linear-gradient(180deg, rgba(232,67,10,0.6) 0%, rgba(232,67,10,0.15) 100%)",
            }}
          />
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.10em",
              color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
            }}
          >
            Format Trends
          </div>
          <InfoPopover text="How each video format (lip sync, comedy, etc.) is trending over time. Click a format name to show/hide it. Double-click to see just that one." />
        </div>
        <div
          data-pdf-hide
          style={{
            display: "flex",
            gap: 4,
            background: "var(--surface-hover)",
            borderRadius: 8,
            padding: 3,
          }}
        >
          {TIME_OPTIONS.map((opt) => {
            const active = timeRange === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--ink-secondary)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }}
            axisLine={false}
            tickLine={false}
            interval={xInterval}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              const nonZero = payload
                .filter((p) => Number(p.value) > 0)
                .sort((a, b) => Number(b.value) - Number(a.value));
              const shown = nonZero.slice(0, 5);
              const remaining = nonZero.length - shown.length;

              return (
                <div
                  style={{
                    background: "var(--chart-tooltip-bg)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--chart-tooltip-border)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    maxWidth: 260,
                  }}
                >
                  <div
                    style={{
                      color: "var(--ink)",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  {shown.map((p) => (
                    <div
                      key={String(p.dataKey)}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        color: "var(--ink-secondary)",
                        padding: "1px 0",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: String(p.color),
                          flexShrink: 0,
                        }}
                      />
                      <span>
                        {p.name}:{" "}
                        <b style={{ color: "var(--ink)" }}>
                          {Number(p.value) >= 1000
                            ? `${(Number(p.value) / 1000).toFixed(1)}K`
                            : p.value}
                        </b>
                      </span>
                    </div>
                  ))}
                  {remaining > 0 && (
                    <div
                      style={{
                        color: "var(--ink-faint)",
                        fontSize: 11,
                        marginTop: 4,
                        paddingTop: 4,
                        borderTop: "1px solid var(--chart-tooltip-border)",
                      }}
                    >
                      +{remaining} more format{remaining > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            }}
          />
          {formats.map((f, i) => (
            <Line
              key={f.name}
              type="monotone"
              dataKey={f.name}
              stroke={getFormatColor(f.name, i)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={disabledLines.has(f.name)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend — compact grid */}
      <div
        data-pdf-legend-cols="4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "4px 12px",
          marginTop: 14,
          alignItems: "center",
        }}
      >
        {formats.map((f, i) => (
          <button
            key={f.name}
            onClick={() => onToggleLine(f.name)}
            onDoubleClick={(e) => {
              e.preventDefault();
              onSoloLine?.(f.name);
            }}
            title="Click to toggle, double-click to solo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
              opacity: disabledLines.has(f.name) ? 0.3 : 1,
              transition: "opacity 150ms",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: getFormatColor(f.name, i),
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {f.name}
            </span>
          </button>
        ))}
        {disabledLines.size > 0 && (
          <button
            data-pdf-hide
            onClick={() => {
              if (onShowAll) {
                onShowAll();
              } else {
                formats.forEach((f) => {
                  if (disabledLines.has(f.name)) onToggleLine(f.name);
                });
              }
            }}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: "var(--accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 8px",
              marginLeft: 4,
            }}
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
}
