import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "@/components/admin/health/constants";
import {
  relativeTime,
  formatDuration,
} from "@/components/admin/health/helpers";

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string | null;
  status: string;
  mode: string;
  startedAt: string | null;
  stoppedAt: string | null;
  durationMs: number | null;
}

interface N8nStats {
  total_workflows: number;
  active_workflows: number;
  executions_24h: number;
  errors_24h: number;
  success_24h: number;
  running: number;
}

interface N8nData {
  workflows: Workflow[];
  executions: Execution[];
  stats: N8nStats | null;
  error?: string;
}

const STATUS_COLORS: Record<string, string> = {
  success: "#34d399",
  error: "#ef4444",
  crashed: "#ef4444",
  running: "#f59e0b",
  waiting: "#3b82f6",
  unknown: "#6b7280",
};

async function fetchN8nStatus(): Promise<N8nData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/n8n-status`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type ViewMode = "executions" | "workflows";

export default function HealthN8n() {
  const [view, setView] = useState<ViewMode>("executions");

  const { data, isLoading, error } = useQuery({
    queryKey: ["n8n-status"],
    queryFn: fetchN8nStatus,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const stats = data?.stats;

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
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        n8n Workflows
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
      ) : data?.error ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: 24,
            textAlign: "center",
            color: "var(--ink-faint)",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
          }}
        >
          {data.error}
        </div>
      ) : (
        <>
          {/* Summary strip */}
          {stats && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                {
                  label: "Workflows",
                  value: stats.total_workflows,
                  color: "var(--ink)",
                },
                {
                  label: "Active",
                  value: stats.active_workflows,
                  color: "#34d399",
                },
                {
                  label: "Runs (24h)",
                  value: stats.executions_24h,
                  color: "var(--ink)",
                },
                {
                  label: "Success",
                  value: stats.success_24h,
                  color: "#34d399",
                },
                {
                  label: "Errors",
                  value: stats.errors_24h,
                  color: stats.errors_24h > 0 ? "#ef4444" : "var(--ink-faint)",
                },
                {
                  label: "Running",
                  value: stats.running,
                  color: stats.running > 0 ? "#f59e0b" : "var(--ink-faint)",
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
                      fontSize: 18,
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
          )}

          {/* View toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setView("executions")}
              style={filterBtn(view === "executions")}
            >
              Recent Executions
            </button>
            <button
              onClick={() => setView("workflows")}
              style={filterBtn(view === "workflows")}
            >
              All Workflows
            </button>
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
              Loading n8n data...
            </div>
          ) : view === "executions" ? (
            /* Recent executions */
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              {(data?.executions || []).length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "var(--ink-faint)",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                  }}
                >
                  No recent executions
                </div>
              ) : (
                (data?.executions || []).map((ex) => {
                  const dotColor =
                    STATUS_COLORS[ex.status] || STATUS_COLORS.unknown;
                  return (
                    <div
                      key={ex.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: dotColor,
                          flexShrink: 0,
                          ...(ex.status === "running"
                            ? { animation: "pulse 2s infinite" }
                            : {}),
                        }}
                      />
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
                            {ex.workflowName || `Workflow #${ex.workflowId}`}
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
                            {ex.status}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--ink-faint)",
                              fontFamily: '"JetBrains Mono", monospace',
                            }}
                          >
                            {ex.mode}
                          </span>
                        </div>
                        {ex.durationMs != null && (
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: '"JetBrains Mono", monospace',
                              color: "var(--ink-faint)",
                            }}
                          >
                            {formatDuration(ex.durationMs)}
                          </span>
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
                        {relativeTime(ex.startedAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Workflow list */
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
                    {["Status", "Workflow", "Nodes", "Updated"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 12px",
                          fontWeight: 600,
                          fontSize: 10,
                          color: "var(--ink-faint)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.workflows || [])
                    .sort((a, b) => {
                      // Active first, then by name
                      if (a.active !== b.active) return a.active ? -1 : 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((wf) => (
                      <tr
                        key={wf.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <td style={{ padding: "8px 12px", width: 60 }}>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: "1px 5px",
                              borderRadius: 4,
                              background: wf.active
                                ? "#34d39918"
                                : "rgba(255,255,255,0.04)",
                              color: wf.active ? "#34d399" : "var(--ink-faint)",
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono", monospace',
                            }}
                          >
                            {wf.active ? "Active" : "Off"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: wf.active
                                ? "var(--ink)"
                                : "var(--ink-faint)",
                            }}
                          >
                            {wf.name}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                            color: "var(--ink-faint)",
                          }}
                        >
                          {wf.nodeCount}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 11,
                            color: "var(--ink-faint)",
                          }}
                        >
                          {relativeTime(wf.updatedAt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
