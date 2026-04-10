import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SCRAPER_LABELS } from "@/components/admin/health/constants";
import {
  relativeTime,
  formatDuration,
  formatNumber,
} from "@/components/admin/health/helpers";

interface ActivityRow {
  id: string;
  scraper_name: string;
  scraper_group: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  rows_inserted: number | null;
  entities_created: number | null;
  entities_matched: number | null;
  duration_ms: number | null;
  error_message: string | null;
}

type StatusFilter = "all" | "success" | "error" | "running";

const STATUS_DOT: Record<string, string> = {
  success: "#34d399",
  error: "#ef4444",
  running: "#f59e0b",
};

async function fetchActivity(): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("scraper_runs")
    .select(
      "id,scraper_name,scraper_group,status,started_at,completed_at,rows_inserted,entities_created,entities_matched,duration_ms,error_message",
    )
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data as ActivityRow[]) || [];
}

export default function HealthActivity() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["health-activity-feed"],
    queryFn: fetchActivity,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const filtered =
    rows?.filter((r) => statusFilter === "all" || r.status === statusFilter) ||
    [];

  const errorCount = rows?.filter((r) => r.status === "error").length || 0;
  const runningCount = rows?.filter((r) => r.status === "running").length || 0;
  const successCount = rows?.filter((r) => r.status === "success").length || 0;

  const filterBtn = (active: boolean) => ({
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: active ? "rgba(232, 67, 10, 0.1)" : "transparent",
    color: active ? "#e8430a" : "var(--ink-tertiary)",
    cursor: "pointer" as const,
    fontSize: 11,
    fontFamily: '"DM Sans", sans-serif' as const,
    fontWeight: active ? 600 : 500,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Live Activity
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            color: "var(--ink-faint)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#34d399",
              animation: "pulse 2s infinite",
            }}
          />
          Auto-refresh 30s
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          {
            label: "Success",
            value: successCount,
            color: "#34d399",
            filter: "success" as StatusFilter,
          },
          {
            label: "Running",
            value: runningCount,
            color: "#f59e0b",
            filter: "running" as StatusFilter,
          },
          {
            label: "Errors",
            value: errorCount,
            color: "#ef4444",
            filter: "error" as StatusFilter,
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() =>
              setStatusFilter(statusFilter === s.filter ? "all" : s.filter)
            }
            style={{
              ...filterBtn(statusFilter === s.filter),
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: s.color,
              }}
            />
            {s.label}
            <strong
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                color: statusFilter === s.filter ? "#e8430a" : "var(--ink)",
              }}
            >
              {s.value}
            </strong>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
            }}
          >
            Loading activity...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
            }}
          >
            No matching activity
          </div>
        ) : (
          filtered.map((row) => {
            const label = SCRAPER_LABELS[row.scraper_name] || row.scraper_name;
            const dotColor = STATUS_DOT[row.status] || "#9ca3af";
            const isExpanded = expandedError === row.id;
            const hasError = row.status === "error" && row.error_message;

            return (
              <div
                key={row.id}
                onClick={
                  hasError
                    ? () => setExpandedError(isExpanded ? null : row.id)
                    : undefined
                }
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border)",
                  cursor: hasError ? "pointer" : "default",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                {/* Status dot */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    marginTop: 5,
                    ...(row.status === "running"
                      ? { animation: "pulse 2s infinite" }
                      : {}),
                  }}
                />

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      flexWrap: "wrap",
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
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: `${dotColor}18`,
                        color: dotColor,
                        textTransform: "uppercase",
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {row.status}
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

                  {/* Stats row */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 3,
                      fontSize: 11,
                      fontFamily: '"JetBrains Mono", monospace',
                      color: "var(--ink-faint)",
                      flexWrap: "wrap",
                    }}
                  >
                    {row.rows_inserted != null && row.rows_inserted > 0 && (
                      <span>
                        <span style={{ color: "var(--ink-secondary)" }}>
                          {formatNumber(row.rows_inserted)}
                        </span>{" "}
                        rows
                      </span>
                    )}
                    {row.entities_created != null &&
                      row.entities_created > 0 && (
                        <span>
                          +
                          <span style={{ color: "var(--ink-secondary)" }}>
                            {row.entities_created}
                          </span>{" "}
                          entities
                        </span>
                      )}
                    {row.duration_ms != null && (
                      <span>{formatDuration(row.duration_ms)}</span>
                    )}
                  </div>

                  {/* Error message (collapsed by default) */}
                  {hasError && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: "#ef4444",
                        opacity: 0.8,
                        overflow: "hidden",
                        ...(isExpanded
                          ? { whiteSpace: "pre-wrap", wordBreak: "break-all" }
                          : {
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }),
                      }}
                    >
                      {isExpanded
                        ? row.error_message
                        : row.error_message!.slice(0, 120)}
                      {!isExpanded && row.error_message!.length > 120 && " ..."}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
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
    </div>
  );
}
