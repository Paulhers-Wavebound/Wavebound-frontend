import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY";

/* ── Types ── */

export interface GifItem {
  key: string;
  url: string;
  views: number;
  multiplier: string;
  type: "own" | "niche";
  creator?: string;
}

export interface PlanVariantsGifs {
  available: GifItem[];
  removed: { seven_day: string[]; thirty_day: string[] };
}

export interface PlanVariantsResponse {
  job_id: string;
  gifs: PlanVariantsGifs;
  gif_overrides: {
    seven_day: Record<string, string[]>;
    thirty_day: Record<string, string[]>;
  };
  [key: string]: any;
}

export interface ContentPoolOwnVideo {
  key: string;
  gif_url: string | null;
  has_gif: boolean;
  views: number;
  multiplier: string;
  description: string;
  hook: string;
  categories: string[];
  video_index: number;
}

export interface ContentPoolNicheVideo {
  key: string;
  gif_url: string | null;
  has_gif: boolean;
  views: number;
  multiplier: string;
  creator: string;
  format: string;
  why_relevant: string;
  video_url: string;
}

export interface ContentPoolIdea {
  title: string;
  format: string;
  effort: string;
  source: string;
  day: string;
  pitch?: string;
}

export interface ContentPoolPlay {
  slot_key: string;
  week: number;
  play_number: number;
  title: string;
  format: string;
  source: string;
}

export interface ContentPoolResponse {
  own_videos: ContentPoolOwnVideo[];
  niche_videos: ContentPoolNicheVideo[];
  seven_day_ideas: Record<string, ContentPoolIdea>;
  thirty_day_plays: ContentPoolPlay[];
  current_overrides: {
    seven_day: Record<string, string[]>;
    thirty_day: Record<string, string[]>;
  };
  removed_gifs: { seven_day: string[]; thirty_day: string[] };
}

export type PlanType = "seven_day" | "thirty_day";

/* ── Auth header helper ── */

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
    apikey: SUPABASE_ANON_KEY,
  };
}

/* ── Fetchers ── */

export async function fetchPlanVariants(
  artistHandle: string,
): Promise<PlanVariantsResponse> {
  const headers = await authHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/get-plan-variants?artist_handle=${encodeURIComponent(artistHandle)}`,
    { headers },
  );
  if (!res.ok) throw new Error(`get-plan-variants failed: ${res.status}`);
  return res.json();
}

export async function fetchContentPool(
  artistHandle: string,
): Promise<ContentPoolResponse> {
  const headers = await authHeaders();
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/get-content-pool?artist_handle=${encodeURIComponent(artistHandle)}`,
    { headers },
  );
  if (!res.ok) throw new Error(`get-content-pool failed: ${res.status}`);
  return res.json();
}

/* ── Mutations ── */

interface MutationBase {
  job_id: string;
  artist_handle: string;
  plan_type: PlanType;
  re_render?: boolean;
}

export async function removeGif(params: MutationBase & { gif_key: string }) {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/swap-plan-variant`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...params,
      action: "remove_gif",
      re_render: params.re_render ?? true,
    }),
  });
  if (!res.ok) throw new Error(`remove_gif failed: ${res.status}`);
  return res.json();
}

export async function restoreGif(params: MutationBase & { gif_key: string }) {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/swap-plan-variant`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...params,
      action: "restore_gif",
      re_render: params.re_render ?? true,
    }),
  });
  if (!res.ok) throw new Error(`restore_gif failed: ${res.status}`);
  return res.json();
}

export async function swapSource(
  params: MutationBase & { slot_key: string; gif_refs: string[] },
) {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/swap-plan-variant`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...params,
      action: "swap_source",
      re_render: params.re_render ?? true,
    }),
  });
  if (!res.ok) throw new Error(`swap_source failed: ${res.status}`);
  return res.json();
}

export async function swapThirtyDayPlay(params: {
  job_id: string;
  artist_handle: string;
  target_slot: string;
  source_idea_key: string;
  re_render?: boolean;
}) {
  const headers = await authHeaders();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/swap-plan-variant`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...params,
      action: "swap_thirty_day_play",
      re_render: params.re_render ?? true,
    }),
  });
  if (!res.ok) throw new Error(`swap_thirty_day_play failed: ${res.status}`);
  return res.json();
}
