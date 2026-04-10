interface HitlStatus {
  platform: string;
  status: string;
  count: number;
}

interface RagTotal {
  platform: string;
  total: number;
}

interface Props {
  platform: string;
  statuses: HitlStatus[];
  ragTotal: number;
}

const STATUS_ORDER = [
  "WATCH",
  "PROCESSING",
  "QUEUED_UPLOAD",
  "UPLOADED",
  "DISCARD",
  "REJECTED",
  "DUPLICATE",
  "ERROR",
];

const STATUS_COLORS: Record<string, string> = {
  WATCH: "#fbbf24",
  PROCESSING: "#60a5fa",
  QUEUED_UPLOAD: "#22d3ee",
  UPLOADED: "#4ade80",
  DISCARD: "#71717a",
  REJECTED: "#a1a1aa",
  DUPLICATE: "#a1a1aa",
  ERROR: "#f87171",
};

export default function PipelineFunnelCard({
  platform,
  statuses,
  ragTotal,
}: Props) {
  const sorted = STATUS_ORDER.map((s) => {
    const found = statuses.find((st) => st.status === s);
    return { status: s, count: found?.count ?? 0 };
  }).filter((s) => s.count > 0);

  const total = sorted.reduce((sum, s) => sum + s.count, 0);

  // Hit rate = UPLOADED / (UPLOADED + DISCARD + REJECTED + DUPLICATE)
  const uploaded = sorted.find((s) => s.status === "UPLOADED")?.count ?? 0;
  const denominator =
    uploaded +
    (sorted.find((s) => s.status === "DISCARD")?.count ?? 0) +
    (sorted.find((s) => s.status === "REJECTED")?.count ?? 0) +
    (sorted.find((s) => s.status === "DUPLICATE")?.count ?? 0);
  const hitRate =
    denominator > 0 ? ((uploaded / denominator) * 100).toFixed(1) : null;

  const watchCount = sorted.find((s) => s.status === "WATCH")?.count ?? 0;
  const queuedCount =
    sorted.find((s) => s.status === "QUEUED_UPLOAD")?.count ?? 0;

  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: 16,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          {platform}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
          }}
        >
          · {ragTotal.toLocaleString()} in RAG DB
        </span>
      </div>

      {/* Stacked bar */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          {sorted.map((s) => (
            <div
              key={s.status}
              style={{
                width: `${(s.count / total) * 100}%`,
                background: STATUS_COLORS[s.status] ?? "#71717a",
                minWidth: s.count > 0 ? 2 : 0,
                transition: "width 500ms ease",
              }}
            />
          ))}
        </div>
      )}

      {/* Status grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {sorted.map((s) => {
          const isPulsing = s.status === "PROCESSING" && s.count > 0;
          return (
            <div
              key={s.status}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: STATUS_COLORS[s.status] ?? "#71717a",
                  flexShrink: 0,
                  ...(isPulsing
                    ? { animation: "pulse-dot 2s ease-in-out infinite" }
                    : {}),
                }}
              />
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 11,
                  color: "var(--ink-tertiary)",
                  whiteSpace: "nowrap",
                }}
              >
                {s.status.replace("_", " ")}
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginLeft: "auto",
                }}
              >
                {s.count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hit rate */}
      {hitRate !== null && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-secondary)",
            marginBottom: watchCount > 100 || queuedCount > 50 ? 8 : 0,
          }}
        >
          Hit rate:{" "}
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {hitRate}%
          </span>
        </div>
      )}

      {/* Queue warnings */}
      {watchCount > 100 && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: "#fbbf24",
            marginBottom: queuedCount > 50 ? 4 : 0,
          }}
        >
          Carl backlog: {watchCount.toLocaleString()} items
        </div>
      )}
      {queuedCount > 50 && (
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: "#22d3ee",
          }}
        >
          Oscar backlog: {queuedCount.toLocaleString()} items
        </div>
      )}
    </div>
  );
}

export type { HitlStatus, RagTotal };
