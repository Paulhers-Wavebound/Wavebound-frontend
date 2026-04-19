import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Nested object types ──────────────────────────────────── */

export interface FormatPerformanceEntry {
  contentFormat: string;
  videoCount: number;
  pctOfTotal: number | null;
  avgViews: number | null;
  medianViews: number | null;
  maxViews: number | null;
  avgViralScore: number | null;
  avgHookScore: number | null;
  avgEngagementRate: number | null;
  performanceVsMedian: number | null;
  bestVideoCaption: string | null;
  avgDurationSeconds: number | null;
  commonMoods: string[] | null;
  commonHooks: string[] | null;
}

export interface CommentPulseData {
  sentimentScore: number | null;
  fanEnergy: number | null;
  audienceVibe: string | null;
  sentimentSignal: string | null;
  sentimentThemes: Array<{
    theme: string;
    count: number;
    sample?: string;
  }> | null;
  intentBreakdown: Record<string, number> | null;
  fanRequests: string[] | null;
  aiContentIdeas: string[] | null;
  totalCommentsAnalyzed: number | null;
  trackedComments: number | null;
  totalCommentLikes: number | null;
  topCommentLikes: number | null;
  topCommentText: string | null;
  secondCommentText: string | null;
  thirdCommentText: string | null;
  avgCommentImpactPct: number | null;
  totalReplies: number | null;
}

export interface PlaylistIntelData {
  songsInPlaylists: number;
  totalPlaylistPlacements: number;
  totalPlaylistReach: number;
  avgPlaylistPosition: number | null;
  bestPositionOverall: number | null;
  highReachPlacements: number;
  massivePlacements: number;
  bestSong: string | null;
  bestPlaylistName: string | null;
  bestPlaylistReach: number | null;
  overallReachTier: string | null;
  topPlaylistSongs: Array<{
    song_name?: string;
    playlist_count?: number;
    total_reach?: number;
  }> | null;
}

export interface VideoSummaryData {
  totalVideos: number | null;
  videos7d: number | null;
  videos30d: number | null;
  videos90d: number | null;
  avgPlays: number | null;
  medianPlays: number | null;
  bestPlays: number | null;
  totalPlays: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgShares: number | null;
  avgSaves: number | null;
  avgViralityRatio: number | null;
  pinnedCount: number | null;
  pinnedAvgPlays: number | null;
  pinnedTotalPlays: number | null;
  topSoundTitle: string | null;
  topSoundAuthor: string | null;
  topSoundUses: number | null;
  topHashtags: string[] | null;
  originalSoundPct: number | null;
  commerceMusicPct: number | null;
  avgEngagementRate: number | null;
  consistencyScore: number | null;
  postingCadence: string | null;
  playsTrendPct: number | null;
  engagementTrendPct: number | null;
}

export interface MomentumPoint {
  date: string;
  score: number;
  direction: string;
  zone: string;
}

export interface StreamingPulseData {
  spotifyMonthlyListeners: number | null;
  spotifyDailyStreams: number | null;
  spotifyFollowers: number | null;
  spotifyPeakListeners: number | null;
  spotifyMlDelta7d: number | null;
  spotifyMlPct7d: number | null;
  spotifyPeakRatio: number | null;
  spotifyDsDelta7d: number | null;
  spotifyDsPct7d: number | null;
  spotifyFollowersDelta7d: number | null;
  leadStreamPct: number | null;
  kworbGlobalRank: number | null;
  kworbRankDelta7d: number | null;
  deezerFans: number | null;
  deezerFansDelta7d: number | null;
}

export interface BriefSection {
  module: string;
  heading: string;
  body: string;
  action: string | null;
  urgency: "high" | "medium" | "low";
}

export interface TouringSignalData {
  touringStatus: string;
  totalUpcomingEvents: number;
  bandstownUpcoming: number;
  ticketmasterUpcoming: number;
  newEventsAnnounced7d: number;
}

export interface SongHealthEntry {
  songName: string;
  healthScore: number;
  countriesCharting: number | null;
  dailyStreams: number | null;
}

export interface SongVelocityEntry {
  songName: string;
  dailyStreams: number;
  totalStreams: number;
  pctChange7d: number | null;
  velocityClass: string;
  peakRatio: number | null;
  rankByStreams: number | null;
}

export interface MarketExpansionEntry {
  countryCode: string;
  isPresent: boolean;
  opportunityScore: number;
  opportunityTier: string;
  recommendedAction: string;
  urgency: string;
  windowConfidence: string;
  entrySongName: string | null;
  entrySongVelocity: string | null;
  spilloverSourceMarket: string | null;
  spilloverProbability: number | null;
  estimatedActivationDays: number | null;
  estimatedRevenue: number | null;
  discoverySignalType: string | null;
  velocity: string | null;
  platformToActivateFirst: string | null;
}

export interface FormatVideoEntry {
  caption: string;
  datePosted: string | null;
  views: number;
  hookScore: number | null;
  viralScore: number | null;
  format: string;
  mood: string | null;
  isAd: boolean;
  durationSeconds: number | null;
  videoUrl: string | null;
}

