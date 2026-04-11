import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SCRAPER_LABELS } from "@/components/admin/health/constants";
import HealthLoadingSkeleton from "./HealthLoadingSkeleton";
import {
  formatDuration,
  formatNumber,
} from "@/components/admin/health/helpers";

interface PerfRow {
  scraper_name: string;
  scraper_group: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  rows_inserted: number | null;
  status: string;
}

interface ScraperPerf {
  name: string;
  label: string;
  group: string;
  runs: PerfRow[];
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  avgRows: number;
  totalRuns: number;
  errorRate: number;
  trend: "faster" | "slower" | "stable";
}

async function fetchPerfData(): Promise<PerfRow[]> {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from("scraper_runs")
    .select(
      "scraper_name,scraper_group,started_at,completed_at,duration_ms,rows_inserted,status",
    )
    .gte("started_at", sevenDaysAgo)
    .order("started_at", { ascending: true })
    .limit(5000);

  if (error) throw error;
  return (data as PerfRow[]) || [];
}

function buildScraperPerf(rows: PerfRow[]): ScraperPerf[] {
  const grouped: Record<string, PerfRow[]> = {};
  for (const r of rows) {
    if (!grouped[r.scraper_name]) grouped[r.scraper_name] = [];
    grouped[r.scraper_name].push(r);
  }

  return Object.entries(grouped)
    .map(([name, runs]) => {
      const successRuns = runs.filter(
        (r) => r.status === "success" && r.duration_ms != null,
      );
      const durations = successRuns.map((r) => r.duration_ms ?? 0);
      const rowCounts = successRuns
        .filter((r) => r.rows_inserted != null)
        .map((r) => r.rows_inserted ?? 0);

      const avgDuration =
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;
      const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
      const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
      const avgRows =
        rowCounts.length > 0
          ? rowCounts.reduce((a, b) => a + b, 0) / rowCounts.length
          : 0;
      const errorCount = runs.filter((r) => r.status === "error").length;

      // Trend: compare avg of first half vs second half
      let trend: "faster" | "slower" | "stable" = "stable";
      if (durations.length >= 4) {
        const mid = Math.floor(durations.length / 2);
        const firstHalf =
          durations.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
        const secondHalf =
          durations.slice(mid).reduce((a, b) => a + b, 0) /
          (durations.length - mid);
        const pctChange = ((secondHalf - firstHalf) / firstHalf) * 100;
        if (pctChange > 15) trend = "slower";
        else if (pctChange < -15) trend = "faster";
      }

      return {
        name,
        label: SCRAPER_LABELS[name] || name,
        group: runs[0].scraper_group,
        runs,
        avgDuration: Math.round(avgDuration),
        maxDuration,
        minDuration,
        avgRows: Math.round(avgRows),
        totalRuns: runs.length,
        errorRate:
          runs.length > 0 ? Math.round((errorCount / runs.length) * 100) : 0,
        trend,
      };
    })
    .filter((s) => s.avgDuration > 0)
    .sort((a, b) => b.avgDuration - a.avgDuration);
}

const TREND_CONFIG = {
  faster: { label: "Faster", color: "#34d399", arrow: "↓" },
  slower: { label: "Slower", color: "#ef4444", arrow: "↑" },
  stable: { label: "Stable", color: "var(--ink-faint)", arrow: "→" },
};

type SortKey = "duration" | "rows" | "errors" | "runs";

