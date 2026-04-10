import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface DayCost {
  day: string;
  label: string;
  gemini: number;
  apify: number;
  storage: number;
  estCostUsd: number;
}

// Gemini Flash 2.5 pricing approximation (input + output per call)
const GEMINI_COST_PER_CALL = 0.0003;

async function fetchCostTrend(): Promise<DayCost[]> {
  const { data, error } = await supabase.rpc("pipeline_health_stats");
  if (error) throw error;

  const raw = data as {
    throughput_7d?: Array<Record<string, unknown> & { day: string }>;
  };
  const days: DayCost[] = [];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayName = DAYS[d.getDay()];

    const found = (raw.throughput_7d || []).find((t) => t.day === iso);
    let gemini = 0;
    let apify = 0;
    let storage = 0;

    if (found) {
      for (const [key, val] of Object.entries(found)) {
        if (key === "day") continue;
        const wf = val as Record<string, number> | null;
        if (!wf) continue;
        gemini += wf.gemini_calls ?? 0;
        apify += wf.apify_calls ?? 0;
        storage += wf.storage_uploads ?? 0;
      }
    }

    days.push({
      day: iso,
      label: `${dayName} ${d.getDate()}`,
      gemini,
      apify,
      storage,
      estCostUsd: gemini * GEMINI_COST_PER_CALL,
    });
  }

  return days;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !label) return null;

  const gemini = payload.find((p) => p.dataKey === "gemini")?.value ?? 0;
  const apify = payload.find((p) => p.dataKey === "apify")?.value ?? 0;
  const storage = payload.find((p) => p.dataKey === "storage")?.value ?? 0;
  const est = gemini * GEMINI_COST_PER_CALL;

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
      {[
        { label: "Gemini", value: gemini, color: "#a78bfa" },
        { label: "Apify", value: apify, color: "#60a5fa" },
        { label: "Storage", value: storage, color: "#4ade80" },
      ].map((item) => (
        <div
          key={item.label}
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
              background: item.color,
            }}
          />
          <span style={{ color: "var(--ink-secondary)" }}>{item.label}</span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 600,
              color: "var(--ink)",
              marginLeft: "auto",
            }}
          >
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          marginTop: 4,
          paddingTop: 4,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          color: "var(--ink-tertiary)",
        }}
      >
        Est. cost: ${est.toFixed(2)}
      </div>
    </div>
  );
}

export default function PipelineCostTrend() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pipeline-cost-trend"],
    queryFn: fetchCostTrend,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  if (error) return null;
  if (isLoading || !data) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          height: 200,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    );
  }

  const totalGemini = data.reduce((s, d) => s + d.gemini, 0);
  const totalApify = data.reduce((s, d) => s + d.apify, 0);
  const totalStorage = data.reduce((s, d) => s + d.storage, 0);
  const totalCost = data.reduce((s, d) => s + d.estCostUsd, 0);

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          7-day cost trend
        </span>
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            color: "var(--ink-faint)",
          }}
        >
          <span>
            Gemini:{" "}
            <strong style={{ color: "#a78bfa" }}>
              {totalGemini.toLocaleString()}
            </strong>
          </span>
          <span>
            Apify:{" "}
            <strong style={{ color: "#60a5fa" }}>
              {totalApify.toLocaleString()}
            </strong>
          </span>
          <span>
            Uploads:{" "}
            <strong style={{ color: "#4ade80" }}>
              {totalStorage.toLocaleString()}
            </strong>
          </span>
          <span>
            Est:{" "}
            <strong style={{ color: "var(--ink)" }}>
              ${totalCost.toFixed(2)}
            </strong>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{
              fontSize: 11,
              fill: "var(--ink-tertiary)",
              fontFamily: "DM Sans",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: "var(--ink-tertiary)",
              fontFamily: "JetBrains Mono",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{
              fontSize: 11,
              fontFamily: "DM Sans",
              color: "var(--ink-tertiary)",
            }}
          />
          <Area
            type="monotone"
            dataKey="gemini"
            name="Gemini"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.12}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="apify"
            name="Apify"
            stroke="#60a5fa"
            fill="#60a5fa"
            fillOpacity={0.12}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="storage"
            name="Storage"
            stroke="#4ade80"
            fill="#4ade80"
            fillOpacity={0.12}
            strokeWidth={2}
            dot={false}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
