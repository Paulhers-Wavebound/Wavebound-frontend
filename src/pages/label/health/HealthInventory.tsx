import { useState } from "react";
import { useHealthData } from "./HealthLayout";
import {
  SCRIPT_INVENTORY,
  CATEGORIES_ORDER,
  type ScriptEntry,
  type ScriptStatus,
} from "./components/scraperInventory";
import {
  relativeTime,
  formatDuration,
  formatNumber,
} from "@/components/admin/health/helpers";
import type { ScraperEntry } from "@/components/admin/health/types";

const STATUS_COLORS: Record<ScriptStatus, string> = {
  active: "#34d399",
  inactive: "#9ca3af",
  manual: "#3b82f6",
  n8n: "#a855f7",
};

const STATUS_LABELS: Record<ScriptStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  manual: "Manual",
  n8n: "n8n",
};

function getRunHealth(
  entry: ScriptEntry,
  scraperMap: Record<string, ScraperEntry>,
): { color: string; label: string; lastRun: ScraperEntry | null } {
  if (!entry.scraper_name) {
    return { color: "#9ca3af", label: "No tracking", lastRun: null };
  }
  const run = scraperMap[entry.scraper_name];
  if (!run) {
    return { color: "#ef4444", label: "Never run", lastRun: null };
  }
  if (run.status === "running") {
    return { color: "#f59e0b", label: "Running", lastRun: run };
  }
  if (run.status === "error") {
    return { color: "#ef4444", label: "Error", lastRun: run };
  }
  if (run.health === "overdue") {
    return { color: "#9ca3af", label: "Overdue", lastRun: run };
  }
  return { color: "#34d399", label: "OK", lastRun: run };
}

type FilterStatus = "all" | "active" | "inactive" | "manual" | "n8n";

export default function HealthInventory() {
  const { data } = useHealthData();
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  if (!data) return null;

  // Build lookup map
  const scraperMap: Record<string, ScraperEntry> = {};
  for (const s of data.scrapers) {
    scraperMap[s.scraper_name] = s;
  }

  // Filter
  let entries = SCRIPT_INVENTORY;
  if (catFilter !== "all") {
    entries = entries.filter((e) => e.category === catFilter);
  }
  if (statusFilter !== "all") {
    entries = entries.filter((e) => e.status === statusFilter);
  }

  // Group by category
  const grouped: Record<string, ScriptEntry[]> = {};
  for (const e of entries) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  const categories =
    catFilter === "all"
      ? CATEGORIES_ORDER.filter((c) => grouped[c]?.length)
      : [catFilter].filter((c) => grouped[c]?.length);

  // Stats
  const totalScripts = SCRIPT_INVENTORY.length;
  const activeCount = SCRIPT_INVENTORY.filter(
    (e) => e.status === "active",
  ).length;
  const neverRun = SCRIPT_INVENTORY.filter(
    (e) => e.scraper_name && !scraperMap[e.scraper_name],
  ).length;
  const errorCount = SCRIPT_INVENTORY.filter(
    (e) => e.scraper_name && scraperMap[e.scraper_name]?.status === "error",
  ).length;
  const runningCount = SCRIPT_INVENTORY.filter(
    (e) => e.scraper_name && scraperMap[e.scraper_name]?.status === "running",
  ).length;

  const filterBtn = (active: boolean) => ({
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: active ? "rgba(232, 67, 10, 0.1)" : "transparent",
    color: active ? "#e8430a" : "var(--ink-tertiary)",
    cursor: "pointer" as const,
    fontSize: 11,
    fontFamily: '"DM Sans", sans-serif',
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
        Script Inventory
      </h2>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Total scripts", value: totalScripts, color: "var(--ink)" },
          { label: "Active", value: activeCount, color: "#34d399" },
          { label: "Running now", value: runningCount, color: "#f59e0b" },
          { label: "Errors", value: errorCount, color: "#ef4444" },
          { label: "Never run", value: neverRun, color: "#9ca3af" },
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

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
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
          {CATEGORIES_ORDER.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              style={filterBtn(catFilter === c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Status:
          </span>
          {(["all", "active", "inactive", "manual", "n8n"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={filterBtn(statusFilter === s)}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Category groups */}
      {categories.map((cat) => {
        const scripts = grouped[cat];
        if (!scripts) return null;

        return (
          <div
            key={cat}
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
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {cat}
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                }}
              >
                {scripts.length} script{scripts.length !== 1 ? "s" : ""}
              </span>
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
                    "Status",
                    "Script",
                    "Description",
                    "Schedule",
                    "Machine",
                    "Last Run",
                    "Rows",
                    "Duration",
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
                {scripts.map((entry) => {
                  const {
                    color: runColor,
                    label: runLabel,
                    lastRun,
                  } = getRunHealth(entry, scraperMap);
                  const statusColor = STATUS_COLORS[entry.status];

                  return (
                    <tr
                      key={entry.label}
                      style={{
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {/* Run status dot */}
                      <td style={{ padding: "8px 12px", width: 60 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: runColor,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 10,
                              color: runColor,
                              fontWeight: 600,
                            }}
                          >
                            {runLabel}
                          </span>
                        </div>
                      </td>

                      {/* Script name + type badge */}
                      <td style={{ padding: "8px 12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--ink)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {entry.label}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: "1px 5px",
                              borderRadius: 4,
                              background: `${statusColor}18`,
                              color: statusColor,
                              textTransform: "uppercase",
                              fontFamily: '"JetBrains Mono", monospace',
                              flexShrink: 0,
                            }}
                          >
                            {STATUS_LABELS[entry.status]}
                          </span>
                        </div>
                        {entry.note && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#f59e0b",
                              marginTop: 2,
                              fontStyle: "italic",
                            }}
                          >
                            {entry.note}
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td
                        style={{
                          padding: "8px 12px",
                          color: "var(--ink-secondary)",
                          fontSize: 11,
                          maxWidth: 250,
                        }}
                      >
                        {entry.description}
                        {entry.coverage && (
                          <span
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: 10,
                              color: "var(--ink-faint)",
                              marginLeft: 6,
                            }}
                          >
                            ({entry.coverage})
                          </span>
                        )}
                      </td>

                      {/* Schedule */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "var(--ink-secondary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.schedule}
                      </td>

                      {/* Machine */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontSize: 11,
                          color: "var(--ink-faint)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.machine}
                      </td>

                      {/* Last run */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: lastRun
                            ? "var(--ink-secondary)"
                            : "var(--ink-faint)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lastRun
                          ? relativeTime(
                              lastRun.completed_at || lastRun.started_at,
                            )
                          : "—"}
                      </td>

                      {/* Rows */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "var(--ink-secondary)",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lastRun?.rows_inserted != null
                          ? formatNumber(lastRun.rows_inserted)
                          : "—"}
                      </td>

                      {/* Duration */}
                      <td
                        style={{
                          padding: "8px 12px",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "var(--ink-faint)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lastRun?.duration_ms != null
                          ? formatDuration(lastRun.duration_ms)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
