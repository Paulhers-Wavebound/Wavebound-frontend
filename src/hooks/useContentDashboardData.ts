import { useCallback, useEffect, useMemo, useState } from "react";
import {
  supabase,
  SUPABASE_ANON_KEY,
  SUPABASE_URL_RAW,
} from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  type ContentArtist,
  type ContentAnomaly,
  type ReleaseConfidence,
  type ReleaseSourceType,
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

type PublicTables = Database["public"]["Tables"];
type PublicFunctions = Database["public"]["Functions"];
type RosterMetricRow = PublicTables["roster_dashboard_metrics"]["Row"];
type ContentAnomalyRow = PublicTables["content_anomalies"]["Row"];
type ContentDnaRow = PublicTables["artist_content_dna"]["Row"];
type ContentEvolutionRow = PublicTables["artist_content_evolution"]["Row"];
type VideoSummaryRow = PublicTables["tiktok_video_summary"]["Row"];
type SentimentRow = PublicTables["wb_comment_sentiment"]["Row"];
type CatalogSongRow = PublicTables["catalog_tiktok_performance"]["Row"];
type SiSoundRow =
  PublicFunctions["get_si_sound_performance"]["Returns"][number];
type SoundVelocityRow =
  PublicFunctions["get_artist_sound_velocity"]["Returns"][number];
type WeeklyPulseValue = ContentArtist["weekly_pulse"];
type WeeklyPulseRow = {
  artist_handle: string;
  weekly_pulse: WeeklyPulseValue;
  weekly_pulse_generated_at: string | null;
};
type ReleaseCalendarRow = {
  artist_handle: string;
  release_date: string;
  title: string | null;
  source_url: string | null;
  source_type: ReleaseSourceType | null;
  evidence: string | null;
  confidence: ReleaseConfidence;
  last_seen_at: string | null;
  status: "ai_detected" | "confirmed" | "dismissed" | "manual";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRiskFlags(
  value: Json,
): ContentArtist["risk_flags"] {
  if (!Array.isArray(value)) return null;

  const flags = value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const message = typeof item.message === "string" ? item.message : "";
    if (!message) return [];

    return [
      {
        severity:
          typeof item.severity === "string" ? item.severity : "normal",
        message,
      },
    ];
  });

  return flags.length > 0 ? flags : null;
}

