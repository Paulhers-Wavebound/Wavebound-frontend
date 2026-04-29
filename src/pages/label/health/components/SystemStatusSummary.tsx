import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { HealthData } from "@/components/admin/health/types";
import { QUOTA_THRESHOLDS } from "@/components/admin/health/constants";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

function StatCard({ label, value, sub, color, icon: Icon }: StatCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <Icon size={14} color={color} />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 22,
          fontWeight: 700,
          color,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 11,
          color: "var(--ink-faint)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

export default function SystemStatusSummary({ data }: { data: HealthData }) {
  const total = data.scrapers.length;
  const healthy = data.scrapers.filter((s) => s.health === "healthy").length;
  const errors = data.scrapers.filter((s) => s.health === "error").length;
  const running = data.scrapers.filter((s) => s.status === "running").length;

  const scraperColor =
    errors > 0 ? "#ef4444" : healthy === total ? "#34d399" : "#f59e0b";
  const ScraperIcon =
    errors > 0 ? XCircle : healthy === total ? CheckCircle2 : AlertTriangle;

  // API status
  const scRemaining = data.api_quotas?.sc_credits?.latest_remaining ?? null;
  const scOk =
    scRemaining == null || scRemaining > QUOTA_THRESHOLDS.sc_credits.critical;
  const apiColor = scOk ? "#34d399" : "#ef4444";
  const ApiIcon = scOk ? CheckCircle2 : AlertTriangle;
  const apiSub =
    scRemaining != null
      ? `SC: ${Math.round(scRemaining / 1000)}K credits`
      : "Awaiting data";

  // Freshness
  const freshCount = data.data_freshness
    ? data.data_freshness.filter((f) => f.status === "fresh").length
    : 0;
  const totalPlatforms = data.data_freshness?.length || 0;
  const freshColor =
    totalPlatforms === 0
      ? "#9ca3af"
      : freshCount === totalPlatforms
        ? "#34d399"
        : freshCount > 0
          ? "#f59e0b"
          : "#ef4444";
  const FreshIcon =
    freshCount === totalPlatforms ? CheckCircle2 : AlertTriangle;

  // Content & Social cadence drift
  const cadence = data.cadence_drift;
  const cadenceColor =
    !cadence || cadence.status === "unknown"
      ? "#9ca3af"
      : cadence.status === "healthy"
        ? "#34d399"
        : "#f59e0b";
  const CadenceIcon =
    cadence?.status === "healthy" ? CheckCircle2 : AlertTriangle;
  const cadenceValue =
    !cadence || cadence.status === "unknown"
      ? "?"
      : cadence.drift_count === 0
        ? "OK"
        : `${cadence.drift_count}`;
  const cadenceSub =
    !cadence || cadence.status === "unknown"
      ? "cadence view unavailable"
      : `${cadence.artists_checked ?? 0} artists checked`;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <StatCard
        label="Scrapers"
        value={`${healthy}/${total}`}
        sub={`${running} running, ${errors} errors`}
        color={scraperColor}
        icon={ScraperIcon}
      />
      <StatCard
        label="API Quotas"
        value={scOk ? "OK" : "Low"}
        sub={apiSub}
        color={apiColor}
        icon={ApiIcon}
      />
      <StatCard
        label="Data Freshness"
        value={`${freshCount}/${totalPlatforms}`}
        sub="platforms fresh (<8h)"
        color={freshColor}
        icon={FreshIcon}
      />
      <StatCard
        label="Cadence Drift"
        value={cadenceValue}
        sub={cadenceSub}
        color={cadenceColor}
        icon={CadenceIcon}
      />
    </div>
  );
}
