import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { SCRAPER_LABELS } from "@/components/admin/health/constants";
import { relativeTime } from "@/components/admin/health/helpers";
import HealthLoadingSkeleton from "./HealthLoadingSkeleton";

interface ErrorRow {
  id: string;
  scraper_name: string;
  scraper_group: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  rows_inserted: number | null;
}

async function fetchErrors(): Promise<ErrorRow[]> {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from("scraper_runs")
    .select(
      "id,scraper_name,scraper_group,started_at,completed_at,error_message,rows_inserted",
    )
    .eq("status", "error")
    .gte("started_at", sevenDaysAgo)
    .order("started_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data as ErrorRow[]) || [];
}

function buildDailyChart(rows: ErrorRow[]) {
  const buckets: Record<string, number> = {};
  // Pre-fill last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    buckets[key] = 0;
  }
  for (const r of rows) {
    const key = r.started_at.split("T")[0];
    if (buckets[key] !== undefined) buckets[key]++;
  }
  return Object.entries(buckets).map(([date, count]) => ({
    date,
    label: new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    count,
  }));
}

function buildByScraperChart(rows: ErrorRow[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.scraper_name] = (counts[r.scraper_name] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({
      name: SCRAPER_LABELS[name] || name,
      rawName: name,
      count,
    }));
}

export default function HealthErrors() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["health-error-trends"],
    queryFn: fetchErrors,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const dailyData = rows ? buildDailyChart(rows) : [];
  const byScraperData = rows ? buildByScraperChart(rows) : [];
  const totalErrors = rows?.length || 0;
  const uniqueScrapers = rows
    ? new Set(rows.map((r) => r.scraper_name)).size
    : 0;

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
        Error Trends
      </h2>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Errors (7d)", value: totalErrors, color: "#ef4444" },
          {
            label: "Affected scrapers",
            value: uniqueScrapers,
            color: "var(--ink)",
          },
          {
            label: "Today",
            value:
              dailyData.length > 0 ? dailyData[dailyData.length - 1].count : 0,
            color:
              dailyData.length > 0 && dailyData[dailyData.length - 1].count > 0
                ? "#ef4444"
                : "#34d399",
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
                fontSize: 20,
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
          {/* Daily error chart */}
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
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 12,
              }}
            >
              Errors per day
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "rgba(255,255,255,0.4)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "rgba(255,255,255,0.3)",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
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
                  itemStyle={{ color: "#ef4444" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {dailyData.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={
                        entry.count > 0 ? "#ef4444" : "rgba(255,255,255,0.06)"
                      }
                      fillOpacity={entry.count > 0 ? 0.8 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Errors by scraper */}
          {byScraperData.length > 0 && (
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
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 12,
                }}
              >
                Most errors by scraper
              </div>
              <ResponsiveContainer
                width="100%"
                height={Math.max(120, byScraperData.length * 28)}
              >
                <BarChart
                  data={byScraperData}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.06)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{
                      fill: "rgba(255,255,255,0.3)",
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{
                      fill: "rgba(255,255,255,0.55)",
                      fontSize: 11,
                      fontFamily: "DM Sans",
                    }}
                    axisLine={false}
                    tickLine={false}
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
                    itemStyle={{ color: "#ef4444" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#ef4444"
                    fillOpacity={0.7}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Error detail list */}
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
                padding: "14px 16px 10px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
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
                All errors (7d)
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                }}
              >
                {totalErrors} total
              </span>
            </div>

            {(rows || []).length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#34d399",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 13,
                }}
              >
                No errors in the last 7 days
              </div>
            ) : (
              (rows || []).map((row) => {
                const isExpanded = expandedId === row.id;
                return (
                  <div
                    key={row.id}
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#ef4444",
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
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
                          {SCRAPER_LABELS[row.scraper_name] || row.scraper_name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--ink-faint)",
                            fontFamily: '"JetBrains Mono", monospace',
                          }}
                        >
                          {row.scraper_group}
                        </span>
                      </div>
                      {row.error_message && (
                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 11,
                            fontFamily: '"JetBrains Mono", monospace',
                            color: "#ef4444",
                            opacity: 0.8,
                            overflow: "hidden",
                            ...(isExpanded
                              ? {
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-all",
                                }
                              : {
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                }),
                          }}
                        >
                          {isExpanded
                            ? row.error_message
                            : row.error_message?.slice(0, 120)}
                          {!isExpanded &&
                            (row.error_message?.length ?? 0) > 120 &&
                            " ..."}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "var(--ink-faint)",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {relativeTime(row.completed_at || row.started_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