export interface ContentDnaData {
  videosAnalyzed: number | null;
  medianViews: number | null;
  avgViews: number | null;
  avgDurationSeconds: number | null;
  adContentPct: number | null;
  originalSoundPct: number | null;
  formatDistribution: Record<string, number> | null;
  topHooks: Array<{ hook: string; count: number }> | null;
  moodDistribution: Record<string, number> | null;
  genreDistribution: Record<string, number> | null;
  bestFormat: string | null;
  bestFormatAvgViews: number | null;
  bestFormatCount: number | null;
  bestFormatVsMedian: number | null;
  worstFormat: string | null;
  worstFormatAvgViews: number | null;
  worstFormatCount: number | null;
  worstFormatVsMedian: number | null;
  topQFormat: string | null;
  topQAvgHookScore: number | null;
  bottomQFormat: string | null;
  bottomQAvgHookScore: number | null;
  signatureStyle: string | null;
  primaryGenre: string | null;
  dominantMood: string | null;
  avgHookScore: number | null;
  avgViralScore: number | null;
}

/* ─── Main interface ───────────────────────────────────────── */

export interface ContentIntelData {
  // ── artist_score ──
  artistScore: number | null;
  tier: string | null;
  trend: string | null;
  globalRank: number | null;
  healthScore: number | null;
  momentumScore: number | null;
  discoveryScore: number | null;
  catalogScore: number | null;
  platformsGrowing: number | null;
  platformsDeclining: number | null;
  platformsTracked: number | null;
  spotifyTrend: number | null;
  tiktokTrend: number | null;
  youtubeTrend: number | null;
  shazamTrend: number | null;
  catalogDailyStreams: number | null;
  catalogPctChange7d: number | null;
  songsAccelerating: number | null;
  viralSongs: number | null;
  hotSongsCount: number | null;
  listenersPeakRatio: number | null;
  soundSparkScore: number | null;

  // ── artist_tiktok_profile ──
  tiktokGrade: string | null;
  postingConsistency: string | null;
  ttTotalVideos: number | null;
  ttVideos30d: number | null;
  ttVideos7d: number | null;
  ttAvgPostsPerWeek: number | null;
  ttDaysSinceLastPost: number | null;
  ttPinnedVideos: number | null;
  ttOriginalSoundPct: number | null;
  ttCommerceMusicPct: number | null;
  ttUniqueSoundsUsed: number | null;
  ttAvgPlays: number | null;
  ttMedianPlays: number | null;
  ttBestVideoPlays: number | null;
  ttTotalPlays: number | null;
  ttAvgEngagementRate: number | null;
  ttAvgLikes: number | null;
  ttAvgComments: number | null;
  ttAvgShares: number | null;
  ttAvgSaves: number | null;
  ttPlaysTrendPct: number | null;

  // ── artist_audience_footprint ──
  tiktokFollowers: number | null;
  instagramFollowers: number | null;
  youtubeSubscribers: number | null;
  spotifyFollowers: number | null;
  totalSocialReach: number | null;
  dominantPlatform: string | null;
  fastestGrowingPlatform: string | null;
  tiktokGrowth7d: number | null;
  tiktokGrowthPct7d: number | null;
  instagramGrowth7d: number | null;
  instagramGrowthPct7d: number | null;
  youtubeGrowth7d: number | null;
  spotifyLoyaltyRatio: number | null;
  wikipediaPageviews: number | null;
  wikiDelta7d: number | null;
  tiktokTotalLikes: number | null;
  youtubeTotalViews: number | null;

  // ── artist_format_performance (array) ──
  formatPerformance: FormatPerformanceEntry[];

  // ── deep_research_jobs (individual video analyses, grouped by format) ──
  formatVideos: Record<string, FormatVideoEntry[]>;

  // ── artist_comment_pulse ──
  commentPulse: CommentPulseData | null;

  // ── artist_playlist_intelligence ──
  playlistIntel: PlaylistIntelData | null;

  // ── tiktok_video_summary (expanded) ──
  videoSummary: VideoSummaryData | null;

  // ── artist_content_dna (expanded) ──
  contentDna: ContentDnaData | null;

  // ── artist_content_evolution (expanded) ──
  performanceTrend: string | null;
  strategyLabel: string | null;
  formatShift: boolean | null;
  viewsChangePct: number | null;
  recentTopFormat: string | null;
  priorTopFormat: string | null;
  recentAvgViews: number | null;
  priorAvgViews: number | null;
  recentAvgHookScore: number | null;
  priorAvgHookScore: number | null;
  moodShift: boolean | null;
  recentDominantMood: string | null;
  priorDominantMood: string | null;
  newFormats: string[] | null;
  droppedFormats: string[] | null;

  // ── artist_momentum (sparkline) ──
  momentumSparkline: MomentumPoint[];

  // ── artist_streaming_pulse ──
  streamingPulse: StreamingPulseData | null;

  // ── artist_touring_signal ──
  touringSignal: TouringSignalData | null;

  // ── song_health (array) ──
  songHealth: SongHealthEntry[];

  // ── song_velocity (array) ──
  songVelocity: SongVelocityEntry[];

  // ── market_opportunity_v2 (top expansion opportunities) ──
  marketExpansion: MarketExpansionEntry[];

  // ── existing (anomalies, brief, catalog) ──
  anomalies: Array<{
    type: string;
    message: string;
    severity: string;
    date: string;
  }>;
  briefHtml: string | null;
  briefGeneratedAt: string | null;
  briefSections: BriefSection[] | null;
  briefActionItems: string[] | null;
  topSongs: Array<{
    songName: string;
    videoCount: number;
    totalPlays: number;
    uniqueCreators: number;
    status: string | null;
    crossPlatformGap: string | null;
    fanToArtistRatio: number | null;
    videosLast7d: number | null;
    videosLast30d: number | null;
    avgTiktokPlays: number | null;
    tiktokEngagementRate: number | null;
  }>;
}

/* ─── Helpers ─────────────────────────────────────────────── */

/** Synthesize FormatPerformanceEntry[] from grouped deep_research_jobs videos.
 *  Fallback when artist_format_performance agg table hasn't been populated. */
