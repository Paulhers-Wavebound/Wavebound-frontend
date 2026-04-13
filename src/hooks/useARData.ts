/**
 * useARData — React Query hooks for A&R Command Center
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ARProspect,
  ARDecisionPoint,
  EnrichedVideo,
  PipelineStage,
} from "@/types/arTypes";

const BASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1";

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.refreshSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* ─── Prospects List ──────────────────────────────────────────── */

interface ProspectsResponse {
  prospects: ARProspect[];
  total: number;
  offset: number;
  limit: number;
}

async function fetchProspects(params: {
  stage?: string;
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
}): Promise<ProspectsResponse> {
  const headers = await getAuthHeaders();
  const qs = new URLSearchParams();
  if (params.stage) qs.set("stage", params.stage);
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));

  const resp = await fetch(BASE_URL + "/get-ar-prospects?" + qs.toString(), {
    headers,
  });
  if (!resp.ok) throw new Error("Failed to fetch prospects");
  return resp.json();
}

export function useARProspects(params?: {
  stage?: string;
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [
      "ar-prospects",
      params?.stage,
      params?.sort,
      params?.order,
      params?.limit,
      params?.offset,
    ],
    queryFn: () =>
      fetchProspects({
        stage: params?.stage || "all",
        sort: params?.sort || "rise_probability",
        order: params?.order || "desc",
        limit: params?.limit || 50,
        offset: params?.offset || 0,
      }),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/* ─── Prospect Detail ─────────────────────────────────────────── */

interface ProspectDetailResponse {
  prospect: ARProspect;
  recent_videos: EnrichedVideo[];
  platforms: {
    platform: string;
    platform_id: string;
    platform_url: string | null;
  }[];
  source: {
    platform: string;
    handle: string;
    total_rag_videos: number;
    total_rag_plays: number;
    avg_viral_score: number;
  };
}

async function fetchProspectDetail(
  id: string,
): Promise<ProspectDetailResponse> {
  const headers = await getAuthHeaders();
  const resp = await fetch(
    BASE_URL + "/get-ar-prospect-detail?id=" + encodeURIComponent(id),
    { headers },
  );
  if (!resp.ok) throw new Error("Failed to fetch prospect detail");
  return resp.json();
}

export function useARProspectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["ar-prospect-detail", id],
    queryFn: () => fetchProspectDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/* ─── Council Brief ───────────────────────────────────────────── */

interface BriefResponse {
  headline: string;
  decision_points: ARDecisionPoint[];
  roster_pulse: string;
  pipeline_distribution: Record<string, number>;
  generated_at: string | null;
  empty?: boolean;
}

async function fetchBrief(labelId?: string): Promise<BriefResponse> {
  const headers = await getAuthHeaders();
  const qs = labelId ? "?label_id=" + encodeURIComponent(labelId) : "";
  const resp = await fetch(BASE_URL + "/get-ar-brief" + qs, { headers });
  if (!resp.ok) throw new Error("Failed to fetch brief");
  return resp.json();
}

export function useARBrief(labelId?: string) {
  return useQuery({
    queryKey: ["ar-brief", labelId],
    queryFn: () => fetchBrief(labelId),
    staleTime: 5 * 60 * 1000,
  });
}

/* ─── Helper functions (client-side) ─────────────────────────── */

export function filterByStage(
  prospects: ARProspect[],
  stage: string,
): ARProspect[] {
  if (stage === "all") return prospects;
  if (stage === "risk") return prospects.filter((p) => p.risk_flags.length > 0);
  return prospects.filter((p) => p.pipeline_stage === stage);
}

export function sortProspects(
  prospects: ARProspect[],
  key: string,
  desc = true,
): ARProspect[] {
  const sorted = [...prospects].sort((a, b) => {
    let va: number, vb: number;
    switch (key) {
      case "rise_probability":
        va = a.rise_probability;
        vb = b.rise_probability;
        break;
      case "seven_day_velocity":
        va = a.metrics?.seven_day_velocity ?? 0;
        vb = b.metrics?.seven_day_velocity ?? 0;
        break;
      case "signability":
        va = a.signability?.overall ?? 0;
        vb = b.signability?.overall ?? 0;
        break;
      case "ghost_curve":
        va = a.ghost_curve_match?.match_pct ?? 0;
        vb = b.ghost_curve_match?.match_pct ?? 0;
        break;
      case "stage": {
        const order: Record<string, number> = {
          execution: 5,
          validation: 4,
          assessment: 3,
          deep_dive: 2,
          flagging: 1,
        };
        va = order[a.pipeline_stage] ?? 0;
        vb = order[b.pipeline_stage] ?? 0;
        break;
      }
      default:
        va = a.rise_probability;
        vb = b.rise_probability;
    }
    return desc ? vb - va : va - vb;
  });
  return sorted;
}

export function getPipelineDistribution(
  prospects: ARProspect[],
): Record<string, number> {
  const dist: Record<string, number> = {
    flagging: 0,
    deep_dive: 0,
    assessment: 0,
    validation: 0,
    execution: 0,
  };
  for (const p of prospects) {
    dist[p.pipeline_stage] = (dist[p.pipeline_stage] || 0) + 1;
  }
  return dist;
}
