import { useState, useMemo } from "react";
import InfoPopover from "./InfoPopover";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  postingHours: number[];
}

const HOUR_LABELS = [
  "12a",
  "1a",
  "2a",
  "3a",
  "4a",
  "5a",
  "6a",
  "7a",
  "8a",
  "9a",
  "10a",
  "11a",
  "12p",
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
  "6p",
  "7p",
  "8p",
  "9p",
  "10p",
  "11p",
];

function getLocalOffset(): number {
  return -(new Date().getTimezoneOffset() / 60);
}

function shiftHours(hours: number[], offset: number): number[] {
  const shifted = new Array(24);
  for (let i = 0; i < 24; i++) {
    shifted[(i + offset + 24) % 24] = hours[i];
  }
  return shifted;
}

export default function PostingHoursChart({ postingHours }: Props) {
  const [timezone, setTimezone] = useState<"utc" | "local">("utc");
  const localOffset = getLocalOffset();
  const tzLabel =
    timezone === "utc"
      ? "UTC"
      : `UTC${localOffset >= 0 ? "+" : ""}${localOffset}`;

  const hours = useMemo(
    () =>
      timezone === "utc" ? postingHours : shiftHours(postingHours, localOffset),
    [postingHours, timezone, localOffset],
  );

  const rawMax = Math.max(...hours);
  const max = Math.max(rawMax, 1);
  const peakHour = rawMax > 0 ? hours.indexOf(rawMax) : 0;
  const total = hours.reduce((a, b) => a + b, 0);

  const data = hours.map((count, i) => ({
    hour: HOUR_LABELS[i],
    count,
    intensity: count / max,
  }));

  // Find peak window (3h block with highest total)
  let bestWindowStart = 0;
  let bestWindowSum = 0;
  for (let i = 0; i < 24; i++) {
    const sum = hours[i] + hours[(i + 1) % 24] + hours[(i + 2) % 24];
    if (sum > bestWindowSum) {
      bestWindowSum = sum;
      bestWindowStart = i;
    }
  }
  const windowPct = total > 0 ? Math.round((bestWindowSum / total) * 100) : 0;
  const windowLabel = `${HOUR_LABELS[bestWindowStart]}–${HOUR_LABELS[(bestWindowStart + 3) % 24]}`;

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
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "var(--ink-tertiary, rgba(255,255,255,0.45))",
              }}
            >
              Posting Hours
            </span>
            <InfoPopover text="What time of day creators are posting videos with your sound (in UTC or your timezone). Use this to time your campaigns for maximum visibility." />
          </div>
          {/* Timezone toggle */}
          <div
            data-pdf-hide
            style={{
              display: "flex",
              gap: 2,
              background: "var(--card-edge)",
              borderRadius: 6,
              padding: 2,
            }}
          >
            {(["utc", "local"] as const).map((tz) => (
              <button
                key={tz}
                onClick={() => setTimezone(tz)}
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "none",
                  cursor: "pointer",
                  background:
                    timezone === tz
                      ? "var(--chart-tooltip-border)"
                      : "transparent",
                  color: timezone === tz ? "var(--ink)" : "var(--ink-tertiary)",
                  transition: "all 150ms",
                }}
              >
                {tz === "utc" ? "UTC" : "Local"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {HOUR_LABELS[peakHour]}
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-tertiary)",
                marginLeft: 6,
              }}
            >
              Peak hour ({tzLabel})
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {windowLabel}
            </span>
            <span
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 11,
                color: "var(--ink-tertiary)",
                marginLeft: 6,
              }}
            >
              {windowPct}% of posts
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="hour"
            tick={{
              fill: "var(--ink-tertiary)",
              fontSize: 10,
              fontFamily: '"DM Sans", sans-serif',
            }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-subtle)" }}
            interval={2}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              const count = Number(payload[0].value);
              return (
                <div
                  style={{
                    background: "rgba(0,0,0,0.92)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    <b style={{ color: "#e8430a" }}>{count}</b> video
                    {count !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={16}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill="#e8430a"
                fillOpacity={i === peakHour ? 1 : 0.2 + d.intensity * 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            color: "var(--ink-faint)",
          }}
        >
          Midnight
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            color: "var(--ink-faint)",
          }}
        >
          Noon
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 10,
            color: "var(--ink-faint)",
          }}
        >
          Midnight
        </span>
      </div>
    </div>
  );
}
