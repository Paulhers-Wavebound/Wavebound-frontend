import { Activity } from "lucide-react";
import type { ScraperEntry } from "./types";
import { SCRAPER_LABELS } from "./constants";
import { relativeTime } from "./helpers";

export default function ConcurrentScrapers({
  scrapers,
}: {
  scrapers: ScraperEntry[];
}) {
  const running = scrapers.filter((s) => s.status === "running");
  const count = running.length;
  const color =
    count === 0
      ? "#9ca3af"
      : count <= 3
        ? "#34d399"
        : count <= 6
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        padding: "16px",
        flex: 1,
        minWidth: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Activity size={14} color="var(--ink-tertiary)" />
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
          Running now
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: count > 0 ? 10 : 0,
        }}
      >
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 28,
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-faint)",
          }}
        >
          scraper{count !== 1 ? "s" : ""}
        </span>
      </div>

      {running.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {running.map((s) => (
            <div
              key={s.scraper_name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 12,
                  color: "var(--ink-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {SCRAPER_LABELS[s.scraper_name] || s.scraper_name}
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  flexShrink: 0,
                }}
              >
                {relativeTime(s.started_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
