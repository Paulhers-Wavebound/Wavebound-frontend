/* ─── useCultureGenomeData — Fetch hitl_tiktok + compute genome ─ */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeGenomeData, type HitlRow } from "@/utils/genomeCompute";
import type { CultureGenomeData } from "@/types/cultureGenome";

const HITL_COLUMNS = [
  "author_unique_id",
  "author_nickname",
  "author_avatar_url",
  "author_followers",
  "play_count",
  "like_count",
  "comment_count",
  "share_count",
  "collect_count",
  "viral_score",
  "performance_multiplier",
  "language",
  "duration_seconds",
  "content_type",
  "music_author",
  "hashtags",
  "caption",
  "creator_avg_views",
  "creator_avg_engagement",
  "creator_median_views",
  "date_posted",
].join(",");

async function fetchAndCompute(): Promise<CultureGenomeData> {
  // Fetch all hitl_tiktok rows (paginate if needed since Supabase caps at 1000)
  const allRows: HitlRow[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("hitl_tiktok")
      .select(HITL_COLUMNS)
      .order("viral_score", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data || data.length === 0) break;

    allRows.push(...(data as unknown as HitlRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`[CultureGenome] Fetched ${allRows.length} hitl_tiktok rows`);

  // Compute genome (UMAP + clustering) — runs synchronously, ~2-5s for 5k rows
  const genome = computeGenomeData(allRows);
  console.log(
    `[CultureGenome] Computed ${genome.nodes.length} nodes, ${genome.meta.total_clusters} clusters`,
  );

  return genome;
}

export function useCultureGenomeData() {
  return useQuery<CultureGenomeData>({
    queryKey: ["culture-genome"],
    queryFn: fetchAndCompute,
    staleTime: 10 * 60 * 1000, // 10 minutes — UMAP is expensive
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
