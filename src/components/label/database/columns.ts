export type FormatterType =
  | "text"
  | "score"
  | "number"
  | "bigNumber"
  | "percent"
  | "percentChange"
  | "tier"
  | "trend"
  | "signal"
  | "tiktokGrade"
  | "postingConsistency"
  | "platformTrend"
  | "rank";

export interface ColumnDef {
  key: string;
  label: string;
  group: string;
  width: number;
  sortKey?: string; // only artist_score columns (server-side sortable)
  formatter: FormatterType;
  align?: "left" | "right" | "center";
}

export const COLUMN_GROUPS = [
  "Identity",
  "Core Scores",
  "Rank & Tier",
  "Platform Trends",
  "Catalog",
  "Coverage & Geo",
  "TikTok (Score)",
  "Radio",
  "Apple Music",
  "Sound Intel",
  "Other",
  "TikTok Profile",
] as const;

export const COLUMNS: ColumnDef[] = [
  // ─── Identity ───
  {
    key: "canonical_name",
    label: "Artist",
    group: "Identity",
    width: 200,
    sortKey: "canonical_name",
    formatter: "text",
    align: "left",
  },

  // ─── Core Scores ───
  {
    key: "artist_score",
    label: "Score",
    group: "Core Scores",
    width: 72,
    sortKey: "artist_score",
    formatter: "score",
    align: "right",
  },
  {
    key: "health_score",
    label: "Health",
    group: "Core Scores",
    width: 72,
    sortKey: "health_score",
    formatter: "score",
    align: "right",
  },
  {
    key: "momentum_score",
    label: "Momentum",
    group: "Core Scores",
    width: 86,
    sortKey: "momentum_score",
    formatter: "score",
    align: "right",
  },
  {
    key: "discovery_score",
    label: "Discovery",
    group: "Core Scores",
    width: 86,
    sortKey: "discovery_score",
    formatter: "score",
    align: "right",
  },
  {
    key: "catalog_score",
    label: "Catalog",
    group: "Core Scores",
    width: 76,
    sortKey: "catalog_score",
    formatter: "score",
    align: "right",
  },

  // ─── Rank & Tier ───
  {
    key: "global_rank",
    label: "#",
    group: "Rank & Tier",
    width: 60,
    sortKey: "global_rank",
    formatter: "rank",
    align: "right",
  },
  {
    key: "tier",
    label: "Tier",
    group: "Rank & Tier",
    width: 96,
    sortKey: "tier",
    formatter: "tier",
    align: "center",
  },
  {
    key: "trend",
    label: "Trend",
    group: "Rank & Tier",
    width: 108,
    sortKey: "trend",
    formatter: "trend",
    align: "center",
  },
  {
    key: "cross_platform_signal",
    label: "Signal",
    group: "Rank & Tier",
    width: 100,
    sortKey: "cross_platform_signal",
    formatter: "signal",
    align: "center",
  },

  // ─── Platform Trends ───
  {
    key: "spotify_trend",
    label: "Spotify",
    group: "Platform Trends",
    width: 76,
    sortKey: "spotify_trend",
    formatter: "platformTrend",
    align: "right",
  },
  {
    key: "tiktok_trend",
    label: "TikTok %",
    group: "Platform Trends",
    width: 80,
    sortKey: "tiktok_trend",
    formatter: "platformTrend",
    align: "right",
  },
  {
    key: "tiktok_followers_latest",
    label: "TT Followers",
    group: "Platform Trends",
    width: 100,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "youtube_trend",
    label: "YT %",
    group: "Platform Trends",
    width: 72,
    sortKey: "youtube_trend",
    formatter: "platformTrend",
    align: "right",
  },
  {
    key: "youtube_subscribers_latest",
    label: "YT Subs",
    group: "Platform Trends",
    width: 88,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "shazam_trend",
    label: "Shazam",
    group: "Platform Trends",
    width: 78,
    sortKey: "shazam_trend",
    formatter: "platformTrend",
    align: "right",
  },

  // ─── Catalog ───
  {
    key: "total_songs",
    label: "Songs",
    group: "Catalog",
    width: 68,
    sortKey: "total_songs",
    formatter: "number",
    align: "right",
  },
  {
    key: "catalog_daily_streams",
    label: "Daily Streams",
    group: "Catalog",
    width: 110,
    sortKey: "catalog_daily_streams",
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "catalog_pct_change_7d",
    label: "7d %",
    group: "Catalog",
    width: 72,
    sortKey: "catalog_pct_change_7d",
    formatter: "percentChange",
    align: "right",
  },
  {
    key: "songs_accelerating",
    label: "Accel.",
    group: "Catalog",
    width: 64,
    sortKey: "songs_accelerating",
    formatter: "number",
    align: "right",
  },
  {
    key: "top_song_name",
    label: "Top Song",
    group: "Catalog",
    width: 160,
    sortKey: "top_song_name",
    formatter: "text",
    align: "left",
  },
  {
    key: "fastest_song_name",
    label: "Fastest Song",
    group: "Catalog",
    width: 160,
    sortKey: "fastest_song_name",
    formatter: "text",
    align: "left",
  },

  // ─── Coverage & Geo ───
  {
    key: "coverage_score",
    label: "Coverage",
    group: "Coverage & Geo",
    width: 84,
    sortKey: "coverage_score",
    formatter: "score",
    align: "right",
  },
  {
    key: "missing_platforms",
    label: "Missing",
    group: "Coverage & Geo",
    width: 120,
    sortKey: "missing_platforms",
    formatter: "text",
    align: "left",
  },
  {
    key: "total_markets",
    label: "Markets",
    group: "Coverage & Geo",
    width: 76,
    sortKey: "total_markets",
    formatter: "number",
    align: "right",
  },
  {
    key: "dominant_markets",
    label: "Top Markets",
    group: "Coverage & Geo",
    width: 140,
    sortKey: "dominant_markets",
    formatter: "text",
    align: "left",
  },

  // ─── TikTok (Score) ───
  {
    key: "tiktok_videos_30d",
    label: "Vids 30d",
    group: "TikTok (Score)",
    width: 82,
    sortKey: "tiktok_videos_30d",
    formatter: "number",
    align: "right",
  },
  {
    key: "tiktok_engagement_rate",
    label: "Eng. Rate",
    group: "TikTok (Score)",
    width: 86,
    sortKey: "tiktok_engagement_rate",
    formatter: "percent",
    align: "right",
  },
  {
    key: "tiktok_avg_plays",
    label: "Avg Plays",
    group: "TikTok (Score)",
    width: 90,
    sortKey: "tiktok_avg_plays",
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tiktok_original_sound_pct",
    label: "Orig. %",
    group: "TikTok (Score)",
    width: 76,
    sortKey: "tiktok_original_sound_pct",
    formatter: "percent",
    align: "right",
  },

  // ─── Radio ───
  {
    key: "songs_on_radio",
    label: "Songs",
    group: "Radio",
    width: 68,
    sortKey: "songs_on_radio",
    formatter: "number",
    align: "right",
  },
  {
    key: "best_radio_position",
    label: "Best Pos.",
    group: "Radio",
    width: 82,
    sortKey: "best_radio_position",
    formatter: "rank",
    align: "right",
  },
  {
    key: "total_radio_audience",
    label: "Audience",
    group: "Radio",
    width: 90,
    sortKey: "total_radio_audience",
    formatter: "bigNumber",
    align: "right",
  },

  // ─── Apple Music ───
  {
    key: "apple_charting_songs",
    label: "Charting",
    group: "Apple Music",
    width: 80,
    sortKey: "apple_charting_songs",
    formatter: "number",
    align: "right",
  },
  {
    key: "best_apple_position",
    label: "Best Pos.",
    group: "Apple Music",
    width: 82,
    sortKey: "best_apple_position",
    formatter: "rank",
    align: "right",
  },

  // ─── Sound Intel ───
  {
    key: "sounds_analyzed",
    label: "Sounds",
    group: "Sound Intel",
    width: 74,
    sortKey: "sounds_analyzed",
    formatter: "number",
    align: "right",
  },
  {
    key: "sound_spark_score",
    label: "Spark",
    group: "Sound Intel",
    width: 68,
    sortKey: "sound_spark_score",
    formatter: "score",
    align: "right",
  },

  // ─── Other ───
  {
    key: "viral_songs",
    label: "Viral",
    group: "Other",
    width: 64,
    sortKey: "viral_songs",
    formatter: "number",
    align: "right",
  },
  {
    key: "hot_songs_count",
    label: "Hot Songs",
    group: "Other",
    width: 84,
    sortKey: "hot_songs_count",
    formatter: "number",
    align: "right",
  },
  {
    key: "listeners_peak_ratio",
    label: "Peak Ratio",
    group: "Other",
    width: 88,
    sortKey: "listeners_peak_ratio",
    formatter: "percent",
    align: "right",
  },

  // ─── TikTok Profile (from artist_tiktok_profile — NOT server-sortable) ───
  {
    key: "tt_grade",
    label: "Grade",
    group: "TikTok Profile",
    width: 64,
    formatter: "tiktokGrade",
    align: "center",
  },
  {
    key: "tt_posting_consistency",
    label: "Posting",
    group: "TikTok Profile",
    width: 96,
    formatter: "postingConsistency",
    align: "center",
  },
  {
    key: "tt_total_videos",
    label: "Total Vids",
    group: "TikTok Profile",
    width: 86,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_videos_30d",
    label: "30d Vids",
    group: "TikTok Profile",
    width: 80,
    formatter: "number",
    align: "right",
  },
  {
    key: "tt_videos_7d",
    label: "7d Vids",
    group: "TikTok Profile",
    width: 72,
    formatter: "number",
    align: "right",
  },
  {
    key: "tt_avg_posts_per_week",
    label: "Posts/wk",
    group: "TikTok Profile",
    width: 80,
    formatter: "number",
    align: "right",
  },
  {
    key: "tt_days_since_last_post",
    label: "Days Idle",
    group: "TikTok Profile",
    width: 82,
    formatter: "number",
    align: "right",
  },
  {
    key: "tt_pinned_videos",
    label: "Pinned",
    group: "TikTok Profile",
    width: 68,
    formatter: "number",
    align: "right",
  },
  {
    key: "tt_original_sound_pct",
    label: "Orig. Snd %",
    group: "TikTok Profile",
    width: 96,
    formatter: "percent",
    align: "right",
  },
  {
    key: "tt_commerce_music_pct",
    label: "Comm. %",
    group: "TikTok Profile",
    width: 80,
    formatter: "percent",
    align: "right",
  },
  {
    key: "tt_unique_sounds_used",
    label: "Uniq. Sounds",
    group: "TikTok Profile",
    width: 100,
    formatter: "number",
    align: "right",
  },
  {
    key: "tt_avg_plays",
    label: "Avg Plays",
    group: "TikTok Profile",
    width: 90,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_median_plays",
    label: "Med. Plays",
    group: "TikTok Profile",
    width: 90,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_best_video_plays",
    label: "Best Video",
    group: "TikTok Profile",
    width: 96,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_total_plays",
    label: "Total Plays",
    group: "TikTok Profile",
    width: 100,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_avg_engagement_rate",
    label: "Eng. Rate",
    group: "TikTok Profile",
    width: 86,
    formatter: "percent",
    align: "right",
  },
  {
    key: "tt_avg_likes",
    label: "Avg Likes",
    group: "TikTok Profile",
    width: 86,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_avg_comments",
    label: "Avg Comms",
    group: "TikTok Profile",
    width: 90,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_avg_shares",
    label: "Avg Shares",
    group: "TikTok Profile",
    width: 90,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_avg_saves",
    label: "Avg Saves",
    group: "TikTok Profile",
    width: 86,
    formatter: "bigNumber",
    align: "right",
  },
  {
    key: "tt_plays_trend_pct",
    label: "Plays Trend",
    group: "TikTok Profile",
    width: 92,
    formatter: "percentChange",
    align: "right",
  },
];

// Precompute column group spans for the group header row
export function getGroupSpans(
  cols?: ColumnDef[],
): { group: string; span: number }[] {
  const source = cols ?? COLUMNS;
  const spans: { group: string; span: number }[] = [];
  for (const col of source) {
    const last = spans[spans.length - 1];
    if (last && last.group === col.group) {
      last.span++;
    } else {
      spans.push({ group: col.group, span: 1 });
    }
  }
  return spans;
}

// Filter columns by hidden groups (Identity is never hidden)
export function filterColumns(hiddenGroups: Set<string>): ColumnDef[] {
  if (hiddenGroups.size === 0) return COLUMNS;
  return COLUMNS.filter(
    (col) => col.group === "Identity" || !hiddenGroups.has(col.group),
  );
}
