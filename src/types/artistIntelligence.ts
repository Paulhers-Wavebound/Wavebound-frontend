// Types for Layer 2 Artist Intelligence endpoints
// Source: get-artist-card, get-artist-alerts, get-market-map, artist_tiktok_profile, catalog_tiktok_performance

export interface ArtistCard {
  entity_id: string;
  name: string;
  artist_score: number;
  tier: "elite" | "strong" | "developing" | "emerging" | "new";
  trend: "rising_fast" | "rising" | "stable" | "falling" | "falling_fast";
  global_rank: number;

  sub_scores: {
    health: number;
    momentum: number;
    discovery: number;
    catalog: number;
  };

  signals: {
    cross_platform:
      | "breakout"
      | "surging"
      | "rising"
      | "stable"
      | "dipping"
      | "cooling"
      | "watch_list";
    platforms_growing: number;
    platforms_declining: number;
    platforms_tracked: number;
    spotify_trend: number | null;
    tiktok_trend: number | null;
    youtube_trend: number | null;
    shazam_trend: number | null;
  };

  catalog: {
    status: "on_fire" | "hot" | "growing" | "stable" | "cooling" | "fading";
    depth_score: number;
    total_songs: number;
    daily_streams: number;
    growth_7d: number;
    viral_songs: number;
    accelerating_songs: number;
    top_song: string | null;
    top_song_streams: number | null;
    top_song_velocity: string | null;
    fastest_song: string | null;
    fastest_pct: number | null;
    songs_in_playlists: number;
    best_playlist: string | null;
  } | null;

  sentiment: {
    score: number;
    energy: number;
    themes: Array<{ theme: string; count: number; sample: string }>;
    comments_analyzed: number;
    as_of: string;
    audience_vibe: "rabid" | "engaged" | "casual" | "mixed" | "cold" | null;
    intent_breakdown: {
      hype: number;
      collab_request: number;
      complaint: number;
      praise: number;
      question: number;
      lyric_quote: number;
      trend_reference: number;
    } | null;
    content_ideas: string[] | null;
    top_requests: string[] | null;
  } | null;

  geo: { total_markets: number; dominant_markets: number };
  coverage: { score: number; missing: string[] };
  listeners_peak_ratio: number | null;

  sparkline: Array<{
    date: string;
    score: number;
    direction: "up" | "down" | "flat";
  }>;

  momentum: {
    score: number;
    direction: "up" | "down" | "flat";
    zone: "positive" | "negative";
    acceleration_7d: number;
  } | null;

  date: string;
}

export interface AlertEntry {
  date: string;
  entity_id: string;
  canonical_name: string;
  alert_type:
    | "song_momentum"
    | "playlist_add"
    | "cross_platform_breakout"
    | "metric_spike"
    | "geographic"
    | "fan_sentiment"
    | "catalog_status";
  severity: "celebration" | "warning" | "info";
  title: string;
  detail: string;
  data: Record<string, unknown>;
  priority: number;
  alert_rank: number;
}

export interface AlertsResponse {
  alerts: AlertEntry[];
  summary: {
    total: number;
    celebrations: number;
    warnings: number;
    infos: number;
    by_type: Record<string, number>;
  };
}

export interface MarketEntry {
  country_code: string;
  is_present: boolean;
  market_strength: "dominant" | "strong" | "medium" | "fringe" | null;
  best_position: number | null;
  platforms_charting: number | null;
  market_health_score: number;
  market_size: number;
  opportunity_score: number;
  opportunity_tier: "high" | "medium" | "low" | "minimal";
  recommended_action: "expand" | "grow" | "push" | "maintain" | "monitor";
}

export interface MarketMapResponse {
  entity_id: string;
  name: string;
  artist_score: number;

  presence: {
    total_markets: number;
    dominant_markets: number;
    present_in_results: number;
    absent_in_results: number;
  };

  summary: {
    high_opportunity: number;
    medium_opportunity: number;
    markets_to_expand: number;
    markets_to_grow: number;
    total_results: number;
  };

  markets: MarketEntry[];
}