function synthesizeFormatPerformance(
  formatVideos: Record<string, FormatVideoEntry[]>,
  overallMedianViews: number | null,
): FormatPerformanceEntry[] {
  const keys = Object.keys(formatVideos);
  if (keys.length === 0) return [];
  const rows = keys.map((fmt) => {
    const vids = formatVideos[fmt];
    const views = vids.map((v) => v.views).filter((n) => n > 0);
    const hooks = vids
      .map((v) => v.hookScore)
      .filter((n): n is number => n != null);
    const virals = vids
      .map((v) => v.viralScore)
      .filter((n): n is number => n != null);
    const durations = vids
      .map((v) => v.durationSeconds)
      .filter((n): n is number => n != null);
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : null;
    const median = (arr: number[]) => {
      if (!arr.length) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    const avgViews = avg(views);
    const topByViews = [...vids].sort((a, b) => b.views - a.views)[0];
    const moodCounts = new Map<string, number>();
    for (const v of vids)
      if (v.mood) moodCounts.set(v.mood, (moodCounts.get(v.mood) ?? 0) + 1);
    const commonMoods = Array.from(moodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([m]) => m)
      .slice(0, 3);
    return {
      contentFormat: fmt,
      videoCount: vids.length,
      pctOfTotal: null,
      avgViews,
      medianViews: median(views),
      maxViews: views.length ? Math.max(...views) : null,
      avgViralScore: avg(virals),
      avgHookScore: avg(hooks),
      avgEngagementRate: null,
      performanceVsMedian:
        avgViews != null && overallMedianViews && overallMedianViews > 0
          ? avgViews / overallMedianViews
          : null,
      bestVideoCaption: topByViews?.caption ?? null,
      avgDurationSeconds: avg(durations),
      commonMoods: commonMoods.length ? commonMoods : null,
      commonHooks: null,
    } satisfies FormatPerformanceEntry;
  });
  // Sort by avgViews desc to match the SQL ordering
  return rows.sort((a, b) => (b.avgViews ?? 0) - (a.avgViews ?? 0));
}

/** Synthesize ContentDnaData from deep_research_jobs.content_analysis_data.
 *  Fallback when artist_content_dna agg table hasn't been populated. */
function synthesizeContentDna(cad: any): ContentDnaData | null {
  if (!cad) return null;
  const summary = cad.summary ?? {};
  const profile = cad.content_style_profile ?? {};
  const perf: any[] = Array.isArray(cad.category_performance)
    ? cad.category_performance
    : [];
  const sortedPerf = [...perf].sort(
    (a, b) => (b.avg_viral_score ?? 0) - (a.avg_viral_score ?? 0),
  );
  const best = sortedPerf[0];
  const worst = sortedPerf[sortedPerf.length - 1];
  const pickTop = (arr: any[], key: string): string | null => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const v = arr[0]?.[key];
    return typeof v === "string" && v !== "[object Object]" ? v : null;
  };
  const formatDistribution: Record<string, number> | null = perf.length
    ? Object.fromEntries(perf.map((p: any) => [p.category, p.count ?? 0]))
    : null;
  const moodDistribution: Record<string, number> | null = Array.isArray(
    profile.dominant_moods,
  )
    ? Object.fromEntries(
        profile.dominant_moods
          .filter((m: any) => m?.mood && m.mood !== "[object Object]")
          .map((m: any) => [m.mood, m.frequency ?? 0]),
      )
    : null;
  const genreDistribution: Record<string, number> | null = Array.isArray(
    profile.dominant_genres,
  )
    ? Object.fromEntries(
        profile.dominant_genres.map((g: any) => [g.genre, g.frequency ?? 0]),
      )
    : null;
  const parseNum = (v: any): number | null => {
    if (v == null) return null;
    const n = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    videosAnalyzed: summary.videos_deep_analyzed ?? null,
    medianViews: summary.median_views ?? null,
    avgViews: summary.avg_views ?? null,
    avgDurationSeconds: parseNum(summary.avg_duration_seconds),
    adContentPct: null,
    originalSoundPct: summary.original_sound_pct ?? null,
    formatDistribution,
    topHooks: null,
    moodDistribution,
    genreDistribution,
    bestFormat: best?.category ?? null,
    bestFormatAvgViews: null,
    bestFormatCount: best?.count ?? null,
    bestFormatVsMedian: null,
    worstFormat: sortedPerf.length > 1 ? (worst?.category ?? null) : null,
    worstFormatAvgViews: null,
    worstFormatCount: worst?.count ?? null,
    worstFormatVsMedian: null,
    topQFormat: null,
    topQAvgHookScore: null,
    bottomQFormat: null,
    bottomQAvgHookScore: null,
    signatureStyle: null,
    primaryGenre: pickTop(profile.dominant_genres, "genre"),
    dominantMood: pickTop(profile.dominant_moods, "mood"),
    avgHookScore: parseNum(summary.avg_hook_score),
    avgViralScore: null,
  };
}

/** Clean up song names from catalog_tiktok_performance.
 *  The scraper stores them as: `"Song Title" by Artist Name` or `Song by Artist`.
 *  We strip the quotes and the ` by Artist` suffix since the artist is already known.  */
function cleanSongName(raw: string): string {
  if (!raw) return raw;
  // Pattern 1: "Song Title" by Artist
  const quoted = raw.match(/^"(.+?)"\s+by\s+.+$/i);
  if (quoted) return quoted[1];
  // Pattern 2: Song Title by Artist (only if "by" appears after the first word)
  const unquoted = raw.match(/^(.+?)\s+by\s+[A-Z].+$/);
  if (unquoted && unquoted[1].length > 2) return unquoted[1];
  // Pattern 3: already clean — return as-is but strip any wrapping quotes
  return raw.replace(/^"+|"+$/g, "");
}