export function useContentDashboardData(): ContentDashboardData {
  const { labelId, loading: profileLoading } = useUserProfile();
  const [rosterRaw, setRosterRaw] = useState<RosterMetricRow[]>([]);
  const [anomaliesRaw, setAnomaliesRaw] = useState<ContentAnomalyRow[]>([]);
  const [contentDnaRaw, setContentDnaRaw] = useState<ContentDnaRow[]>([]);
  const [evolutionRaw, setEvolutionRaw] = useState<ContentEvolutionRow[]>([]);
  const [videoSummaryRaw, setVideoSummaryRaw] = useState<VideoSummaryRow[]>([]);
  const [sentimentRaw, setSentimentRaw] = useState<SentimentRow[]>([]);
  const [catalogRaw, setCatalogRaw] = useState<CatalogSongRow[]>([]);
  const [siSoundsRaw, setSiSoundsRaw] = useState<SiSoundRow[]>([]);
  const [soundVelocityRaw, setSoundVelocityRaw] = useState<SoundVelocityRow[]>(
    [],
  );
  const [weeklyPulseRaw, setWeeklyPulseRaw] = useState<WeeklyPulseRow[]>([]);
  const [releaseCalendarRaw, setReleaseCalendarRaw] = useState<
    ReleaseCalendarRow[]
  >([]);
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
      setSoundVelocityRaw([]);
      setWeeklyPulseRaw([]);
      setReleaseCalendarRaw([]);
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
        .from("content_anomalies")
        .select("*")
        .eq("label_id", labelId)
        .gte("scan_date", sevenDaysAgo.split("T")[0])
        .order("scan_date", { ascending: false });

      // SI sounds query — independent of roster, runs in parallel
      const siSoundsQuery = supabase.rpc("get_si_sound_performance", {
        p_label_id: labelId,
      });

      // Sound velocity — per-artist top sound + weekly UGC momentum
      const soundVelocityQuery = supabase.rpc("get_artist_sound_velocity", {
        p_label_id: labelId,
      });

      const { data: authData } = await supabase.auth.getSession();
      const today = new Date().toISOString().split("T")[0];
      const releaseCalendarQuery = fetch(
        `${SUPABASE_URL_RAW}/rest/v1/artist_release_calendar?select=artist_handle,release_date,title,source_url,source_type,evidence,confidence,last_seen_at,status&label_id=eq.${labelId}&release_date=gte.${today}&status=in.(ai_detected,confirmed,manual)&order=release_date.asc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${
              authData.session?.access_token ?? SUPABASE_ANON_KEY
            }`,
          },
        },
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((rows) => rows as ReleaseCalendarRow[])
        .catch(() => [] as ReleaseCalendarRow[]);

      const [
        rosterRes,
        anomalyRes,
        siSoundsRes,
        soundVelocityRes,
        releaseCalendarRes,
      ] =
        await Promise.all([
          rosterQuery,
          anomalyQuery,
          siSoundsQuery,
          soundVelocityQuery,
          releaseCalendarQuery,
        ]);

      if (rosterRes.error) {
        console.error("Roster fetch error:", rosterRes.error);
        setError(true);
        setLoading(false);
        return;
      }

      const roster = rosterRes.data || [];
      const anomalies = anomalyRes.data || [];
      setRosterRaw(roster);
      setAnomaliesRaw(anomalies);
      setSiSoundsRaw(siSoundsRes.data || []);
      setSoundVelocityRaw(soundVelocityRes.data || []);
      setReleaseCalendarRaw(releaseCalendarRes);

      // Phase 2: Content DNA + Evolution (depend on roster handles)
      const handles = roster.map((r) => normalizeHandle(r.artist_handle));

      if (handles.length > 0) {
        // Also fetch artist_handle list for weekly_pulse query
        const rosterHandles = roster.map((r) => r.artist_handle);
        // Catalog joins on artist_name (not entity_id) because artist_content_dna
        // is incomplete — roster artists without DNA entries still have catalog
        // songs we want to surface.
        const rosterArtistNames = roster
          .map((r) => r.artist_name)
          .filter((name): name is string => Boolean(name));

        const [dnaRes, evoRes, pulseRes, catalogRes] = await Promise.all([
          supabase
            .from("artist_content_dna")
            .select(
              "artist_handle, entity_id, primary_genre, best_format, best_format_vs_median, worst_format, avg_hook_score, avg_viral_score, signature_style, dominant_mood",
            )
            .in("artist_handle", handles),
          supabase
            .from("artist_content_evolution")
            .select(
              "artist_handle, entity_id, performance_trend, strategy_label, format_shift, views_change_pct, recent_top_format, prior_top_format",
            )
            .in("artist_handle", handles),
          supabase
            .from("artist_intelligence")
            .select("artist_handle, weekly_pulse, weekly_pulse_generated_at")
            .in("artist_handle", rosterHandles)
            .not("weekly_pulse", "is", null),
          supabase
            .from("catalog_tiktok_performance")
            .select(
              "song_name, artist_name, tiktok_video_count, total_tiktok_plays, unique_creators, fan_videos, fan_to_artist_ratio, tiktok_status, cross_platform_gap, videos_last_7d, videos_last_30d, tiktok_music_id",
            )
            .in("artist_name", rosterArtistNames)
            .gt("tiktok_video_count", 0)
            .order("total_tiktok_plays", { ascending: false }),
        ]);

        setWeeklyPulseRaw(
          (pulseRes.data || []).map((p) => ({
            artist_handle: p.artist_handle,
            weekly_pulse: p.weekly_pulse as WeeklyPulseValue,
            weekly_pulse_generated_at: p.weekly_pulse_generated_at,
          })),
        );
        setCatalogRaw(catalogRes.data || []);

        const dnaData = dnaRes.data || [];
        setContentDnaRaw(dnaData);
        setEvolutionRaw(evoRes.data || []);

        // Phase 3: tiktok_video_summary + sentiment use entity_id from content DNA
        const entityIds = dnaData
          .map((d) => d.entity_id)
          .filter((id): id is string => Boolean(id));

        if (entityIds.length > 0) {
          const [summaryRes, sentimentRes] = await Promise.all([
            supabase
              .from("tiktok_video_summary")
              .select(
                "entity_id, posting_cadence, consistency_score, avg_engagement_rate, plays_trend_pct, engagement_trend_pct",
              )
              .in("entity_id", entityIds),
            supabase
              .from("wb_comment_sentiment")
              .select("entity_id, sentiment_score, fan_energy")
              .in("entity_id", entityIds)
              .order("date", { ascending: false }),
          ]);
          setVideoSummaryRaw(summaryRes.data || []);
          setSentimentRaw(sentimentRes.data || []);
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
    const dnaMap = new Map<string, ContentDnaRow>();
    for (const d of contentDnaRaw) {
      if (d.artist_handle) {
        dnaMap.set(normalizeHandle(d.artist_handle), d);
      }
    }

    const evoMap = new Map<string, ContentEvolutionRow>();
    for (const e of evolutionRaw) {
      if (e.artist_handle) {
        evoMap.set(normalizeHandle(e.artist_handle), e);
      }
    }

    // Video summary is keyed by entity_id — build entity→handle map from content DNA
    const entityToHandle = new Map<string, string>();
    for (const d of contentDnaRaw) {
      if (d.entity_id) {
        entityToHandle.set(d.entity_id, normalizeHandle(d.artist_handle));
      }
    }
    const summaryByHandle = new Map<string, VideoSummaryRow>();
    for (const s of videoSummaryRaw) {
      const handle = s.entity_id ? entityToHandle.get(s.entity_id) : null;
      if (handle) {
        summaryByHandle.set(handle, s);
      }
    }

    // Sound velocity: keyed by normalized handle
    const soundVelocityByHandle = new Map<string, SoundVelocityRow>();
    for (const sv of soundVelocityRaw) {
      soundVelocityByHandle.set(normalizeHandle(sv.artist_handle), sv);
    }

    // Weekly pulse: keyed by normalized handle
    const pulseByHandle = new Map<string, WeeklyPulseRow>();
    for (const p of weeklyPulseRaw) {
      pulseByHandle.set(normalizeHandle(p.artist_handle), p);
    }

    // Release calendar: keyed by normalized handle, first row is soonest date.
    const releaseByHandle = new Map<string, ReleaseCalendarRow>();
    for (const release of releaseCalendarRaw) {
      const handle = normalizeHandle(release.artist_handle);
      if (!releaseByHandle.has(handle)) {
        releaseByHandle.set(handle, release);
      }
    }

    // Sentiment: keyed by entity_id, take first (most recent) per entity
    const sentimentByHandle = new Map<string, SentimentRow>();
    for (const s of sentimentRaw) {
      const handle = entityToHandle.get(s.entity_id);
      if (handle && !sentimentByHandle.has(handle)) {
        sentimentByHandle.set(handle, s);
      }
    }

    return rosterRaw.map((r): ContentArtist => {
      const h = normalizeHandle(r.artist_handle);
      const dna = dnaMap.get(h);
      const evo = evoMap.get(h);
      const summary = summaryByHandle.get(h);
      const sentiment = sentimentByHandle.get(h);
      const sv = soundVelocityByHandle.get(h);
      const pulse = pulseByHandle.get(h);
      const weeklyPulse = pulse?.weekly_pulse;
      const calendarRelease = releaseByHandle.get(h);
      const pulseRelease = weeklyPulse?.next_release;
      const nextReleaseDate =
        calendarRelease?.release_date ??
        pulseRelease?.date ??
        weeklyPulse?.next_release_date ??
        null;
      const nextReleaseTitle =
        calendarRelease?.title ??
        pulseRelease?.title ??
        weeklyPulse?.next_release_title ??
        null;
      const nextReleaseSourceUrl =
        calendarRelease?.source_url ??
        pulseRelease?.source_url ??
        weeklyPulse?.next_release_source_url ??
        null;
      const nextReleaseSourceType =
        calendarRelease?.source_type ??
        pulseRelease?.source_type ??
        weeklyPulse?.next_release_source_type ??
        null;
      const nextReleaseEvidence =
        calendarRelease?.evidence ??
        pulseRelease?.evidence ??
        weeklyPulse?.next_release_evidence ??
        null;
      const nextReleaseConfidence =
        calendarRelease?.confidence ??
        pulseRelease?.confidence ??
        weeklyPulse?.next_release_confidence ??
        null;

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
        velocity_views_pct: r.velocity_views_pct,
        velocity_engagement_pct: r.velocity_engagement_pct,
        velocity_posting_freq_pct: r.velocity_posting_freq_pct,
        delta_followers_pct: r.delta_followers_pct,
        total_videos: r.total_videos,
        risk_flags: normalizeRiskFlags(r.risk_flags),
        risk_level: r.risk_level,
        tiktok_followers: r.tiktok_followers,
        instagram_followers: r.instagram_followers,
        median_views_baseline: r.median_views_baseline,
        latest_release_date: r.latest_release_date ?? null,
        days_since_release: r.days_since_release ?? null,
        has_content_plan: !!r.has_content_plan,
        has_intelligence_report: !!r.has_intelligence_report,
        has_30day_plan: !!r.has_30day_plan,
        next_release_date: nextReleaseDate,
        next_release_title: nextReleaseTitle,
        next_release_source_url: nextReleaseSourceUrl,
        next_release_source_type: nextReleaseSourceType,
        next_release_evidence: nextReleaseEvidence,
        next_release_confidence: nextReleaseConfidence,
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
        // Sound velocity
        top_sound_title: sv?.top_sound_title ?? null,
        top_sound_new_ugc: sv?.top_sound_new_ugc ?? null,
        top_sound_total_ugc: sv?.top_sound_total_ugc ?? null,
        sound_velocity: sv?.velocity ?? null,
        sounds_tracked: sv?.sounds_tracked ?? null,
        // Save-to-Reach conversion ratio (only when saves data is actually populated, not zero)
        avg_saves_30d: r.avg_saves_30d ?? null,
        save_to_reach_pct:
          r.avg_saves_30d != null &&
          r.avg_saves_30d > 0 &&
          r.avg_views_30d != null &&
          r.avg_views_30d > 0
            ? (r.avg_saves_30d / r.avg_views_30d) * 100
            : null,
        // Layer 3: AI focus (from weekly_pulse)
        weekly_pulse: weeklyPulse ?? null,
        weekly_pulse_generated_at: pulse?.weekly_pulse_generated_at ?? null,
      };
    });
  }, [
    rosterRaw,
    contentDnaRaw,
    evolutionRaw,
    videoSummaryRaw,
    sentimentRaw,
    soundVelocityRaw,
    weeklyPulseRaw,
    releaseCalendarRaw,
  ]);

  const anomalies = useMemo<ContentAnomaly[]>(
    () =>
      anomaliesRaw.map((a) => ({
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

  const songUGC = useMemo<SongUGC[]>(() => {
    // Catalog sounds (from catalog_tiktok_performance — entity-linked)
    const catalogSongs: SongUGC[] = catalogRaw.map((c) => ({
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
    }));

    // Deduplicate: build set of sound IDs already in catalog
    const catalogSoundIds = new Set(
      catalogSongs.map((s) => s.tiktok_music_id).filter(Boolean),
    );

    // Map SI status → SongUGC tiktok_status
    const mapSiStatus = (s: string | null): string => {
      switch (s) {
        case "accelerating":
          return "trending";
        case "declining":
          return "established";
        default:
          return "active";
      }
    };

    // SI sounds not yet in catalog
    const siSongs: SongUGC[] = siSoundsRaw
      .filter((si) => si.sound_id && !catalogSoundIds.has(si.sound_id))
      .map((si) => ({
        song_name: si.track_name || "Unknown",
        artist_name: si.artist_name || null,
        tiktok_video_count: si.videos_count || 0,
        total_tiktok_plays: Number(si.total_views) || 0,
        unique_creators: Number(si.unique_creators) || 0,
        fan_videos: 0,
        fan_to_artist_ratio: 0,
        tiktok_status: mapSiStatus(si.si_status),
        cross_platform_gap: null,
        videos_last_7d: si.weekly_new_videos || null,
        videos_last_30d: null,
        tiktok_music_id: si.sound_id,
      }));

    // Catalog first (richer data), then SI sounds, sorted by total plays
    return [...catalogSongs, ...siSongs].sort(
      (a, b) => b.total_tiktok_plays - a.total_tiktok_plays,
    );
  }, [catalogRaw, siSoundsRaw]);

  return { artists, anomalies, songUGC, loading, error, refresh, refreshing };
}
