import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Workflow } from "lucide-react";
import PipelineAlertBanner from "./PipelineAlertBanner";
import PipelineFunnelCard from "./PipelineFunnelCard";
import type { HitlStatus, RagTotal } from "./PipelineFunnelCard";
import PipelineThroughputChart from "./PipelineThroughputChart";
import type { ThroughputDay } from "./PipelineThroughputChart";
import PipelineCostRow from "./PipelineCostRow";
import type { CostData } from "./PipelineCostRow";
import PipelineActivityFeed from "./PipelineActivityFeed";
import type { ActivityEntry } from "./PipelineActivityFeed";

/* ── Types ────────────────────────────────────────── */

interface StuckItem {
  status: string;
  count: number;
  oldest_minutes: number;
}

interface RecentError {
  worker: string;
  error: string;
  created_at: string;
}

interface PipelineHealthData {
  hitl_status: HitlStatus[];
  stuck_items: StuckItem[];
  throughput_7d: ThroughputDay[];
  cost_24h: CostData;
  recent_activity: ActivityEntry[];
  recent_errors: RecentError[];
  rag_totals: RagTotal[];
}

/* ── Raw RPC shape (from pipeline_health_stats SQL) ── */

interface RawStuckDetail {
  id: string;
  created_at: string;
  age_minutes: number;
}

interface RawPipelineHealth {
  hitl_status: {
    tiktok: Record<string, number>;
    reels: Record<string, number>;
  };
  stuck_items: {
    tiktok: { processing: RawStuckDetail[]; uploading: RawStuckDetail[] };
    reels: { processing: RawStuckDetail[]; uploading: RawStuckDetail[] };
  };
  throughput_7d: Array<Record<string, unknown> & { day: string }>;
  cost_24h: CostData & { apify_credits_usd?: number };
  recent_activity: Array<{
    id: string;
    created_at: string;
    workflow: string;
    items_passed: number;
    items_discarded: number;
    gemini_calls: number;
    apify_calls: number;
    storage_uploads: number;
    notes: string | null;
  }>;
  recent_errors: {
    tiktok: Array<{ id: string; created_at: string; reasoning: string }>;
    reels: Array<{ id: string; created_at: string; reasoning: string }>;
  };
  rag_totals: {
    tiktok_videos: number;
    reels_videos: number;
  };
}

/* ── Transform raw → component-friendly shape ──────── */

function transformPipelineData(raw: RawPipelineHealth): PipelineHealthData {
  // hitl_status: {tiktok: {WATCH: 123}} → [{platform, status, count}]
  const hitl_status: HitlStatus[] = [];
  for (const [platform, statuses] of Object.entries(raw.hitl_status ?? {})) {
    for (const [status, count] of Object.entries(statuses ?? {})) {
      hitl_status.push({ platform, status, count: count as number });
    }
  }

  // stuck_items: flatten per-platform per-status arrays
  const stuck_items: StuckItem[] = [];
  for (const [, platformData] of Object.entries(raw.stuck_items ?? {})) {
    for (const [status, items] of Object.entries(platformData ?? {})) {
      const arr = Array.isArray(items) ? items : [];
      if (arr.length > 0) {
        const oldest = Math.max(
          ...arr.map((i: RawStuckDetail) => i.age_minutes),
        );
        stuck_items.push({
          status: status.toUpperCase(),
          count: arr.length,
          oldest_minutes: oldest,
        });
      }
    }
  }

  // throughput_7d: {day, ruben: {passed}, carl_oscar: {passed}} → {date, ruben_passed, oscar_passed}
  const throughput_7d: ThroughputDay[] = (raw.throughput_7d ?? []).map((d) => {
    let rubenPassed = 0;
    let oscarPassed = 0;
    for (const [key, val] of Object.entries(d)) {
      if (key === "day") continue;
      const wf = val as Record<string, number> | null;
      if (!wf) continue;
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("ruben") || lowerKey.includes("scrape")) {
        rubenPassed += wf.passed ?? 0;
      }
      if (lowerKey.includes("oscar") || lowerKey.includes("upload")) {
        oscarPassed += wf.passed ?? 0;
      }
    }
    return {
      date: d.day,
      ruben_passed: rubenPassed,
      oscar_passed: oscarPassed,
    };
  });

  // cost_24h: already matches, just pass through
  const cost_24h: CostData = {
    gemini_calls: raw.cost_24h?.gemini_calls ?? 0,
    apify_calls: raw.cost_24h?.apify_calls ?? 0,
    storage_uploads: raw.cost_24h?.storage_uploads ?? 0,
    est_gemini_cost_usd: raw.cost_24h?.est_gemini_cost_usd ?? 0,
  };

  // recent_activity: rename workflow → worker
  const recent_activity: ActivityEntry[] = (raw.recent_activity ?? []).map(
    (a) => ({
      worker: a.workflow ?? "unknown",
      action: "pipeline",
      notes: a.notes,
      items_passed: a.items_passed ?? 0,
      items_discarded: a.items_discarded ?? 0,
      created_at: a.created_at,
    }),
  );

  // recent_errors: {tiktok: [{reasoning}]} → [{worker, error, created_at}]
  const recent_errors: RecentError[] = [];
  for (const [platform, errors] of Object.entries(raw.recent_errors ?? {})) {
    for (const e of Array.isArray(errors) ? errors : []) {
      recent_errors.push({
        worker: platform,
        error: e.reasoning ?? "Unknown error",
        created_at: e.created_at,
      });
    }
  }

  // rag_totals: {tiktok_videos, reels_videos} → [{platform, total}]
  const rag_totals: RagTotal[] = [
    { platform: "tiktok", total: raw.rag_totals?.tiktok_videos ?? 0 },
    { platform: "reels", total: raw.rag_totals?.reels_videos ?? 0 },
  ];

  return {
    hitl_status,
    stuck_items,
    throughput_7d,
    cost_24h,
    recent_activity,
    recent_errors,
    rag_totals,
  };
}

