import { Server, AlertTriangle } from "lucide-react";
import { useHealthData } from "./HealthLayout";
import { MACHINES } from "./components/machines";
import { SCRAPER_LABELS } from "@/components/admin/health/constants";
import { relativeTime } from "@/components/admin/health/helpers";
import type { ScraperEntry } from "@/components/admin/health/types";

function inferMachineStatus(
  machineScrapers: string[],
  allScrapers: ScraperEntry[],
): { status: "active" | "idle" | "unknown"; lastActivity: string | null } {
  let latestAt: string | null = null;
  for (const s of allScrapers) {
    if (!machineScrapers.includes(s.scraper_name)) continue;
    const at = s.completed_at || s.started_at;
    if (at && (!latestAt || new Date(at) > new Date(latestAt))) {
      latestAt = at;
    }
  }
  if (!latestAt) return { status: "unknown", lastActivity: null };
  const hoursAgo =
    (Date.now() - new Date(latestAt).getTime()) / (1000 * 60 * 60);
  return {
    status: hoursAgo < 26 ? "active" : "idle",
    lastActivity: latestAt,
  };
}

const STATUS_COLORS = {
  active: "#34d399",
  idle: "#f59e0b",
  unknown: "#9ca3af",
};

export default function HealthServers() {
  const { data } = useHealthData();
  if (!data) return null;

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
        Servers
      </h2>

      {/* Disclaimer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(245, 158, 11, 0.06)",
          border: "1px solid rgba(245, 158, 11, 0.15)",
        }}
      >
        <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-secondary)",
          }}
        >
          Status inferred from last scraper activity — no direct machine
          heartbeats yet
        </span>
      </div>

      {/* Machine cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 12,
        }}
      >
        {MACHINES.map((machine) => {
          const { status, lastActivity } = inferMachineStatus(
            machine.scrapers,
            data.scrapers,
          );
          const statusColor = STATUS_COLORS[status];

          // Count how many of this machine's scrapers are healthy/error
          const machineScraperEntries = data.scrapers.filter((s) =>
            machine.scrapers.includes(s.scraper_name),
          );
          const healthy = machineScraperEntries.filter(
            (s) => s.health === "healthy",
          ).length;
          const errors = machineScraperEntries.filter(
            (s) => s.health === "error",
          ).length;
          const running = machineScraperEntries.filter(
            (s) => s.status === "running",
          ).length;

          return (
            <div
              key={machine.hostname}
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Server size={16} color={statusColor} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--ink)",
                      }}
                    >
                      {machine.hostname}
                    </span>
                    {machine.temp && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(245, 158, 11, 0.12)",
                          color: "#f59e0b",
                          textTransform: "uppercase",
                          fontFamily: '"JetBrains Mono", monospace',
                        }}
                      >
                        Temp
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                    }}
                  >
                    {machine.ip}
                  </div>
                </div>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: statusColor,
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Role */}
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                  lineHeight: 1.4,
                }}
              >
                {machine.role}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    color: "var(--ink-faint)",
                  }}
                >
                  {machine.scrapers.length} scrapers
                </span>
                {machineScraperEntries.length > 0 && (
                  <>
                    <span
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: "#34d399",
                      }}
                    >
                      {healthy} ok
                    </span>
                    {errors > 0 && (
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "#ef4444",
                        }}
                      >
                        {errors} error
                      </span>
                    )}
                    {running > 0 && (
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: "#f59e0b",
                        }}
                      >
                        {running} running
                      </span>
                    )}
                  </>
                )}
                {lastActivity && (
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginLeft: "auto",
                    }}
                  >
                    Last: {relativeTime(lastActivity)}
                  </span>
                )}
              </div>

              {/* Note */}
              {machine.note && (
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    color: "#f59e0b",
                    fontStyle: "italic",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "rgba(245, 158, 11, 0.06)",
                  }}
                >
                  {machine.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
