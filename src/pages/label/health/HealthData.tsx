import { useHealthData } from "./HealthLayout";
import DataTotalsSection from "@/components/admin/health/DataTotalsSection";
import DataFreshnessSection from "@/components/admin/health/DataFreshnessSection";
import PlatformCoverageTrend from "@/components/admin/health/PlatformCoverageTrend";
import PlatformBreakdownSection from "@/components/admin/health/PlatformBreakdownSection";
import DataQualitySection from "@/components/admin/health/DataQualitySection";
import UnresolvedEntitiesCard from "@/components/admin/health/UnresolvedEntitiesCard";
import TopEntitiesSection from "@/components/admin/health/TopEntitiesSection";

export default function HealthData() {
  const { data } = useHealthData();
  if (!data) return null;

  const totals = data.data_totals;

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
        Data
      </h2>

      {totals && Object.keys(totals).length > 0 && (
        <DataTotalsSection
          totals={totals}
          accumulation={data.accumulation ?? null}
        />
      )}

      {data.data_freshness && data.data_freshness.length > 0 && (
        <DataFreshnessSection items={data.data_freshness} />
      )}

      {data.platform_id_trend &&
        data.platform_id_trend.length > 0 &&
        data.platform_id_daily && (
          <PlatformCoverageTrend
            trend={data.platform_id_trend}
            daily={data.platform_id_daily}
          />
        )}

      {data.platform_breakdown && data.platform_breakdown.length > 0 && (
        <PlatformBreakdownSection items={data.platform_breakdown} />
      )}

      {data.unresolved_entities && data.unresolved_entities.count > 0 && (
        <UnresolvedEntitiesCard data={data.unresolved_entities} />
      )}

      {data.data_quality && <DataQualitySection dq={data.data_quality} />}

      {data.top_entities && <TopEntitiesSection top={data.top_entities} />}
    </div>
  );
}
