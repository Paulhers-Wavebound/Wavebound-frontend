import { Gauge } from "lucide-react";
import type { ApiQuotaData } from "./types";
import { QUOTA_THRESHOLDS } from "./constants";
import { ProgressBar } from "./shared";
import { formatCompact, formatDateShort } from "./helpers";

function getQuotaColor(
  remaining: number,
  warn: number,
  critical: number,
): string {
  if (remaining <= critical) return "#ef4444";
  if (remaining <= warn) return "#f59e0b";
  return "#34d399";
}

export default function ApiQuotaGauges({ quotas }: { quotas: ApiQuotaData }) {
  const sc = quotas.sc_credits;
  const yt = quotas.youtube;
  const scThresh = QUOTA_THRESHOLDS.sc_credits;
  const ytThresh = QUOTA_THRESHOLDS.youtube_daily;

  const scRemaining = sc?.latest_remaining ?? 0;
  const scColor = getQuotaColor(scRemaining, scThresh.warn, scThresh.critical);
  const scPct = Math.min(100, (scRemaining / scThresh.total) * 100);

  // YouTube: sum today's usage from history (latest entry)
  const ytUsedToday =
    yt.history.length > 0 ? yt.history[0].quota_units_used : 0;
  const ytRemaining = ytThresh.total - ytUsedToday;
  const ytColor = getQuotaColor(
    ytRemaining,
    ytThresh.total - ytThresh.warn,
    ytThresh.total - ytThresh.critical,
  );
  const ytPct = Math.min(100, (ytRemaining / ytThresh.total) * 100);

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
          marginBottom: 14,
        }}
      >
        <Gauge size={14} color="var(--ink-tertiary)" />
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
          API quotas
        </span>
      </div>

      {/* ScrapeCreators */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-secondary)",
            }}
          >
            ScrapeCreators
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              fontWeight: 600,
              color: scColor,
            }}
          >
            {formatCompact(scRemaining)}
          </span>
        </div>
        <ProgressBar pct={scPct} color={scColor} height={6} />
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
              fontSize: 10,
              color: "var(--ink-faint)",
            }}
          >
            {(sc?.burn_rate_daily ?? 0) > 0
              ? `~${formatCompact(Math.round(sc.burn_rate_daily))}/day`
              : "no burn data"}
          </span>
          {sc.projected_exhaustion_date && (
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                color: scColor,
              }}
            >
              runs out ~{formatDateShort(sc.projected_exhaustion_date)}
            </span>
          )}
        </div>
      </div>

      {/* YouTube */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 12,
              fontWeight: 500,
              color: "var(--ink-secondary)",
            }}
          >
            YouTube Data API
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              fontWeight: 600,
              color: ytColor,
            }}
          >
            {formatCompact(ytUsedToday)}/{formatCompact(ytThresh.total)}
          </span>
        </div>
        <ProgressBar pct={ytPct} color={ytColor} height={6} />
        <div style={{ marginTop: 4 }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: "var(--ink-faint)",
            }}
          >
            daily quota — resets at midnight PT
          </span>
        </div>
      </div>
    </div>
  );
}