/* ── Skeleton ─────────────────────────────────────── */

function SkeletonBlock({ height = 120 }: { height?: number }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        height,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

/* ── Component ────────────────────────────────────── */

export default function PipelineSection() {
  const { data, isLoading, error } = useQuery<PipelineHealthData>({
    queryKey: ["pipeline-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("pipeline_health_stats");
      if (error) throw error;
      return transformPipelineData(data as unknown as RawPipelineHealth);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (error) {
    return (
      <div
        style={{
          background: "var(--red-light)",
          borderRadius: 12,
          border: "1px solid #ef444433",
          padding: "12px 16px",
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          color: "#ef4444",
        }}
      >
        Pipeline health failed to load: {(error as Error).message}
      </div>
    );
  }

  // Group HITL statuses by platform
  const tiktokStatuses =
    data?.hitl_status?.filter((s) => s.platform === "tiktok") ?? [];
  const reelsStatuses =
    data?.hitl_status?.filter((s) => s.platform === "reels") ?? [];
  const tiktokRag =
    data?.rag_totals?.find((r) => r.platform === "tiktok")?.total ?? 0;
  const reelsRag =
    data?.rag_totals?.find((r) => r.platform === "reels")?.total ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Workflow size={15} color="var(--ink-tertiary)" />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Content Pipeline
        </span>
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 12,
            color: "var(--ink-faint)",
            marginLeft: 4,
          }}
        >
          Ruben → Carl → Oscar
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <SkeletonBlock height={200} />
            <SkeletonBlock height={200} />
          </div>
          <SkeletonBlock height={240} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            <SkeletonBlock height={90} />
            <SkeletonBlock height={90} />
            <SkeletonBlock height={90} />
            <SkeletonBlock height={90} />
          </div>
          <SkeletonBlock height={300} />
        </div>
      ) : data ? (
        <>
          {/* A) Error / stuck alert */}
          <PipelineAlertBanner
            stuckItems={data.stuck_items ?? []}
            recentErrors={data.recent_errors ?? []}
          />

          {/* B) Funnel cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            <PipelineFunnelCard
              platform="TikTok"
              statuses={tiktokStatuses}
              ragTotal={tiktokRag}
            />
            <PipelineFunnelCard
              platform="Reels"
              statuses={reelsStatuses}
              ragTotal={reelsRag}
            />
          </div>

          {/* C) Throughput chart */}
          <PipelineThroughputChart data={data.throughput_7d ?? []} />

          {/* D) Cost row */}
          {data.cost_24h && <PipelineCostRow cost={data.cost_24h} />}

          {/* E) Activity feed */}
          <PipelineActivityFeed entries={data.recent_activity ?? []} />
        </>
      ) : null}
    </div>
  );
}
