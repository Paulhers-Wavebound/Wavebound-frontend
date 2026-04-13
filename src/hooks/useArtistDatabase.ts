import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArtistScoreRow {
  entity_id: string;
  canonical_name: string;
  date: string;
  artist_score: number | null;
  health_score: number | null;
  momentum_score: number | null;
  discovery_score: number | null;
  catalog_score: number | null;
  trend: string | null;
  cross_platform_signal: string | null;
  global_rank: number | null;
  tier: string | null;
  spotify_trend: number | null;
  tiktok_trend: number | null;
  youtube_trend: number | null;
  shazam_trend: number | null;
  total_songs: number | null;
  catalog_daily_streams: number | null;
  catalog_pct_change_7d: number | null;
  songs_accelerating: number | null;
  top_song_name: string | null;
  fastest_song_name: string | null;
  coverage_score: number | null;
  missing_platforms: string | null;
  total_markets: number | null;
  dominant_markets: string | null;
  tiktok_videos_30d: number | null;
  tiktok_engagement_rate: number | null;
  tiktok_avg_plays: number | null;
  tiktok_original_sound_pct: number | null;
  songs_on_radio: number | null;
  best_radio_position: number | null;
  total_radio_audience: number | null;
  apple_charting_songs: number | null;
  best_apple_position: number | null;
  sounds_analyzed: number | null;
  sound_spark_score: number | null;
  viral_songs: number | null;
  hot_songs_count: number | null;
  listeners_peak_ratio: number | null;
}

export interface DailySummaryRow {
  entity_id: string;
  platform: string;
  metric: string;
  latest_value: number | null;
  date: string;
}

export interface TikTokProfileRow {
  entity_id: string;
  tiktok_grade: string | null;
  posting_consistency: string | null;
  total_videos: number | null;
  videos_30d: number | null;
  videos_7d: number | null;
  avg_posts_per_week: number | null;
  days_since_last_post: number | null;
  pinned_videos: number | null;
  original_sound_pct: number | null;
  commerce_music_pct: number | null;
  unique_sounds_used: number | null;
  avg_plays: number | null;
  median_plays: number | null;
  best_video_plays: number | null;
  total_plays: number | null;
  avg_engagement_rate: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  avg_shares: number | null;
  avg_saves: number | null;
  plays_trend_pct: number | null;
}

