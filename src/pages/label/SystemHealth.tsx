import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import PipelineSection from "@/components/admin/pipeline/PipelineSection";
import { ChevronsUpDown, RefreshCw } from "lucide-react";

/* ── Extracted sub-components ────────────────────────── */
import type { HealthData } from "@/components/admin/health/types";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GROUP_ORDER,
} from "@/components/admin/health/constants";
import ScraperRow from "@/components/admin/health/ScraperRow";
import VelocityCountdown from "@/components/admin/health/VelocityCountdown";
import DataFreshnessSection from "@/components/admin/health/DataFreshnessSection";
import CoverageSection from "@/components/admin/health/CoverageSection";
import PlatformBreakdownSection from "@/components/admin/health/PlatformBreakdownSection";
import DbtHealthSection from "@/components/admin/health/DbtHealthSection";
import TopEntitiesSection from "@/components/admin/health/TopEntitiesSection";
import DataQualitySection from "@/components/admin/health/DataQualitySection";
import DataTotalsSection from "@/components/admin/health/DataTotalsSection";

/* ── New ops dashboard components ────────────────────── */
import MorningBriefing from "@/components/admin/health/MorningBriefing";
import ConcurrentScrapers from "@/components/admin/health/ConcurrentScrapers";
import ApiQuotaGauges from "@/components/admin/health/ApiQuotaGauges";
import PlatformCoverageTrend from "@/components/admin/health/PlatformCoverageTrend";
import UnresolvedEntitiesCard from "@/components/admin/health/UnresolvedEntitiesCard";
import CronGapDetection from "@/components/admin/health/CronGapDetection";

/* ── Data fetching ───────────────────────────────────── */

async function fetchHealthData(): Promise<HealthData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-health`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ── Main page ───────────────────────────────────────── */

export default function SystemHealth() {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const { data, isLoading, error, dataUpdatedAt, refetch } =
    useQuery<HealthData>({
      queryKey: ["admin-health"],
      queryFn: fetchHealthData,
      refetchInterval: 60_000,
      staleTime: 30_000,
    });

  // Tick "seconds ago" counter
  useEffect(() => {
    if (!dataUpdatedAt) return;
    setSecondsAgo(0);
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [dataUpdatedAt]);

  const allScraperNames = data ? data.scrapers.map((s) => s.scraper_name) : [];
  const allExpanded =
    allScraperNames.length > 0 &&
    allScraperNames.every((name) => expandedSet.has(name));

  const toggleScraper = useCallback((name: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!data) return;
    setExpandedSet(new Set(data.scrapers.map((s) => s.scraper_name)));
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedSet(new Set());
  }, []);

  /* ── Render ─────────────────────────────────────── */

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "var(--ink-tertiary)",
            fontSize: 14,
          }}
        >
          Loading system health...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            color: "#ef4444",
            fontSize: 14,
          }}
        >
          Failed to load health data: {(error as Error).message}
        </div>
      </div>
    );
  }

  const totals = data?.data_totals;

  return (
    <>
      <SEOHead
        title="System Health — Wavebound"
        description="Scraper and pipeline status"
      />
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div className="p-6 md:p-8 lg:p-10 space-y-6">
        {/* ═══ 1. Header row ═══ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 22,
              fontWeight: 600,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            System health
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              Last checked: {secondsAgo}s ago
            </span>
            {data && allScraperNames.length > 0 && (
              <button
                onClick={allExpanded ? collapseAll : expandAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink-secondary)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 500,
                  transition: "all 150ms",
                }}
              >
                <ChevronsUpDown size={13} />
                {allExpanded ? "Collapse all" : "Expand all"}
              </button>
            )}
            <button
              onClick={() => refetch()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink-secondary)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                transition: "all 150ms",
              }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        {/* ═══ 2. Morning briefing (replaces old status banner) ═══ */}
        {data && <MorningBriefing data={data} />}

        {/* ═══ 3. Concurrent scrapers + API quotas (side by side) ═══ */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {data && <ConcurrentScrapers scrapers={data.scrapers} />}
          {data?.api_quotas && <ApiQuotaGauges quotas={data.api_quotas} />}
        </div>

        {/* ═══ 4. Data freshness (promoted — was lower) ═══ */}
        {data?.data_freshness && data.data_freshness.length > 0 && (
          <DataFreshnessSection items={data.data_freshness} />
        )}

        {/* ═══ 5. Scraper group cards ═══ */}
        {data &&
          GROUP_ORDER.map((group) => {
            const scrapers = data.scrapers_by_group[group.key];
            if (!scrapers || scrapers.length === 0) return null;
            return (
              <div
                key={group.key}
                style={{
                  background: "var(--surface)",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 16px 12px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink)",
                      textTransform: "capitalize",
                    }}
                  >
                    {group.label}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                    {group.schedule}
                  </span>
                </div>

                {scrapers.map((s) => (
                  <ScraperRow
                    key={s.scraper_name}
                    scraper={s}
                    expanded={expandedSet.has(s.scraper_name)}
                    onToggle={() => toggleScraper(s.scraper_name)}
                  />
                ))}
              </div>
            );
          })}

        {/* ═══ 6. Cron gap detection ═══ */}
        {data?.scraper_run_history && data.scraper_run_history.length > 0 && (
          <CronGapDetection history={data.scraper_run_history} />
        )}

        {/* ═══ 7. Data totals with daily projections ═══ */}
        {totals && Object.keys(totals).length > 0 && (
          <DataTotalsSection
            totals={totals}
            accumulation={data?.accumulation ?? null}
          />
        )}

        {/* ═══ 8. Platform ID coverage trend ═══ */}
        {data?.platform_id_trend &&
          data.platform_id_trend.length > 0 &&
          data.platform_id_daily && (
            <PlatformCoverageTrend
              trend={data.platform_id_trend}
              daily={data.platform_id_daily}
            />
          )}

        {/* ═══ 9. Content Pipeline ═══ */}
        <PipelineSection />

        {/* ═══ 10. Coverage + Unresolved entities ═══ */}
        {data?.coverage && <CoverageSection cov={data.coverage} />}
        {data?.unresolved_entities && data.unresolved_entities.count > 0 && (
          <UnresolvedEntitiesCard data={data.unresolved_entities} />
        )}

        {/* ═══ 11. Platform Breakdown ═══ */}
        {data?.platform_breakdown && data.platform_breakdown.length > 0 && (
          <PlatformBreakdownSection items={data.platform_breakdown} />
        )}

        {/* ═══ 12. dbt Model Health ═══ */}
        {data?.dbt_health && <DbtHealthSection dbt={data.dbt_health} />}

        {/* ═══ 13. Top Entities ═══ */}
        {data?.top_entities && <TopEntitiesSection top={data.top_entities} />}

        {/* ═══ 14. Data Quality ═══ */}
        {data?.data_quality && <DataQualitySection dq={data.data_quality} />}

        {/* ═══ 15. Velocity Countdown ═══ */}
        {data?.velocity_status && (
          <VelocityCountdown v={data.velocity_status} />
        )}

        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
