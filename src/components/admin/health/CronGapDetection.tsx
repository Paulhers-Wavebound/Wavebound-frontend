import { Clock, AlertTriangle } from "lucide-react";
import type { ScraperRunHistoryEntry } from "./types";
import { CRON_SCHEDULES, SCRAPER_LABELS } from "./constants";
import { SectionHeader } from "./shared";

interface CronGap {
  scraper_name: string;
  scraper_group: string;
  expected_hours: number;
  actual_gap_hours: number;
  last_run_at: string;
  severity: "ok" | "warning" | "critical";
}

function detectGaps(history: ScraperRunHistoryEntry[]): CronGap[] {
  // Group by scraper_name, sorted by started_at desc
  const byName: Record<string, ScraperRunHistoryEntry[]> = {};
  for (const entry of history) {
    if (!byName[entry.scraper_name]) byName[entry.scraper_name] = [];
    byName[entry.scraper_name].push(entry);
  }

  const gaps: CronGap[] = [];
  const now = Date.now();

  for (const [name, runs] of Object.entries(byName)) {
    if (runs.length === 0) continue;
    const group = runs[0].scraper_group;
    const schedule = CRON_SCHEDULES[group];
    if (!schedule) continue;

    // Sort descending by started_at
    runs.sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );

    const latestRun = runs[0];
    const hoursSinceLatest =
      (now - new Date(latestRun.started_at).getTime()) / (1000 * 60 * 60);

    // Gap = time since last run vs expected interval
    const ratio = hoursSinceLatest / schedule.interval_hours;
    const severity = ratio > 2.5 ? "critical" : ratio > 1.5 ? "warning" : "ok";

    if (severity !== "ok") {
      gaps.push({
        scraper_name: name,
        scraper_group: group,
        expected_hours: schedule.interval_hours,
        actual_gap_hours: Math.round(hoursSinceLatest * 10) / 10,
        last_run_at: latestRun.started_at,
        severity,
      });
    }
  }

  // Sort critical first
  gaps.sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 };
    return order[a.severity] - order[b.severity];
  });

  return gaps;
}

export default function CronGapDetection({
  history,
}: {
  history: ScraperRunHistoryEntry[];
}) {
  const gaps = detectGaps(history);

  if (gaps.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "16px",
      }}
    >
      <SectionHeader icon={Clock} label="Cron gaps detected" />

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {gaps.map((g) => {
          const color = g.severity === "critical" ? "#ef4444" : "#f59e0b";

          return (
            <div
              key={g.scraper_name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                background:
                  g.severity === "critical"
                    ? "rgba(239, 68, 68, 0.06)"
                    : "rgba(245, 158, 11, 0.06)",
                border: `1px solid ${g.severity === "critical" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"}`,
              }}
            >
              <AlertTriangle
                size={13}
                color={color}
                style={{ flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {SCRAPER_LABELS[g.scraper_name] || g.scraper_name}
                </span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    color,
                  }}
                >
                  {g.actual_gap_hours}h gap
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: "var(--ink-faint)",
                  }}
                >
                  expected every {g.expected_hours}h
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
