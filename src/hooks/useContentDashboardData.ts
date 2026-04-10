import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  type ContentArtist,
  type ContentAnomaly,
  type SongUGC,
  normalizeHandle,
} from "@/data/contentDashboardHelpers";

interface ContentDashboardData {
  artists: ContentArtist[];
  anomalies: ContentAnomaly[];
  songUGC: SongUGC[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

export function useContentDashboardData(): ContentDashboardData {
  const { labelId, loading: profileLoading } = useUserProfile();
  const [rosterRaw, setRosterRaw] = useState<any[]>([]);
  const [anomaliesRaw, setAnomaliesRaw] = useState<any[]>([]);
  const [contentDnaRaw, setContentDnaRaw] = useState<any[]>([]);
  const [evolutionRaw, setEvolutionRaw] = useState<any[]>([]);
  const [videoSummaryRaw, setVideoSummaryRaw] = useState<any[]>([]);
  const [sentimentRaw, setSentimentRaw] = useState<any[]>([]);
  const [catalogRaw, setCatalogRaw] = useState<any[]>([]);
  const [siSoundsRaw, setSiSoundsRaw] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    // Wait for profile to load before deciding; no label = no data (prevents cross-label leaks)
    if (profileLoading) return;
    if (!labelId) {
      setRosterRaw([]);
      setAnomaliesRaw([]);
      setContentDnaRaw([]);
      setEvolutionRaw([]);
      setVideoSummaryRaw([]);
      setSentimentRaw([]);
      setCatalogRaw([]);
      setSiSoundsRaw([]);
      setLoading(false);
      return;
    }

    try {
      // Phase 1: Roster + Anomalies (independent, parallel)
      const rosterQuery = supabase
        .from("roster_dashboard_metrics")
        .select("*")
        .eq("label_id", labelId)
        .order("risk_level", { ascending: false });

      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const anomalyQuery = supabase
        .from("content_anomalies" as any)
        .select("*")
        .eq("label_id", labelId)
        .gte("scan_date", sevenDaysAgo.split("T")[0])
        .order("scan_date", { ascending: false });

      const [rosterRes, anomalyRes] = await Promise.all([
        rosterQuery,
        anomalyQuery,
      ]);

      if (rosterRes.error) {
        console.error("Roster fetch error:", rosterRes.error);
        setError(true);
        setLoading(false);
        return;
      }

      const roster: any[] = rosterRes.data || [];
      const anomalies: any[] = anomalyRes.data || [];
      setRosterRaw(roster);
      setAnomaliesRaw(anomalies);

      // Phase 2: Content DNA + Evolution (depend on roster handles)
      const handles = roster.map((r: any) => normalizeHandle(r.artist_handle));

      if (handles.length > 0) {
        const [dnaRes, evoRes] = await Promise.all([
          supabase
            .from("artist_content_dna" as any)
            .select(
              "artist_handle, entity_id, primary_genre, best_format, best_format_vs_median, worst_format, avg_hook_score, avg_viral_score, signature_style, dominant_mood",
            )
            .in("artist_handle", handles),
          supabase
            .from("artist_content_evolution" as any)
            .select(
              "artist_handle, entity_id, performance_trend, strategy_label, format_shift, views_change_pct, recent_top_format, prior_top_format",
            )
            .in("artist_handle", handles),
        ]);

        const dnaData = dnaRes.data || [];
        setContentDnaRaw(dnaData);
        setEvolutionRaw(evoRes.data || []);

        // Phase 3: tiktok_video_summary uses entity_id from content DNA results
        const entityIds = dnaData.map((d: any) => d.entity_id).filter(Boolean);

        if (entityIds.length > 0) {
          const [summaryRes, sentimentRes, catalogRes] = await Promise.all([
            supabase
              .from("tiktok_video_summary" as any)
              .select(
                "entity_id, posting_cadence, consistency_score, avg_engagement_rate, plays_trend_pct, engagement_trend_pct",
              )
              .in("entity_id", entityIds),
            supabase
              .from("wb_comment_sentiment" as any)
              .select("entity_id, sentiment_score, fan_energy")
              .in("entity_id", entityIds)
              .order("date", { ascending: false }),
            supabase
              .from("catalog_tiktok_performance" as any)
              .select(
                "song_name, artist_name, tiktok_video_count, total_tiktok_plays, unique_creators, fan_videos, fan_to_artist_ratio, tiktok_status, cross_platform_gap, videos_last_7d, videos_last_30d, tiktok_music_id",
              )
              .in("artist_entity_id", entityIds)
              .gt("tiktok_video_count", 0)
              .order("tiktok_video_count", { ascending: false })
              .limit(20),
          ]);
          setVideoSummaryRaw(summaryRes.data || []);
          setSentimentRaw(sentimentRes.data || []);
          setCatalogRaw(catalogRes.data || []);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Content dashboard fetch error:", err);
      setError(true);
      setLoading(false);
    }
  }, [labelId, profileLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Merge all data sources into ContentArtist[]
  const artists = useMemo<ContentArtist[]>(() => {
    // Build lookup maps keyed by normalized handle
    const dnaMap = new Map<string, any>();
    for (const d of contentDnaRaw) {
      dnaMap.set(normalizeHandle(d.artist_handle), d);
    }

    const evoMap = new Map<string, any>();
    for (const e of evolutionRaw) {
      evoMap.set(normalizeHandle(e.artist_handle), e);
    }

    // Video summary is keyed by entity_id — build entity→handle map from content DNA
    const entityToHandle = new Map<string, string>();
    for (const d of contentDnaRaw) {
      if (d.entity_id) {
        entityToHandle.set(d.entity_id, normalizeHandle(d.artist_handle));
      }
    }
    const summaryByHandle = new Map<string, any>();
    for (const s of videoSummaryRaw) {
      const handle = entityToHandle.get(s.entity_id);
      if (handle) {
        summaryByHandle.set(handle, s);
      }
    }

    // Sentiment: keyed by entity_id, take first (most recent) per entity
    const sentimentByHandle = new Map<string, any>();
    for (const s of sentimentRaw) {
      const handle = entityToHandle.get(s.entity_id);
      if (handle && !sentimentByHandle.has(handle)) {
        sentimentByHandle.set(handle, s);
      }
    }

    return rosterRaw.map((r: any): ContentArtist => {
      const h = normalizeHandle(r.artist_handle);
      const dna = dnaMap.get(h);
      const evo = evoMap.get(h);
      const summary = summaryByHandle.get(h);
      const sentiment = sentimentByHandle.get(h);

      return {
        artist_handle: r.artist_handle,
        artist_name: r.artist_name || r.artist_handle,
        avatar_url: r.avatar_url,
        label_id: r.label_id,
        momentum_tier: r.momentum_tier,
        days_since_last_post: r.days_since_last_post,
        posting_freq_30d: r.posting_freq_30d,
        posting_freq_7d: r.posting_freq_7d,
        avg_views_30d: r.avg_views_30d,
        avg_views_7d: r.avg_views_7d,
        avg_engagement_30d: r.avg_engagement_30d,
        avg_engagement_7d: r.avg_engagement_7d,
        delta_avg_views_pct: r.delta_avg_views_pct,
        delta_engagement_pct: r.delta_engagement_pct,
        delta_followers_pct: r.delta_followers_pct,
        total_videos: r.total_videos,
        risk_flags: r.risk_flags,
        risk_level: r.risk_level,
        tiktok_followers: r.tiktok_followers,
        instagram_followers: r.instagram_followers,
        median_views_baseline: r.median_views_baseline,
        has_content_plan: !!r.has_content_plan,
        has_intelligence_report: !!r.has_intelligence_report,
        has_30day_plan: !!r.has_30day_plan,
        // Content DNA
        primary_genre: dna?.primary_genre ?? null,
        best_format: dna?.best_format ?? null,
        best_format_vs_median: dna?.best_format_vs_median ?? null,
        worst_format: dna?.worst_format ?? null,
        avg_hook_score: dna?.avg_hook_score ?? null,
        avg_viral_score: dna?.avg_viral_score ?? null,
        signature_style: dna?.signature_style ?? null,
        dominant_mood: dna?.dominant_mood ?? null,
        // Evolution
        performance_trend: evo?.performance_trend ?? null,
        strategy_label: evo?.strategy_label ?? null,
        format_shift: evo?.format_shift ?? null,
        views_change_pct: evo?.views_change_pct ?? null,
        recent_top_format: evo?.recent_top_format ?? null,
        prior_top_format: evo?.prior_top_format ?? null,
        // Video summary
        posting_cadence: summary?.posting_cadence ?? null,
        consistency_score: summary?.consistency_score ?? null,
        avg_engagement_rate: summary?.avg_engagement_rate ?? null,
        plays_trend_pct: summary?.plays_trend_pct ?? null,
        engagement_trend_pct: summary?.engagement_trend_pct ?? null,
        // Sentiment
        sentiment_score: sentiment?.sentiment_score ?? null,
        fan_energy: sentiment?.fan_energy ?? null,
      };
    });
  }, [rosterRaw, contentDnaRaw, evolutionRaw, videoSummaryRaw, sentimentRaw]);

  const anomalies = useMemo<ContentAnomaly[]>(
    () =>
      anomaliesRaw.map((a: any) => ({
        artist_handle: a.artist_handle,
        anomaly_type: a.anomaly_type,
        anomaly_direction: a.anomaly_direction || "up",
        metric_name: a.metric_name || "",
        metric_value: a.metric_value,
        baseline_median: a.baseline_median,
        baseline_avg: a.baseline_avg,
        deviation_pct: a.deviation_pct,
        deviation_multiple: a.deviation_multiple,
        insight_message: a.insight_message || "",
        severity: a.severity || "normal",
        scan_date: a.scan_date,
        seen: !!a.seen,
      })),
    [anomaliesRaw],
  );

  const songUGC = useMemo<SongUGC[]>(
    () =>
      catalogRaw.map((c: any) => ({
        song_name: c.song_name || "Unknown",
        artist_name: c.artist_name,
        tiktok_video_count: c.tiktok_video_count || 0,
        total_tiktok_plays: c.total_tiktok_plays || 0,
        unique_creators: c.unique_creators || 0,
        fan_videos: c.fan_videos || 0,
        fan_to_artist_ratio: c.fan_to_artist_ratio || 0,
        tiktok_status: c.tiktok_status,
        cross_platform_gap: c.cross_platform_gap,
        videos_last_7d: c.videos_last_7d,
        videos_last_30d: c.videos_last_30d,
        tiktok_music_id: c.tiktok_music_id || null,
      })),
    [catalogRaw],
  );

  return { artists, anomalies, songUGC, loading, error, refresh, refreshing };
}
