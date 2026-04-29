import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type {
  HealthData,
  BriefingItem,
  ScraperEntry,
  DataFreshnessEntry,
} from "./types";
import { SCRAPER_LABELS, QUOTA_THRESHOLDS } from "./constants";
import { relativeTime } from "./helpers";

function buildBriefingItems(data: HealthData): BriefingItem[] {
  const items: BriefingItem[] = [];

  // 1. Scraper errors (last 24h) — critical
  const now = Date.now();
  for (const s of data.scrapers) {
    if (
      s.status === "error" &&
      s.completed_at &&
      now - new Date(s.completed_at).getTime() < 24 * 60 * 60 * 1000
    ) {
      items.push({
        severity: "critical",
        category: "scraper_error",
        title: `${SCRAPER_LABELS[s.scraper_name] || s.scraper_name} failed`,
        detail: s.error_message
          ? s.error_message.slice(0, 120)
          : `Failed ${relativeTime(s.completed_at)}`,
        scraper_name: s.scraper_name,
      });
    }
  }

  // 2. Overdue scrapers — warning
  for (const s of data.scrapers) {
    if (s.health === "overdue") {
      items.push({
        severity: "warning",
        category: "scraper_overdue",
        title: `${SCRAPER_LABELS[s.scraper_name] || s.scraper_name} overdue`,
        detail: s.hours_since_completion
          ? `Last run ${Math.round(s.hours_since_completion)}h ago (threshold: ${s.overdue_threshold_hours}h)`
          : "No successful run recorded",
        scraper_name: s.scraper_name,
      });
    }
  }

  // 3. Critical data freshness — warning
  if (data.data_freshness) {
    for (const f of data.data_freshness) {
      if (f.status === "critical") {
        items.push({
          severity: "warning",
          category: "data_stale",
          title: `${f.platform} data is stale`,
          detail: `Last observation ${Math.round(f.hours_ago)}h ago`,
        });
      }
    }
  }

  // 4. API quota warnings
  if (data.api_quotas?.sc_credits) {
    const sc = data.api_quotas.sc_credits;
    const remaining = sc.latest_remaining ?? 0;
    const burnDaily = sc.burn_rate_daily ?? 0;
    if (remaining <= QUOTA_THRESHOLDS.sc_credits.critical) {
      items.push({
        severity: "critical",
        category: "api_quota",
        title: "ScrapeCreators credits critically low",
        detail: `${remaining.toLocaleString()} credits remaining (~${Math.round(burnDaily).toLocaleString()}/day)`,
      });
    } else if (remaining <= QUOTA_THRESHOLDS.sc_credits.warn) {
      items.push({
        severity: "warning",
        category: "api_quota",
        title: "ScrapeCreators credits running low",
        detail: `${remaining.toLocaleString()} credits remaining${sc.projected_exhaustion_date ? ` — runs out ~${sc.projected_exhaustion_date}` : ""}`,
      });
    }
  }

  // 5. Unresolved entities — info
  if (data.unresolved_entities && data.unresolved_entities.count > 50) {
    items.push({
      severity: data.unresolved_entities.count > 200 ? "warning" : "info",
      category: "unresolved",
      title: `${data.unresolved_entities.count} artists unresolved`,
      detail:
        "Artists with zero platform IDs — identity resolution may be stuck",
    });
  }

  // 6. Content & Social cadence drift — warning
  if (data.cadence_drift?.status === "drift") {
    const driftCount = data.cadence_drift.drift_count ?? 0;
    items.push({
      severity: "warning",
      category: "cadence_drift",
      title: `${driftCount} cadence row${driftCount === 1 ? "" : "s"} drifting`,
      detail:
        "Content & Social posting cadence differs from the shared roster-derived view",
    });
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => order[a.severity] - order[b.severity]);

  return items.slice(0, 7);
}

const SEVERITY_STYLES = {
  critical: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    Icon: XCircle,
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    color: "#f59e0b",
    Icon: AlertTriangle,
  },
  info: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.25)",
    color: "#3b82f6",
    Icon: Info,
  },
};

export default function MorningBriefing({ data }: { data: HealthData }) {
  const [expanded, setExpanded] = useState(true);
  const items = buildBriefingItems(data);

  if (items.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(52, 211, 153, 0.06)",
          border: "1px solid rgba(52, 211, 153, 0.2)",
        }}
      >
        <CheckCircle2 size={18} color="#34d399" />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: "#34d399",
          }}
        >
          All systems operational
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            color: "var(--ink-faint)",
            marginLeft: "auto",
          }}
        >
          {data.scrapers.length} scrapers tracked
        </span>
      </div>
    );
  }

  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const warningCount = items.filter((i) => i.severity === "warning").length;

  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 14,
        border: `1px solid ${criticalCount > 0 ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        {expanded ? (
          <ChevronDown size={14} color="var(--ink-tertiary)" />
        ) : (
          <ChevronRight size={14} color="var(--ink-tertiary)" />
        )}
        <AlertTriangle
          size={16}
          color={criticalCount > 0 ? "#ef4444" : "#f59e0b"}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          {items.length} issue{items.length !== 1 ? "s" : ""} need attention
        </span>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginLeft: "auto",
            alignItems: "center",
          }}
        >
          {criticalCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#ef4444",
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(239, 68, 68, 0.12)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#f59e0b",
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(245, 158, 11, 0.12)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {warningCount} warning
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderTop: "1px solid var(--border)",
          }}
        >
          {items.map((item, i) => {
            const style = SEVERITY_STYLES[item.severity];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 16px",
                  background: style.bg,
                  borderLeft: `3px solid ${style.border}`,
                }}
              >
                <style.Icon
                  size={14}
                  color={style.color}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
