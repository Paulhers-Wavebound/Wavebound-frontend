import type { ScCreditSnapshot } from "@/components/admin/health/types";
import {
  formatCompact,
  formatDateShort,
} from "@/components/admin/health/helpers";

export default function QuotaHistoryChart({
  history,
}: {
  history: ScCreditSnapshot[];
}) {
  if (history.length < 2) return null;

  // Sort ascending by time for the chart
  const sorted = [...history].sort(
    (a, b) =>
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
  );

  const values = sorted.map((h) => h.credits_remaining);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const width = 500;
  const height = 120;
  const padX = 10;
  const padY = 10;

  const points = sorted.map((h, i) => {
    const x = padX + (i / (sorted.length - 1)) * (width - padX * 2);
    const y =
      padY + (1 - (h.credits_remaining - min) / range) * (height - padY * 2);
    return { x, y, credits: h.credits_remaining, date: h.completed_at };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Fill area under line
  const area = `${points[0].x},${height - padY} ${polyline} ${points[points.length - 1].x},${height - padY}`;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
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
          SC Credit Balance (7d)
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "var(--ink-faint)",
            }}
          >
            High: {formatCompact(max)}
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "var(--ink-faint)",
            }}
          >
            Low: {formatCompact(min)}
          </span>
        </div>
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        {/* Area fill */}
        <polygon points={area} fill="rgba(232, 67, 10, 0.08)" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#e8430a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#e8430a">
            <title>
              {formatCompact(p.credits)} credits — {formatDateShort(p.date)}
            </title>
          </circle>
        ))}
      </svg>

      {/* X-axis labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9,
            color: "var(--ink-faint)",
          }}
        >
          {formatDateShort(sorted[0].completed_at)}
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9,
            color: "var(--ink-faint)",
          }}
        >
          {formatDateShort(sorted[sorted.length - 1].completed_at)}
        </span>
      </div>
    </div>
  );
}
