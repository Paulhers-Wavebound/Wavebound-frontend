interface ActivityEntry {
  worker: string;
  action: string;
  notes: string | null;
  items_passed: number;
  items_discarded: number;
  created_at: string;
}

interface Props {
  entries: ActivityEntry[];
}

const WORKER_COLORS: Record<string, string> = {
  Ruben: "#60a5fa",
  Carl: "#fbbf24",
  Oscar: "#4ade80",
  Klaus: "#71717a",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(s: string | null, max: number): string {
  if (!s) return "—";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export default function PipelineActivityFeed({ entries }: Props) {
  if (entries.length === 0) return null;

  const rows = entries.slice(0, 10);

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ink-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 12,
        }}
      >
        Recent activity
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((entry, i) => {
          const color = WORKER_COLORS[entry.worker] ?? "#71717a";
          const items =
            entry.items_discarded > 0
              ? `${entry.items_passed} / ${entry.items_discarded}`
              : `${entry.items_passed} passed`;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "4px 10px",
                padding: "8px 0",
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 150ms",
              }}
            >
              {/* Time */}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                  whiteSpace: "nowrap",
                  width: 56,
                  flexShrink: 0,
                }}
              >
                {relativeTime(entry.created_at)}
              </span>

              {/* Worker badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: color,
                  background: color + "18",
                  borderRadius: 6,
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {entry.worker}
              </span>

              {/* Notes */}
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: "1 1 120px",
                  minWidth: 0,
                }}
              >
                {truncate(entry.notes, 60)}
              </span>

              {/* Items */}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--ink-tertiary)",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                  flexShrink: 0,
                }}
              >
                {items}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { ActivityEntry };