export default function HealthPerformance() {
  const [selectedScraper, setSelectedScraper] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("duration");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["health-performance"],
    queryFn: fetchPerfData,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const scrapers = rows ? buildScraperPerf(rows) : [];

  const sorted = [...scrapers].sort((a, b) => {
    if (sortBy === "duration") return b.avgDuration - a.avgDuration;
    if (sortBy === "rows") return b.avgRows - a.avgRows;
    if (sortBy === "errors") return b.errorRate - a.errorRate;
    return b.totalRuns - a.totalRuns;
  });

  const selected = selectedScraper
    ? scrapers.find((s) => s.name === selectedScraper)
    : null;

  // Build chart data for selected scraper
  const chartData = selected
    ? selected.runs
        .filter((r) => r.status === "success" && r.duration_ms != null)
        .map((r) => ({
          time: new Date(r.started_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration: Math.round((r.duration_ms ?? 0) / 1000),
          rows: r.rows_inserted || 0,
        }))
    : [];

  const slowingCount = scrapers.filter((s) => s.trend === "slower").length;

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortBy(key)}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid var(--border)",
        background: sortBy === key ? "rgba(232, 67, 10, 0.1)" : "transparent",
        color: sortBy === key ? "#e8430a" : "var(--ink-faint)",
        cursor: "pointer",
        fontSize: 10,
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: sortBy === key ? 600 : 400,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        Performance
      </h2>

      {/* Summary */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          {
            label: "Tracked scrapers",
            value: scrapers.length,
            color: "var(--ink)",
          },
          {
            label: "Slowing down",
            value: slowingCount,
            color: slowingCount > 0 ? "#ef4444" : "#34d399",
          },
          {
            label: "Slowest avg",
            value:
              scrapers.length > 0
                ? formatDuration(sorted[0]?.avgDuration)
                : "—",
            color: "var(--ink)",
            isText: true,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--surface)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "10px 14px",
              minWidth: 100,
            }}
          >
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 10,
                fontWeight: 600,
                color: "var(--ink-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "isText" in s ? 14 : 20,
                fontWeight: 700,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <HealthLoadingSkeleton />
      ) : (
        <>
          {/* Detail chart for selected scraper */}
          {selected && chartData.length > 1 && (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 14,
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
                    color: "var(--ink)",
                  }}
                >
                  {selected.label}
                </span>
                <button
                  onClick={() => setSelectedScraper(null)}
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  Close
                </button>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: "rgba(255,255,255,0.3)",
                      fontSize: 9,
                      fontFamily: "JetBrains Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{
                      fill: "rgba(255,255,255,0.3)",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    unit="s"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1C1C1E",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      fontFamily: "DM Sans",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                    formatter={(val: number) => [`${val}s`, "Duration"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="duration"
                    stroke="#e8430a"
                    strokeWidth={2}
                    dot={{ r: 2, fill: "#e8430a" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scraper table */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                Scraper performance (7d)
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {sortBtn("duration", "Duration")}
                {sortBtn("rows", "Throughput")}
                {sortBtn("errors", "Errors")}
                {sortBtn("runs", "Runs")}
              </div>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Scraper",
                    "Runs",
                    "Avg Duration",
                    "Min / Max",
                    "Avg Rows",
                    "Error %",
                    "Trend",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 12px",
                        fontWeight: 600,
                        fontSize: 10,
                        color: "var(--ink-faint)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        borderBottom: "1px solid var(--border)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const trendCfg = TREND_CONFIG[s.trend];
                  const isSelected = selectedScraper === s.name;
                  return (
                    <tr
                      key={s.name}
                      onClick={() =>
                        setSelectedScraper(isSelected ? null : s.name)
                      }
                      style={{
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: isSelected
                          ? "rgba(232, 67, 10, 0.04)"
                          : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.02)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                      }}
                    >
                      <td style={{ padding: "8px 12px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.label}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--ink-faint)",
                            fontFamily: '"JetBrains Mono", monospace',
                          }}
                        >
                          {s.group}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {s.totalRuns}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "var(--ink)",
                          fontWeight: 600,
                        }}
                      >
                        {formatDuration(s.avgDuration)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: "var(--ink-faint)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDuration(s.minDuration)} /{" "}
                        {formatDuration(s.maxDuration)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "var(--ink-secondary)",
                        }}
                      >
                        {formatNumber(s.avgRows)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color:
                            s.errorRate > 10
                              ? "#ef4444"
                              : s.errorRate > 0
                                ? "#f59e0b"
                                : "var(--ink-faint)",
                        }}
                      >
                        {s.errorRate}%
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            fontFamily: '"JetBrains Mono", monospace',
                            color: trendCfg.color,
                          }}
                        >
                          {trendCfg.arrow} {trendCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