export type MergedArtistRow = ArtistScoreRow & {
  tiktok_followers_latest: number | null;
  youtube_subscribers_latest: number | null;
  tt_grade: string | null;
  tt_posting_consistency: string | null;
  tt_total_videos: number | null;
  tt_videos_30d: number | null;
  tt_videos_7d: number | null;
  tt_avg_posts_per_week: number | null;
  tt_days_since_last_post: number | null;
  tt_pinned_videos: number | null;
  tt_original_sound_pct: number | null;
  tt_commerce_music_pct: number | null;
  tt_unique_sounds_used: number | null;
  tt_avg_plays: number | null;
  tt_median_plays: number | null;
  tt_best_video_plays: number | null;
  tt_total_plays: number | null;
  tt_avg_engagement_rate: number | null;
  tt_avg_likes: number | null;
  tt_avg_comments: number | null;
  tt_avg_shares: number | null;
  tt_avg_saves: number | null;
  tt_plays_trend_pct: number | null;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseArtistDatabaseParams {
  page: number;
  pageSize: number;
  sortColumn: string;
  sortAsc: boolean;
  search: string;
}

export function useArtistDatabase({
  page,
  pageSize,
  sortColumn,
  sortAsc,
  search,
}: UseArtistDatabaseParams) {
  // ---- Count query (cached aggressively) ----
  const countQuery = useQuery({
    queryKey: ["artist-database-count", search],
    queryFn: async () => {
      let q = (supabase as any)
        .from("artist_score")
        .select("*", { count: "exact", head: true });
      if (search) q = q.ilike("canonical_name", `%${search}%`);
      const { count, error } = await q;
      if (error) throw error;
      return (count as number) ?? 0;
    },
    staleTime: 10 * 60 * 1000,
  });

  // ---- Paginated score rows ----
  const offset = page * pageSize;

  const scoreQuery = useQuery({
    queryKey: ["artist-database", page, pageSize, sortColumn, sortAsc, search],
    queryFn: async () => {
      let q = (supabase as any).from("artist_score").select("*");
      if (search) q = q.ilike("canonical_name", `%${search}%`);
      q = q.order(sortColumn, { ascending: sortAsc });
      q = q.range(offset, offset + pageSize - 1);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ArtistScoreRow[];
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  // ---- TikTok profile supplement (keyed on score result entity_ids) ----
  const entityIds = scoreQuery.data?.map((r) => r.entity_id) ?? [];

  const tiktokQuery = useQuery({
    queryKey: ["artist-database-tiktok", entityIds],
    queryFn: async () => {
      if (entityIds.length === 0) return [] as TikTokProfileRow[];
      const { data, error } = await (supabase as any)
        .from("artist_tiktok_profile")
        .select("*")
        .in("entity_id", entityIds);
      if (error) throw error;
      return (data ?? []) as TikTokProfileRow[];
    },
    enabled: entityIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  // ---- Absolute TikTok followers + YouTube subscribers from daily_summaries ----
  // artist_score.tiktok_trend / youtube_trend are NULL as of 2026-04-13 (upstream
  // dbt gap — see docs/handoffs/backend-todo.md). daily_summaries has the raw
  // latest_value, so we pull it directly and merge it in.
  const socialQuery = useQuery({
    queryKey: ["artist-database-social", entityIds],
    queryFn: async () => {
      if (entityIds.length === 0) return [] as DailySummaryRow[];
      const lookbackDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const { data, error } = await (supabase as any)
        .from("daily_summaries")
        .select("entity_id, platform, metric, latest_value, date")
        .in("entity_id", entityIds)
        .gte("date", lookbackDate)
        .or(
          "and(platform.eq.tiktok,metric.eq.tiktok_followers),and(platform.eq.youtube_api,metric.eq.subscriber_count)",
        )
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DailySummaryRow[];
    },
    enabled: entityIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  // ---- Merge ----
  const rows = useMemo<MergedArtistRow[]>(() => {
    if (!scoreQuery.data) return [];
    const ttMap = new Map<string, TikTokProfileRow>();
    for (const t of tiktokQuery.data ?? []) {
      ttMap.set(t.entity_id, t);
    }
    // daily_summaries is ordered by date desc → first hit per (entity, metric) wins
    const tiktokFollowersMap = new Map<string, number>();
    const youtubeSubsMap = new Map<string, number>();
    for (const r of socialQuery.data ?? []) {
      if (r.platform === "tiktok" && r.metric === "tiktok_followers") {
        if (!tiktokFollowersMap.has(r.entity_id) && r.latest_value != null) {
          tiktokFollowersMap.set(r.entity_id, r.latest_value);
        }
      } else if (
        r.platform === "youtube_api" &&
        r.metric === "subscriber_count"
      ) {
        if (!youtubeSubsMap.has(r.entity_id) && r.latest_value != null) {
          youtubeSubsMap.set(r.entity_id, r.latest_value);
        }
      }
    }
    return scoreQuery.data.map((s) => {
      const t = ttMap.get(s.entity_id);
      return {
        ...s,
        tiktok_followers_latest: tiktokFollowersMap.get(s.entity_id) ?? null,
        youtube_subscribers_latest: youtubeSubsMap.get(s.entity_id) ?? null,
        tt_grade: t?.tiktok_grade ?? null,
        tt_posting_consistency: t?.posting_consistency ?? null,
        tt_total_videos: t?.total_videos ?? null,
        tt_videos_30d: t?.videos_30d ?? null,
        tt_videos_7d: t?.videos_7d ?? null,
        tt_avg_posts_per_week: t?.avg_posts_per_week ?? null,
        tt_days_since_last_post: t?.days_since_last_post ?? null,
        tt_pinned_videos: t?.pinned_videos ?? null,
        tt_original_sound_pct: t?.original_sound_pct ?? null,
        tt_commerce_music_pct: t?.commerce_music_pct ?? null,
        tt_unique_sounds_used: t?.unique_sounds_used ?? null,
        tt_avg_plays: t?.avg_plays ?? null,
        tt_median_plays: t?.median_plays ?? null,
        tt_best_video_plays: t?.best_video_plays ?? null,
        tt_total_plays: t?.total_plays ?? null,
        tt_avg_engagement_rate: t?.avg_engagement_rate ?? null,
        tt_avg_likes: t?.avg_likes ?? null,
        tt_avg_comments: t?.avg_comments ?? null,
        tt_avg_shares: t?.avg_shares ?? null,
        tt_avg_saves: t?.avg_saves ?? null,
        tt_plays_trend_pct: t?.plays_trend_pct ?? null,
      };
    });
  }, [scoreQuery.data, tiktokQuery.data, socialQuery.data]);

  // Grab the snapshot date from first row
  const snapshotDate = scoreQuery.data?.[0]?.date ?? null;

  return {
    rows,
    totalCount: countQuery.data ?? 0,
    snapshotDate,
    isLoading: scoreQuery.isLoading,
    isFetching: scoreQuery.isFetching,
    isCountLoading: countQuery.isLoading,
    error:
      scoreQuery.error ||
      tiktokQuery.error ||
      socialQuery.error ||
      countQuery.error,
  };
}
