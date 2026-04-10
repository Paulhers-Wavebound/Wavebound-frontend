import { AlertTriangle } from "lucide-react";

interface StuckItem {
  status: string;
  count: number;
  oldest_minutes: number;
}

interface RecentError {
  worker: string;
  error: string;
  created_at: string;
}

interface Props {
  stuckItems: StuckItem[];
  recentErrors: RecentError[];
}

function formatAge(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function PipelineAlertBanner({
  stuckItems,
  recentErrors,
}: Props) {
  const hasStuck = stuckItems.length > 0;
  const hasErrors = recentErrors.length > 0;
  if (!hasStuck && !hasErrors) return null;

  const lines: string[] = [];
  for (const s of stuckItems) {
    lines.push(
      `${s.count} item${s.count !== 1 ? "s" : ""} stuck in ${s.status} (oldest: ${formatAge(s.oldest_minutes)} ago)`,
    );
  }
  if (hasErrors) {
    lines.push(
      `${recentErrors.length} error${recentErrors.length !== 1 ? "s" : ""} in last 24h`,
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 12,
        background: "var(--red-light)",
        border: "1px solid #ef444433",
      }}
    >
      <AlertTriangle
        size={18}
        color="#ef4444"
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {lines.map((line, i) => (
          <span
            key={i}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: "#ef4444",
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