/* ─── Fetcher ──────────────────────────────────────────────── */

async function fetchContentIntelligence(
  entityId: string | null,
  artistHandle: string | null,
): Promise<ContentIntelData> {
  const handle = (artistHandle || "").trim().toLowerCase().replace(/^@+/, "");

  // Phase 1: handle-based queries (parallel)
  const [dnaRes, evoRes, fmtRes, drjRes] = await Promise.all([
    handle
      ? supabase
          .from("artist_content_dna" as any)
          .select("*")
          .eq("artist_handle", handle)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    handle
      ? supabase
          .from("artist_content_evolution" as any)
          .select("*")
          .eq("artist_handle", handle)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    handle
      ? supabase
          .from("artist_format_performance" as any)
          .select("*")
          .eq("artist_handle", handle)
          .order("avg_views", { ascending: false })
      : Promise.resolve({ data: [] }),
    handle
      ? supabase
          .from("deep_research_jobs" as any)
          .select("content_analysis_data,tiktok_data,artist_handle")
          .eq("artist_handle", handle)
          .not("content_analysis_data", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then((r) => r)
          .catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
  ]);

  const dna = dnaRes.data as any;
  const evo = evoRes.data as any;
  const fmtRows = (fmtRes.data || []) as any[];
  const drjData = drjRes.data as any;
  const eid = entityId || dna?.entity_id;

  // Parse deep_research_jobs individual analyses → group by format
  const formatVideos: Record<string, FormatVideoEntry[]> = {};
  try {
    const analyses = drjData?.content_analysis_data?.individual_analyses ?? [];
    const rawVideos = drjData?.tiktok_data?.raw_videos ?? [];
    const drjHandle = drjData?.artist_handle ?? "";
    for (const v of analyses) {
      const fmt = (v.categories?.[0] ?? "Unknown") as string;
      // Resolve video URL from raw_videos via video_index
      let videoUrl: string | null = null;
      if (v.video_index != null && rawVideos[v.video_index]) {
        const rv = rawVideos[v.video_index];
        videoUrl = rv.video_url || null;
        if (!videoUrl && rv.id && drjHandle) {
          videoUrl = `https://www.tiktok.com/@${drjHandle}/video/${rv.id}`;
        }
      }
      const entry: FormatVideoEntry = {
        caption: v.desc ?? v.caption ?? "",
        datePosted: v.date_posted ?? null,
        views: parseInt(v.views ?? "0", 10) || 0,
        hookScore: v.hook_score != null ? parseFloat(v.hook_score) : null,
        viralScore: v.viral_score != null ? parseFloat(v.viral_score) : null,
        format: fmt,
        mood: Array.isArray(v.mood_tags) ? (v.mood_tags[0] ?? null) : null,
        isAd: v.is_ad === true,
        durationSeconds:
          v.duration_seconds != null ? parseFloat(v.duration_seconds) : null,
        videoUrl,
      };
      if (!formatVideos[fmt]) formatVideos[fmt] = [];
      formatVideos[fmt].push(entry);
    }
    // Sort each group by views descending
    for (const key of Object.keys(formatVideos)) {
      formatVideos[key].sort((a, b) => b.views - a.views);
    }
  } catch {
    // non-critical parse error
  }

  // Phase 2a: look up this artist's song entity IDs for catalog_tiktok_performance
  // The table's artist_entity_id is null for ~97% of rows, but song_entity_id is
  // reliably populated. We join through wb_entities (type=song, metadata->>artist_entity_id).
  let artistSongEntityIds: string[] = [];
  if (eid) {
    try {
      const { data: songEntities } = await supabase
        .from("wb_entities" as any)
        .select("id")
        .eq("entity_type", "song")
        .eq("metadata->>artist_entity_id", eid);
      artistSongEntityIds = (songEntities || []).map((s: any) => s.id);
    } catch {
      // non-critical — catalog section will just be empty
    }
  }

  // Phase 2b: entity_id-based queries (parallel)
  const [
    summaryRes,
    commentPulseRes,
    anomalyRes,
    briefRes,
    catalogRes,
    scoreRes,
    ttProfileRes,
    footprintRes,
    playlistRes,
    momentumRes,
    pulseRes,
    touringRes,
    velocityRes,
    marketRes,
    songHealthRes,
  ] = await Promise.all([
    eid
      ? supabase
          .from("tiktok_video_summary" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("artist_comment_pulse" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
          .then((r) => r)
          .catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
    handle
      ? supabase
          .from("content_anomalies" as any)
          .select("anomaly_type, insight_message, severity, scan_date")
          .eq("artist_handle", handle)
          .order("scan_date", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    eid
      ? supabase
          .from("intelligence_briefs" as any)
          .select("brief_html, brief_json, generated_at")
          .eq("entity_id", eid)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // catalog_tiktok_performance: try artist_entity_id first, fall back to song_entity_id join
    eid
      ? (async () => {
          // Fast path: use artist_entity_id if populated
          const directRes = await supabase
            .from("catalog_tiktok_performance" as any)
            .select(
              "song_name, tiktok_video_count, total_tiktok_plays, unique_creators, tiktok_status, cross_platform_gap, fan_to_artist_ratio, videos_last_7d, videos_last_30d, avg_tiktok_plays, tiktok_engagement_rate",
            )
            .eq("artist_entity_id", eid)
            .gt("tiktok_video_count", 0)
            .order("tiktok_video_count", { ascending: false })
            .limit(5);
          if (directRes.data && directRes.data.length > 0) return directRes;

          // Slow path: join through wb_entities song IDs
          if (artistSongEntityIds.length > 0) {
            return supabase
              .from("catalog_tiktok_performance" as any)
              .select(
                "song_name, tiktok_video_count, total_tiktok_plays, unique_creators, tiktok_status, cross_platform_gap, fan_to_artist_ratio, videos_last_7d, videos_last_30d, avg_tiktok_plays, tiktok_engagement_rate",
              )
              .in("song_entity_id", artistSongEntityIds)
              .gt("tiktok_video_count", 0)
              .order("tiktok_video_count", { ascending: false })
              .limit(5);
          }
          return { data: [] };
        })()
      : Promise.resolve({ data: [] }),
    eid
      ? supabase
          .from("artist_score" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("artist_tiktok_profile" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("artist_audience_footprint" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
          .then((r) => r)
          .catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("artist_playlist_intelligence" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
          .then((r) => r)
          .catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("artist_momentum" as any)
          .select("date, momentum_score, direction, zone")
          .eq("entity_id", eid)
          .order("date", { ascending: true })
          .limit(30)
          .then((r) => r)
          .catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] }),
    eid
      ? supabase
          .from("artist_streaming_pulse" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
          .then((r) => r)
          .catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("artist_touring_signal" as any)
          .select("*")
          .eq("entity_id", eid)
          .maybeSingle()
          .then((r) => r)
          .catch(() => ({ data: null }))
      : Promise.resolve({ data: null }),
    eid
      ? supabase
          .from("song_velocity" as any)
          .select(
            "song_name, daily_streams, total_streams, pct_change_7d, velocity_class, peak_ratio, rank_by_streams",
          )
          .eq("artist_entity_id", eid)
          .gt("daily_streams", 0)
          .order("daily_streams", { ascending: false })
          .limit(10)
          .then((r) => r)
          .catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] }),
    eid
      ? supabase
          .from("market_opportunity_v2" as any)
          .select(
            "country_code, is_present, opportunity_score, opportunity_tier, recommended_action, urgency, window_confidence, entry_song_name, entry_song_velocity, spillover_source_market, spillover_probability, estimated_activation_days, estimated_revenue_monthly, discovery_signal_type, velocity, platform_to_activate_first",
          )
          .eq("entity_id", eid)
          .gte("opportunity_score", 30)
          .order("opportunity_score", { ascending: false })
          .limit(12)
          .then((r) => r)
          .catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] }),
    // song_health: uses song entity IDs (same join pattern as catalog_tiktok_performance)
    artistSongEntityIds.length > 0
      ? supabase
          .from("song_health" as any)
          .select(
            "canonical_name, health_score, countries_charting, daily_streams",
          )
          .in("entity_id", artistSongEntityIds.slice(0, 50))
          .gt("health_score", 0)
          .order("health_score", { ascending: false })
          .limit(10)
          .then((r) => r)
          .catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] }),
  ]);

  const summary = summaryRes.data as any;
  const cp = commentPulseRes.data as any;
  const anomalies = (anomalyRes.data || []) as any[];
  const brief = briefRes.data as any;
  const catalog = (catalogRes.data || []) as any[];
  const score = scoreRes.data as any;
  const ttProfile = ttProfileRes.data as any;
  const footprint = footprintRes.data as any;
  const playlist = playlistRes.data as any;
  const momentumRows = (momentumRes.data || []) as any[];
  const pulse = pulseRes.data as any;
  const touring = touringRes.data as any;
  const velocityRows = (velocityRes.data || []) as any[];
  const marketRows = (marketRes.data || []) as any[];
  const songHealthRows = (songHealthRes.data || []) as any[];

  // Fallback: when artist_format_performance / artist_content_dna agg tables are
  // empty, derive them from deep_research_jobs.content_analysis_data so the
  // Content tab isn't blank for artists whose aggregation jobs haven't run yet.
  const synthesizedFormatRows =
    fmtRows.length === 0
      ? synthesizeFormatPerformance(
          formatVideos,
          drjData?.content_analysis_data?.summary?.median_views ?? null,
        )
      : [];
  const synthesizedDna =
    !dna && drjData?.content_analysis_data
      ? synthesizeContentDna(drjData.content_analysis_data)
      : null;

  // Parse brief_json
  let briefJson: any = null;
  if (brief?.brief_json) {
    try {
      briefJson =
        typeof brief.brief_json === "string"
          ? JSON.parse(brief.brief_json)
          : brief.brief_json;
    } catch {
      // non-critical
    }
  }

  return {
    // ── artist_score ──
    artistScore: score?.artist_score ?? null,
    tier: score?.tier ?? null,
    trend: score?.trend ?? null,
    globalRank: score?.global_rank ?? null,
    healthScore: score?.health_score ?? null,
    momentumScore: score?.momentum_score ?? null,
    discoveryScore: score?.discovery_score ?? null,
    catalogScore: score?.catalog_score ?? null,
    platformsGrowing: score?.platforms_growing ?? null,
    platformsDeclining: score?.platforms_declining ?? null,
    platformsTracked: score?.platforms_tracked ?? null,
    spotifyTrend: score?.spotify_trend ?? null,
    tiktokTrend: score?.tiktok_trend ?? null,
    youtubeTrend: score?.youtube_trend ?? null,
    shazamTrend: score?.shazam_trend ?? null,
    catalogDailyStreams: score?.catalog_daily_streams ?? null,
    catalogPctChange7d: score?.catalog_pct_change_7d ?? null,
    songsAccelerating: score?.songs_accelerating ?? null,
    viralSongs: score?.viral_songs ?? null,
    hotSongsCount: score?.hot_songs_count ?? null,
    listenersPeakRatio: score?.listeners_peak_ratio ?? null,
    soundSparkScore: score?.sound_spark_score ?? null,

    // ── artist_tiktok_profile ──
    tiktokGrade: ttProfile?.tiktok_grade ?? null,
    postingConsistency: ttProfile?.posting_consistency ?? null,
    ttTotalVideos: ttProfile?.total_videos ?? null,
    ttVideos30d: ttProfile?.videos_30d ?? null,
    ttVideos7d: ttProfile?.videos_7d ?? null,
    ttAvgPostsPerWeek: ttProfile?.avg_posts_per_week ?? null,
    ttDaysSinceLastPost: ttProfile?.days_since_last_post ?? null,
    ttPinnedVideos: ttProfile?.pinned_videos ?? null,
    ttOriginalSoundPct: ttProfile?.original_sound_pct ?? null,
    ttCommerceMusicPct: ttProfile?.commerce_music_pct ?? null,
    ttUniqueSoundsUsed: ttProfile?.unique_sounds_used ?? null,
    ttAvgPlays: ttProfile?.avg_plays ?? null,
    ttMedianPlays: ttProfile?.median_plays ?? null,
    ttBestVideoPlays: ttProfile?.best_video_plays ?? null,
    ttTotalPlays: ttProfile?.total_plays ?? null,
    ttAvgEngagementRate: ttProfile?.avg_engagement_rate ?? null,
    ttAvgLikes: ttProfile?.avg_likes ?? null,
    ttAvgComments: ttProfile?.avg_comments ?? null,
    ttAvgShares: ttProfile?.avg_shares ?? null,
    ttAvgSaves: ttProfile?.avg_saves ?? null,
    ttPlaysTrendPct: ttProfile?.plays_trend_pct ?? null,

    // ── artist_audience_footprint ──
    tiktokFollowers: footprint?.tiktok_followers ?? null,
    instagramFollowers: footprint?.instagram_followers ?? null,
    youtubeSubscribers: footprint?.youtube_subscribers ?? null,
    spotifyFollowers: footprint?.spotify_followers ?? null,
    totalSocialReach: footprint?.total_social_reach ?? null,
    dominantPlatform: footprint?.dominant_platform ?? null,
    fastestGrowingPlatform: footprint?.fastest_growing_platform ?? null,
    tiktokGrowth7d: footprint?.tiktok_growth_7d ?? null,
    tiktokGrowthPct7d: footprint?.tiktok_growth_pct_7d ?? null,
    instagramGrowth7d: footprint?.instagram_growth_7d ?? null,
    instagramGrowthPct7d: footprint?.instagram_growth_pct_7d ?? null,
    youtubeGrowth7d: footprint?.youtube_growth_7d ?? null,
    spotifyLoyaltyRatio: footprint?.spotify_loyalty_ratio ?? null,
    wikipediaPageviews: footprint?.wikipedia_pageviews ?? null,
    wikiDelta7d: footprint?.wiki_delta_7d ?? null,
    tiktokTotalLikes: footprint?.tiktok_total_likes ?? null,
    youtubeTotalViews: footprint?.youtube_total_views ?? null,

    // ── artist_format_performance (array), synthesized from deep_research_jobs
    //    when the agg table is empty ──
    formatPerformance:
      fmtRows.length > 0
        ? fmtRows.map((f: any) => ({
            contentFormat: f.content_format ?? "Unknown",
            videoCount: f.video_count ?? 0,
            pctOfTotal: f.pct_of_total ?? null,
            avgViews: f.avg_views ?? null,
            medianViews: f.median_views ?? null,
            maxViews: f.max_views ?? null,
            avgViralScore: f.avg_viral_score ?? null,
            avgHookScore: f.avg_hook_score ?? null,
            avgEngagementRate: f.avg_engagement_rate ?? null,
            performanceVsMedian: f.performance_vs_median ?? null,
            bestVideoCaption: f.best_video_caption ?? null,
            avgDurationSeconds: f.avg_duration_seconds ?? null,
            commonMoods: f.common_moods ?? null,
            commonHooks: f.common_hooks ?? null,
          }))
        : synthesizedFormatRows,

    // ── deep_research_jobs (videos grouped by format) ──
    formatVideos,

    // ── artist_comment_pulse ──
    commentPulse: cp
      ? {
          sentimentScore: cp.sentiment_score ?? null,
          fanEnergy: cp.fan_energy ?? null,
          audienceVibe: cp.audience_vibe ?? null,
          sentimentSignal: cp.sentiment_signal ?? null,
          sentimentThemes: cp.sentiment_themes ?? null,
          intentBreakdown: cp.intent_breakdown ?? null,
          fanRequests: cp.fan_requests ?? null,
          aiContentIdeas: cp.ai_content_ideas ?? null,
          totalCommentsAnalyzed: cp.total_comments_analyzed ?? null,
          trackedComments: cp.tracked_comments ?? null,
          totalCommentLikes: cp.total_comment_likes ?? null,
          topCommentLikes: cp.top_comment_likes ?? null,
          topCommentText: cp.top_comment_text ?? null,
          secondCommentText: cp.second_comment_text ?? null,
          thirdCommentText: cp.third_comment_text ?? null,
          avgCommentImpactPct: cp.avg_comment_impact_pct ?? null,
          totalReplies: cp.total_replies ?? null,
        }
      : null,

    // ── artist_playlist_intelligence ──
    playlistIntel: playlist
      ? {
          songsInPlaylists: playlist.songs_in_playlists ?? 0,
          totalPlaylistPlacements: playlist.total_playlist_placements ?? 0,
          totalPlaylistReach: playlist.total_playlist_reach ?? 0,
          avgPlaylistPosition: playlist.avg_playlist_position ?? null,
          bestPositionOverall: playlist.best_position_overall ?? null,
          highReachPlacements: playlist.high_reach_placements ?? 0,
          massivePlacements: playlist.massive_placements ?? 0,
          bestSong: playlist.best_song ?? null,
          bestPlaylistName: playlist.best_playlist_name ?? null,
          bestPlaylistReach: playlist.best_playlist_reach ?? null,
          overallReachTier: playlist.overall_reach_tier ?? null,
          topPlaylistSongs: playlist.top_playlist_songs ?? null,
        }
      : null,

    // ── tiktok_video_summary (expanded) ──
    videoSummary: summary
      ? {
          totalVideos: summary.total_videos ?? null,
          videos7d: summary.videos_7d ?? null,
          videos30d: summary.videos_30d ?? null,
          videos90d: summary.videos_90d ?? null,
          avgPlays: summary.avg_plays ?? null,
          medianPlays: summary.median_plays ?? null,
          bestPlays: summary.best_plays ?? null,
          totalPlays: summary.total_plays ?? null,
          avgLikes: summary.avg_likes ?? null,
          avgComments: summary.avg_comments ?? null,
          avgShares: summary.avg_shares ?? null,
          avgSaves: summary.avg_saves ?? null,
          avgViralityRatio: summary.avg_virality_ratio ?? null,
          pinnedCount: summary.pinned_count ?? null,
          pinnedAvgPlays: summary.pinned_avg_plays ?? null,
          pinnedTotalPlays: summary.pinned_total_plays ?? null,
          topSoundTitle: summary.top_sound_title ?? null,
          topSoundAuthor: summary.top_sound_author ?? null,
          topSoundUses: summary.top_sound_uses ?? null,
          topHashtags: summary.top_hashtags ?? null,
          originalSoundPct: summary.original_sound_pct ?? null,
          commerceMusicPct: summary.commerce_music_pct ?? null,
          avgEngagementRate: summary.avg_engagement_rate ?? null,
          consistencyScore: summary.consistency_score ?? null,
          postingCadence: summary.posting_cadence ?? null,
          playsTrendPct: summary.plays_trend_pct ?? null,
          engagementTrendPct: summary.engagement_trend_pct ?? null,
        }
      : null,

    // ── artist_content_dna (expanded) ──
    contentDna: dna
      ? {
          videosAnalyzed: dna.videos_analyzed ?? null,
          medianViews: dna.median_views ?? null,
          avgViews: dna.avg_views ?? null,
          avgDurationSeconds: dna.avg_duration_seconds ?? null,
          adContentPct: dna.ad_content_pct ?? null,
          originalSoundPct: dna.original_sound_pct ?? null,
          formatDistribution: dna.format_distribution ?? null,
          topHooks: dna.top_hooks ?? null,
          moodDistribution: dna.mood_distribution ?? null,
          genreDistribution: dna.genre_distribution ?? null,
          bestFormat: dna.best_format ?? null,
          bestFormatAvgViews: dna.best_format_avg_views ?? null,
          bestFormatCount: dna.best_format_count ?? null,
          bestFormatVsMedian: dna.best_format_vs_median ?? null,
          worstFormat: dna.worst_format ?? null,
          worstFormatAvgViews: dna.worst_format_avg_views ?? null,
          worstFormatCount: dna.worst_format_count ?? null,
          worstFormatVsMedian: dna.worst_format_vs_median ?? null,
          topQFormat: dna.top_q_format ?? null,
          topQAvgHookScore: dna.top_q_avg_hook_score ?? null,
          bottomQFormat: dna.bottom_q_format ?? null,
          bottomQAvgHookScore: dna.bottom_q_avg_hook_score ?? null,
          signatureStyle: dna.signature_style ?? null,
          primaryGenre: dna.primary_genre ?? null,
          dominantMood: dna.dominant_mood ?? null,
          avgHookScore: dna.avg_hook_score ?? null,
          avgViralScore: dna.avg_viral_score ?? null,
        }
      : synthesizedDna,

    // ── artist_content_evolution (expanded) ──
    performanceTrend: evo?.performance_trend ?? null,
    strategyLabel: evo?.strategy_label ?? null,
    formatShift: evo?.format_shift ?? null,
    viewsChangePct: evo?.views_change_pct ?? null,
    recentTopFormat: evo?.recent_top_format ?? null,
    priorTopFormat: evo?.prior_top_format ?? null,
    recentAvgViews: evo?.recent_avg_views ?? null,
    priorAvgViews: evo?.prior_avg_views ?? null,
    recentAvgHookScore: evo?.recent_avg_hook_score ?? null,
    priorAvgHookScore: evo?.prior_avg_hook_score ?? null,
    moodShift: evo?.mood_shift ?? null,
    recentDominantMood: evo?.recent_dominant_mood ?? null,
    priorDominantMood: evo?.prior_dominant_mood ?? null,
    newFormats: evo?.new_formats ?? null,
    droppedFormats: evo?.dropped_formats ?? null,

    // ── artist_momentum (sparkline) ──
    momentumSparkline: momentumRows.map((m: any) => ({
      date: m.date,
      score: m.momentum_score ?? 0,
      direction: m.direction ?? "flat",
      zone: m.zone ?? "positive",
    })),

    // ── artist_streaming_pulse ──
    streamingPulse: pulse
      ? {
          spotifyMonthlyListeners: pulse.spotify_monthly_listeners ?? null,
          spotifyDailyStreams: pulse.spotify_daily_streams ?? null,
          spotifyFollowers: pulse.spotify_followers ?? null,
          spotifyPeakListeners: pulse.spotify_peak_listeners ?? null,
          spotifyMlDelta7d: pulse.spotify_ml_delta_7d ?? null,
          spotifyMlPct7d: pulse.spotify_ml_pct_7d ?? null,
          spotifyPeakRatio: pulse.spotify_peak_ratio ?? null,
          spotifyDsDelta7d: pulse.spotify_ds_delta_7d ?? null,
          spotifyDsPct7d: pulse.spotify_ds_pct_7d ?? null,
          spotifyFollowersDelta7d: pulse.spotify_followers_delta_7d ?? null,
          leadStreamPct: pulse.lead_stream_pct ?? null,
          kworbGlobalRank: pulse.kworb_global_rank ?? null,
          kworbRankDelta7d: pulse.kworb_rank_delta_7d ?? null,
          deezerFans: pulse.deezer_fans ?? null,
          deezerFansDelta7d: pulse.deezer_fans_delta_7d ?? null,
        }
      : null,

    // ── artist_touring_signal ──
    touringSignal: touring
      ? {
          touringStatus: touring.touring_status ?? "no_live_activity",
          totalUpcomingEvents: touring.total_upcoming_events ?? 0,
          bandstownUpcoming: touring.bandsintown_upcoming ?? 0,
          ticketmasterUpcoming: touring.ticketmaster_upcoming ?? 0,
          newEventsAnnounced7d: touring.new_events_announced_7d ?? 0,
        }
      : null,

    // ── song_health ──
    songHealth: songHealthRows.map((h: any) => ({
      songName: h.canonical_name ?? "Unknown",
      healthScore: h.health_score ?? 0,
      countriesCharting: h.countries_charting ?? null,
      dailyStreams: h.daily_streams ?? null,
    })),

    // ── song_velocity ──
    songVelocity: velocityRows.map((v: any) => ({
      songName: v.song_name ?? "Unknown",
      dailyStreams: v.daily_streams ?? 0,
      totalStreams: v.total_streams ?? 0,
      pctChange7d: v.pct_change_7d ?? null,
      velocityClass: v.velocity_class ?? "steady",
      peakRatio: v.peak_ratio ?? null,
      rankByStreams: v.rank_by_streams ?? null,
    })),

    // ── market_opportunity_v2 ──
    marketExpansion: marketRows.map((m: any) => ({
      countryCode: m.country_code ?? "",
      isPresent: m.is_present ?? false,
      opportunityScore: m.opportunity_score ?? 0,
      opportunityTier: m.opportunity_tier ?? "minimal",
      recommendedAction: m.recommended_action ?? "monitor",
      urgency: m.urgency ?? "monitor",
      windowConfidence: m.window_confidence ?? "low",
      entrySongName: m.entry_song_name ?? null,
      entrySongVelocity: m.entry_song_velocity ?? null,
      spilloverSourceMarket: m.spillover_source_market ?? null,
      spilloverProbability: m.spillover_probability ?? null,
      estimatedActivationDays: m.estimated_activation_days ?? null,
      estimatedRevenue: m.estimated_revenue_monthly ?? null,
      discoverySignalType: m.discovery_signal_type ?? null,
      velocity: m.velocity ?? null,
      platformToActivateFirst: m.platform_to_activate_first ?? null,
    })),

    // ── existing (anomalies, brief, catalog) ──
    anomalies: anomalies.map((a) => ({
      type: a.anomaly_type,
      message: a.insight_message,
      severity: a.severity,
      date: a.scan_date,
    })),
    briefHtml: brief?.brief_html ?? null,
    briefGeneratedAt: brief?.generated_at ?? null,
    briefSections: Array.isArray(briefJson?.sections)
      ? briefJson.sections.map((s: any) => ({
          module: s.module ?? "",
          heading: s.heading ?? "",
          body: s.body ?? "",
          action: s.action ?? null,
          urgency: s.urgency ?? "low",
        }))
      : null,
    briefActionItems: Array.isArray(briefJson?.action_items)
      ? briefJson.action_items
      : null,
    topSongs: catalog.map((c: any) => ({
      songName: cleanSongName(c.song_name ?? ""),
      videoCount: c.tiktok_video_count,
      totalPlays: c.total_tiktok_plays,
      uniqueCreators: c.unique_creators,
      status: c.tiktok_status,
      crossPlatformGap: c.cross_platform_gap,
      fanToArtistRatio: c.fan_to_artist_ratio ?? null,
      videosLast7d: c.videos_last_7d ?? null,
      videosLast30d: c.videos_last_30d ?? null,
      avgTiktokPlays: c.avg_tiktok_plays ?? null,
      tiktokEngagementRate: c.tiktok_engagement_rate ?? null,
    })),
  };
}

/* ─── Hook ─────────────────────────────────────────────────── */

export function useContentIntelligence(
  entityId: string | null,
  artistHandle: string | null,
): { data: ContentIntelData | null; loading: boolean } {
  const query = useQuery({
    queryKey: ["content-intelligence", entityId, artistHandle],
    queryFn: () => fetchContentIntelligence(entityId, artistHandle),
    enabled: !!(entityId || artistHandle),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
  };
}