export interface TikTokProfile {
  entity_id: string;
  tiktok_grade: "A" | "B" | "C" | "D" | "F";
  posting_consistency:
    | "daily"
    | "regular"
    | "sporadic"
    | "inactive"
    | "dormant";
  total_videos: number;
  videos_30d: number;
  avg_posts_per_week: number;
  days_since_last_post: number;
  original_sound_pct: number;
  avg_plays: number;
  median_plays: number;
  best_video_plays: number;
  avg_engagement_rate: number;
  plays_trend_pct: number | null;
}

export interface CatalogTikTokEntry {
  song_name: string;
  tiktok_video_count: number;
  total_tiktok_plays: number;
  unique_creators: number;
  fan_to_artist_ratio: number;
  tiktok_status: "viral" | "trending" | "active" | "established" | "emerging";
  cross_platform_gap:
    | "tiktok_hot_spotify_cold"
    | "spotify_hot_tiktok_cold"
    | "both_hot"
    | "normal";
  spotify_daily_streams: number;
}

// Tier visual config
export const TIER_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  elite: { label: "Elite", color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  strong: { label: "Strong", color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  developing: {
    label: "Developing",
    color: "#0A84FF",
    bg: "rgba(10,132,255,0.12)",
  },
  emerging: {
    label: "Emerging",
    color: "#BF5AF2",
    bg: "rgba(191,90,242,0.12)",
  },
  new: { label: "New", color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
};

export const TREND_CONFIG: Record<
  string,
  { label: string; arrow: string; color: string }
> = {
  rising_fast: {
    label: "Rising Fast",
    arrow: "\u2191\u2191",
    color: "#30D158",
  },
  rising: { label: "Rising", arrow: "\u2191", color: "#30D158" },
  stable: { label: "Stable", arrow: "\u2192", color: "#8E8E93" },
  falling: { label: "Falling", arrow: "\u2193", color: "#FF453A" },
  falling_fast: {
    label: "Falling Fast",
    arrow: "\u2193\u2193",
    color: "#FF453A",
  },
};

export const SIGNAL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  breakout: { label: "Breakout", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  surging: { label: "Surging", color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  rising: { label: "Rising", color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  stable: { label: "Stable", color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
  dipping: { label: "Dipping", color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  cooling: { label: "Cooling", color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  watch_list: {
    label: "Watch List",
    color: "#FF453A",
    bg: "rgba(255,69,58,0.12)",
  },
};

export const CATALOG_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  on_fire: { label: "On Fire", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  hot: { label: "Hot", color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  growing: { label: "Growing", color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  stable: { label: "Stable", color: "#8E8E93", bg: "rgba(142,142,147,0.12)" },
  cooling: { label: "Cooling", color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  fading: { label: "Fading", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
};

export const TIKTOK_GRADE_CONFIG: Record<
  string,
  { color: string; bg: string }
> = {
  A: { color: "#30D158", bg: "rgba(48,209,88,0.15)" },
  B: { color: "#0A84FF", bg: "rgba(10,132,255,0.15)" },
  C: { color: "#FFD60A", bg: "rgba(255,214,10,0.15)" },
  D: { color: "#FF9F0A", bg: "rgba(255,159,10,0.15)" },
  F: { color: "#FF453A", bg: "rgba(255,69,58,0.15)" },
};

export const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  celebration: {
    color: "#30D158",
    bg: "rgba(48,209,88,0.08)",
    border: "rgba(48,209,88,0.2)",
  },
  warning: {
    color: "#FFD60A",
    bg: "rgba(255,214,10,0.08)",
    border: "rgba(255,214,10,0.2)",
  },
  info: {
    color: "#0A84FF",
    bg: "rgba(10,132,255,0.08)",
    border: "rgba(10,132,255,0.2)",
  },
};

export const ALERT_TYPE_ICONS: Record<string, string> = {
  song_momentum: "\uD83D\uDD25",
  playlist_add: "\uD83D\uDCCB",
  cross_platform_breakout: "\uD83D\uDE80",
  metric_spike: "\uD83D\uDCC8",
  geographic: "\uD83C\uDF0D",
  fan_sentiment: "\uD83D\uDCAC",
  catalog_status: "\uD83D\uDCBF",
};
