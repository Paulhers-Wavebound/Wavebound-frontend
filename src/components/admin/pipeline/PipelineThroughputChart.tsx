import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ThroughputDay {
  date: string;
  ruben_passed: number;
  oscar_passed: number;
}

interface Props {
  data: ThroughputDay[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return DAYS[d.getUTCDay()];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || !label) return null;
  const scraped = payload.find((p) => p.dataKey === "ruben_passed")?.value ?? 0;
  const uploaded =
    payload.find((p) => p.dataKey === "oscar_passed")?.value ?? 0;
  const rate = scraped > 0 ? ((uploaded / scraped) * 100).toFixed(1) : "—";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--ink-tertiary)", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 2,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: "#60a5fa",
          }}
        />
        <span style={{ color: "var(--ink-secondary)" }}>Scraped</span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 600,
            color: "var(--ink)",
            marginLeft: "auto",
          }}
        >
          {scraped.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 2,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: "#4ade80",
          }}
        />
        <span style={{ color: "var(--ink-secondary)" }}>Uploaded</span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 600,
            color: "var(--ink)",
            marginLeft: "auto",
          }}
        >
          {uploaded.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: 4,
          paddingTop: 4,
          color: "var(--ink-tertiary)",
          fontSize: 11,
        }}
      >
        Conversion: {rate}%
      </div>
    </div>
  );
}

export default function PipelineThroughputChart({ data }: Props) {
  // Fill missing days with 0
  const last7: {
    day: string;
    date: string;
    ruben_passed: number;
    oscar_passed: number;
  }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const found = data.find((t) => t.date === iso);
    last7.push({
      day: formatDay(iso),
      date: iso,
      ruben_passed: found?.ruben_passed ?? 0,
      oscar_passed: found?.oscar_passed ?? 0,
    });
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ink-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 12,
        }}
      >
        7-day throughput
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={last7}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{
              fontSize: 11,
              fill: "var(--ink-tertiary)",
              fontFamily: '"DM Sans", sans-serif',
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: "var(--ink-tertiary)",
              fontFamily: '"JetBrains Mono", monospace',
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="ruben_passed"
            stroke="#60a5fa"
            fill="#60a5fa"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="oscar_passed"
            stroke="#4ade80"
            fill="#4ade80"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export type { ThroughputDay };
