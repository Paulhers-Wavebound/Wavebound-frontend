import { useHealthData } from "./HealthLayout";
import CronGapDetection from "@/components/admin/health/CronGapDetection";
import CronTimeline from "./components/CronTimeline";
import { CRON_SCHEDULES } from "@/components/admin/health/constants";

export default function HealthCron() {
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
        Cron Jobs
      </h2>

      {/* Gap detection */}
      {data.scraper_run_history && data.scraper_run_history.length > 0 && (
        <CronGapDetection history={data.scraper_run_history} />
      )}

      {/* 48h timeline */}
      {data.scraper_run_history && data.scraper_run_history.length > 0 && (
        <CronTimeline history={data.scraper_run_history} />
      )}

      {/* Schedule reference */}
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
            Expected Schedule
          </span>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {["Group", "Interval", "Expected UTC", "Overdue After"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 16px",
                      fontWeight: 600,
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {Object.entries(CRON_SCHEDULES).map(([group, sched]) => (
              <tr key={group}>
                <td
                  style={{
                    padding: "8px 16px",
                    color: "var(--ink)",
                    fontWeight: 500,
                    borderBottom: "1px solid var(--border)",
                    textTransform: "capitalize",
                  }}
                >
                  {group.replace(/_/g, " ")}
                </td>
                <td
                  style={{
                    padding: "8px 16px",
                    color: "var(--ink-secondary)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Every {sched.interval_hours}h
                </td>
                <td
                  style={{
                    padding: "8px 16px",
                    color: "var(--ink-secondary)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {sched.expected_utc || "—"}
                </td>
                <td
                  style={{
                    padding: "8px 16px",
                    color: "var(--ink-secondary)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {Math.round(sched.interval_hours * 1.5)}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
