import { useHealthData } from "./HealthLayout";
import MorningBriefing from "@/components/admin/health/MorningBriefing";
import ConcurrentScrapers from "@/components/admin/health/ConcurrentScrapers";
import ApiQuotaGauges from "@/components/admin/health/ApiQuotaGauges";
import DataFreshnessSection from "@/components/admin/health/DataFreshnessSection";
import SystemStatusSummary from "./components/SystemStatusSummary";
import { SCRAPER_LABELS } from "@/components/admin/health/constants";
import { relativeTime } from "@/components/admin/health/helpers";

export default function HealthOverview() {
  const { data } = useHealthData();
  if (!data) return null;

  // Recent errors (last 24h)
  const now = Date.now();
  const recentErrors = data.scrapers.filter(
    (s) =>
      s.status === "error" &&
      s.completed_at &&
      now - new Date(s.completed_at).getTime() < 24 * 60 * 60 * 1000,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        Overview
      </h2>

      <MorningBriefing data={data} />

      <SystemStatusSummary data={data} />

      {/* Concurrent scrapers + API quotas side by side */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <ConcurrentScrapers scrapers={data.scrapers} />
        {data.api_quotas && <ApiQuotaGauges quotas={data.api_quotas} />}
      </div>

      {/* Data freshness */}
      {data.data_freshness && data.data_freshness.length > 0 && (
        <DataFreshnessSection items={data.data_freshness} />
      )}

      {/* Recent errors feed */}
      {recentErrors.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px 10px",
              borderBottom: "1px solid var(--border)",
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
              Recent errors (24h)
            </span>
          </div>
          {recentErrors.map((s) => (
            <div
              key={s.scraper_name}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ef4444",
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {SCRAPER_LABELS[s.scraper_name] || s.scraper_name}
                </div>
                {s.error_message && (
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
                    {s.error_message?.slice(0, 150)}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  flexShrink: 0,
                }}
              >
                {relativeTime(s.completed_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
