import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  MonitoringSnapshot,
  MonitoringHistorySummary,
  FORMAT_COLORS,
} from "@/types/soundIntelligence";
import {
  getSoundMonitoringHistory,
  formatNumber,
} from "@/utils/soundIntelligenceApi";
import { Loader2, Activity } from "lucide-react";

interface MonitoringTrendChartProps {
  jobId: string;
}

interface ChartPoint {
  time: string;
  label: string;
  total_views: number;
  [format: string]: string | number;
}

function buildChartData(snapshots: MonitoringSnapshot[]): {
  data: ChartPoint[];
  formats: string[];
} {
  // Collect all format names across all snapshots
  const formatSet = new Set<string>();
  for (const s of snapshots) {
    for (const name of Object.keys(s.format_stats)) {
      formatSet.add(name);
    }
  }
  const formats = Array.from(formatSet).sort();

  const data: ChartPoint[] = snapshots.map((s) => {
    const point: ChartPoint = {
      time: s.captured_at,
      label: new Date(s.captured_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      total_views: s.total_views,
    };
    for (const name of formats) {
      point[name] = s.format_stats[name]?.views ?? 0;
    }
    return point;
  });

  return { data, formats };
}

export default function MonitoringTrendChart({
  jobId,
}: MonitoringTrendChartProps) {
  const [snapshots, setSnapshots] = useState<MonitoringSnapshot[]>([]);
  const [summary, setSummary] = useState<MonitoringHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await getSoundMonitoringHistory(jobId, 24);
      setSnapshots(res.snapshots);
      setSummary(res.summary);
    } catch {
      // Non-critical — silently fail
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Don't render until we have at least 2 snapshots
  if (loading) {
    return (
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          padding: "40px 20px",
          borderTop: "0.5px solid var(--card-edge)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Loader2
          size={18}
          color="var(--ink-tertiary)"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-tertiary)",
          }}
        >
          Loading monitoring data...
        </span>
      </div>
    );
  }

  if (snapshots.length < 2) return null;

  const { data, formats } = buildChartData(snapshots);

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={16} color="var(--accent)" />
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            Real-Time Monitoring
          </span>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: "var(--ink-faint)",
              padding: "2px 8px",
              borderRadius: 100,
              background: "var(--overlay-subtle)",
            }}
          >
            Last{" "}
            {summary?.hours_span != null
              ? `${summary.hours_span.toFixed(1)}h`
              : "24h"}
          </span>
        </div>
        {summary && summary.total_view_growth > 0 && (
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: "#30D158",
            }}
          >
            +{formatNumber(summary.total_view_growth)} views
          </span>
        )}
      </div>

      {/* Growth pills for formats */}
      {summary?.format_growth &&
        Object.keys(summary.format_growth).length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {Object.entries(summary.format_growth)
              .filter(([, g]) => g.growth_pct > 0)
              .sort(([, a], [, b]) => b.growth_pct - a.growth_pct)
              .slice(0, 5)
              .map(([name, g]) => (
                <span
                  key={name}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 100,
                    background: `${FORMAT_COLORS[name] || "#8E8E93"}18`,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    color: FORMAT_COLORS[name] || "var(--ink-secondary)",
                  }}
                >
                  {name}
                  <span style={{ fontWeight: 700 }}>+{g.growth_pct}%</span>
                  <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>
                    +{formatNumber(g.views_delta)}
                  </span>
                </span>
              ))}
          </div>
        )}

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fill: "rgba(255,255,255,0.4)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fill: "rgba(255,255,255,0.4)",
            }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "#1C1C1E",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.55)" }}
            formatter={(value: number, name: string) => [
              formatNumber(value),
              name,
            ]}
          />
          {/* Total views line — thicker, semi-transparent */}
          <Line
            type="monotone"
            dataKey="total_views"
            name="Total Views"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2.5}
            dot={false}
            strokeDasharray="4 4"
          />
          {/* Per-format lines */}
          {formats.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              name={name}
              stroke={FORMAT_COLORS[name] || "#8E8E93"}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: FORMAT_COLORS[name] || "#8E8E93" }}
            />
          ))}
          <Legend
            iconType="circle"
            iconSize={6}
            wrapperStyle={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              paddingTop: 8,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
