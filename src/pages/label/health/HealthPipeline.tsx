import { useHealthData } from "./HealthLayout";
import PipelineSection from "@/components/admin/pipeline/PipelineSection";
import PipelineCostTrend from "@/components/admin/pipeline/PipelineCostTrend";
import DbtHealthSection from "@/components/admin/health/DbtHealthSection";
import CoverageSection from "@/components/admin/health/CoverageSection";
import VelocityCountdown from "@/components/admin/health/VelocityCountdown";

export default function HealthPipeline() {
  const { data } = useHealthData();
  if (!data) return null;

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
        Pipeline
      </h2>

      <PipelineSection />

      <PipelineCostTrend />

      {data.dbt_health && <DbtHealthSection dbt={data.dbt_health} />}

      {data.coverage && <CoverageSection cov={data.coverage} />}

      {data.velocity_status && <VelocityCountdown v={data.velocity_status} />}
    </div>
  );
}
