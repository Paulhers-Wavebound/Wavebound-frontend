import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ScraperEntry, ScraperRun } from "./types";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCRAPER_LABELS } from "./constants";
import { relativeTime, formatDuration, formatNumber } from "./helpers";
import { StatusDot } from "./shared";

/* ── Run timeline ───────────────────────────────────── */

function RunTimeline({ runs }: { runs: ScraperRun[] }) {
  if (runs.length === 0) {
    return (
      <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>
        No run history available.
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{ fontSize: 11, color: "var(--ink-tertiary)", marginRight: 4 }}
        >
          Last {runs.length} runs:
        </span>
        {runs.map((run, i) => {
          const color = run.status === "success" ? "#34d399" : "#ef4444";
          const title = `${run.status} \u2014 ${run.started_at ? new Date(run.started_at).toLocaleString() : "unknown"}`;
          return (
            <span
              key={i}
              title={title}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
                cursor: "default",
              }}
            />
          );
        })}
      </div>

      {runs
        .filter((r) => r.status === "error" && r.error_message)
        .slice(0, 3)
        .map((r, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              color: "#f87171",
              background: "var(--red-light)",
              padding: "8px 12px",
              borderRadius: 8,
              fontFamily: '"JetBrains Mono", monospace',
              wordBreak: "break-word",
            }}
          >
            {r.error_message}
          </div>
        ))}

      {runs[0]?.metadata && Object.keys(runs[0].metadata).length > 0 && (
        <div style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
          <span style={{ fontWeight: 600, marginRight: 6 }}>Metadata:</span>
          {Object.entries(runs[0].metadata).map(([k, v]) => (
            <span key={k} style={{ marginRight: 12 }}>
              {k.replace(/_/g, " ")}:{" "}
              <span style={{ color: "var(--ink-secondary)" }}>{String(v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Scraper row ────────────────────────────────────── */

export default function ScraperRow({
  scraper,
  expanded,
  onToggle,
}: {
  scraper: ScraperEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [detailRuns, setDetailRuns] = useState<ScraperRun[] | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const label = SCRAPER_LABELS[scraper.scraper_name] || scraper.scraper_name;
  const isOverdue = scraper.health === "overdue";

  const handleExpand = async () => {
    const next = !expanded;
    onToggle();
    if (next && !detailRuns) {
      setLoadingDetail(true);
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/admin-health?scraper_name=${encodeURIComponent(scraper.scraper_name)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: SUPABASE_ANON_KEY,
            },
          },
        );
        if (res.ok) {
          const json = await res.json();
          setDetailRuns(json.runs || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <div>
      <button
        onClick={handleExpand}
        style={{
          display: "grid",
          gridTemplateColumns: "18px 1fr auto auto auto 18px",
          alignItems: "center",
          gap: 16,
          width: "100%",
          padding: "12px 16px",
          background: expanded ? "var(--surface-hover)" : "transparent",
          border: "none",
          borderBottom: "1px solid var(--border)",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 150ms",
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        <StatusDot health={scraper.health} />

        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink)",
              display: "block",
            }}
          >
            {label}
          </span>
          {isOverdue && (
            <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 500 }}>
              Overdue
            </span>
          )}
        </div>

        <span
          style={{
            fontSize: 12,
            color: "var(--ink-tertiary)",
            whiteSpace: "nowrap",
          }}
        >
          {relativeTime(scraper.completed_at || scraper.started_at)}
        </span>

        <span
          style={{
            fontSize: 12,
            color: "var(--ink-secondary)",
            fontFamily: '"JetBrains Mono", monospace',
            whiteSpace: "nowrap",
            minWidth: 70,
            textAlign: "right",
          }}
        >
          {formatNumber(scraper.rows_inserted)} rows
        </span>

        <span
          style={{
            fontSize: 12,
            color: "var(--ink-tertiary)",
            fontFamily: '"JetBrains Mono", monospace',
            whiteSpace: "nowrap",
            minWidth: 60,
            textAlign: "right",
          }}
        >
          {formatDuration(scraper.duration_ms)}
        </span>

        {expanded ? (
          <ChevronDown size={14} color="var(--ink-tertiary)" />
        ) : (
          <ChevronRight size={14} color="var(--ink-faint)" />
        )}
      </button>

      {scraper.status === "error" && scraper.error_message && !expanded && (
        <div
          style={{
            padding: "8px 16px 8px 50px",
            fontSize: 12,
            color: "#f87171",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {scraper.error_message}
        </div>
      )}

      {expanded && (
        <div
          style={{
            padding: "16px 16px 16px 50px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-subtle)",
          }}
        >
          {loadingDetail ? (
            <p
              style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}
            >
              Loading run history...
            </p>
          ) : (
            <RunTimeline runs={detailRuns || []} />
          )}
        </div>
      )}
    </div>
  );
}
