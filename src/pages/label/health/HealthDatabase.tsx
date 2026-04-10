import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "@/components/admin/health/constants";
import { formatCompact } from "@/components/admin/health/helpers";

interface TableInfo {
  name: string;
  estimated_rows: number;
  total_bytes: number | null;
  size_pretty: string | null;
  table_bytes?: number;
  index_bytes?: number;
  toast_bytes?: number;
}

interface DbSizesData {
  tables: TableInfo[];
  total_bytes: number | null;
  total_pretty: string | null;
  method: string;
  error?: string;
}

function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}

// Categorize tables
function getCategory(name: string): string {
  if (name.startsWith("wb_observations")) return "Observations";
  if (name.startsWith("wb_")) return "Core Data";
  if (
    name.startsWith("hitl_") ||
    name.startsWith("video_") ||
    name.startsWith("pipeline_")
  )
    return "Pipeline";
  if (name.startsWith("sound_")) return "Sound Intelligence";
  if (name.startsWith("spotify_") || name.startsWith("shazam_"))
    return "Platform Snapshots";
  if (
    [
      "daily_summaries",
      "daily_summaries_geo",
      "song_velocity",
      "artist_catalog_summary",
      "playlist_momentum",
      "instagram_artist_daily",
      "instagram_video_summary",
      "tiktok_artist_daily",
      "tiktok_video_summary",
      "tiktok_global_benchmarks",
      "entity_health",
      "song_health",
      "market_health",
      "platform_coverage",
      "cross_platform_signal",
      "discovery_streaming_divergence",
      "geographic_footprint",
      "market_velocity",
      "artist_score",
      "artist_momentum",
      "artist_alerts",
      "artist_intel_feed",
      "catalog_intelligence",
      "market_opportunity",
      "market_opportunity_v2",
      "market_spillover",
      "roster_overview",
      "anomalies",
    ].includes(name)
  )
    return "dbt Models";
  if (name.startsWith("chat_") || name.startsWith("user_")) return "App State";
  return "Other";
}

async function fetchDbSizes(): Promise<DbSizesData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/db-sizes`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type SortKey = "size" | "rows" | "name";

export default function HealthDatabase() {
  const [sortBy, setSortBy] = useState<SortKey>("rows");
  const [catFilter, setCatFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["db-sizes"],
    queryFn: fetchDbSizes,
    refetchInterval: 300_000, // 5 min
    staleTime: 120_000,
  });

  const tables = data?.tables || [];
  const hasBytes = tables.some((t) => t.total_bytes != null);

  // Group and count
  const categories = new Set(tables.map((t) => getCategory(t.name)));
  const catArray = Array.from(categories).sort();

  const filtered =
    catFilter === "all"
      ? tables
      : tables.filter((t) => getCategory(t.name) === catFilter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "size") return (b.total_bytes || 0) - (a.total_bytes || 0);
    if (sortBy === "rows") return b.estimated_rows - a.estimated_rows;
    return a.name.localeCompare(b.name);
  });

  const totalRows = tables.reduce((s, t) => s + t.estimated_rows, 0);

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

  const filterBtn = (active: boolean) => ({
    padding: "4px 8px",
    borderRadius: 4,
    border: "1px solid var(--border)",
    background: active ? "rgba(232, 67, 10, 0.1)" : "transparent",
    color: active ? "#e8430a" : "var(--ink-faint)",
    cursor: "pointer" as const,
    fontSize: 10,
    fontFamily: '"DM Sans", sans-serif' as const,
    fontWeight: active ? 600 : 400,
  });

  // Find biggest table for bar widths
  const maxRows =
    sorted.length > 0
      ? sorted.reduce((m, t) => Math.max(m, t.estimated_rows), 0)
      : 1;

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
        Database
      </h2>

      {error ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "1px solid #ef444433",
            padding: 16,
            color: "#ef4444",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
          }}
        >
          Failed to load: {(error as Error).message}
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: "Tables",
                value: tables.length.toString(),
                color: "var(--ink)",
              },
              {
                label: "Total rows",
                value: formatCompact(totalRows),
                color: "var(--ink)",
              },
              ...(data?.total_pretty
                ? [
                    {
                      label: "Total size",
                      value: data.total_pretty,
                      color: "#e8430a",
                    },
                  ]
                : []),
              {
                label: "Method",
                value: data?.method || "loading",
                color: "var(--ink-faint)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--surface)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  padding: "10px 14px",
                  minWidth: 90,
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
                    fontSize: 16,
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

          {/* Filters + sort */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Category:
              </span>
              <button
                onClick={() => setCatFilter("all")}
                style={filterBtn(catFilter === "all")}
              >
                All
              </button>
              {catArray.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  style={filterBtn(catFilter === c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Sort:
              </span>
              {sortBtn("rows", "Rows")}
              {hasBytes && sortBtn("size", "Size")}
              {sortBtn("name", "Name")}
            </div>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: 24,
                color: "var(--ink-faint)",
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
              }}
            >
              Loading database sizes...
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
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
                      "Table",
                      "Category",
                      "Rows",
                      "",
                      ...(hasBytes ? ["Size"] : []),
                    ].map((h, i) => (
                      <th
                        key={`${h}-${i}`}
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
                          ...(h === "" ? { width: "30%" } : {}),
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => {
                    const cat = getCategory(t.name);
                    const pct =
                      maxRows > 0 ? (t.estimated_rows / maxRows) * 100 : 0;

                    return (
                      <tr
                        key={t.name}
                        style={{
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "7px 12px",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                            color: "var(--ink)",
                            fontWeight: 500,
                          }}
                        >
                          {t.name}
                        </td>
                        <td
                          style={{
                            padding: "7px 12px",
                            fontSize: 10,
                            color: "var(--ink-faint)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cat}
                        </td>
                        <td
                          style={{
                            padding: "7px 12px",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                            color: "var(--ink-secondary)",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.estimated_rows.toLocaleString()}
                        </td>
                        <td style={{ padding: "7px 12px" }}>
                          <div
                            style={{
                              height: 6,
                              borderRadius: 3,
                              background: "rgba(255,255,255,0.04)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: "#e8430a",
                                borderRadius: 3,
                                opacity: 0.6,
                                minWidth: pct > 0 ? 2 : 0,
                              }}
                            />
                          </div>
                        </td>
                        {hasBytes && (
                          <td
                            style={{
                              padding: "7px 12px",
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 11,
                              color: "var(--ink-faint)",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatBytes(t.total_bytes)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
