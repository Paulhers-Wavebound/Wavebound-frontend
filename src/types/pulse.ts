/** The Pulse — Globe visualization types
 *
 * "Raw" types match the backend RPC exactly.
 * "View" types are what the UI components consume (enriched/normalized).
 */

/* ─── Raw backend shapes (from get_globe_data RPC) ────────────── */

export interface RawGlobeCountry {
  country_code: string;
  activity_score: number; // absolute song count (not normalized)
  velocity_score: number;
  dominant_genre: string;
  genre_breakdown: Record<string, number>;
  platforms: Record<string, number>;
  new_entries: number;
  label_songs: number;
}

export interface RawFlowArc {
  entity_id: string;
  song_name: string;
  artist_name: string;
  genre: string;
  path: {
    country_code: string;
    platform: string;
    date: string;
    position: number;
  }[];
}

export interface RawGlobeAlert {
  type: string; // cross_platform_breakout | geographic | song_momentum | metric_spike
  artist: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface RawGlobeCounters {
  songs_tracked: number;
  countries_active: number;
  platforms: number;
  observations_today: number;
  artists_tracked: number;
  total_observations: number;
}

export interface RawGlobeData {
  countries: RawGlobeCountry[];
  flows: RawFlowArc[];
  counters: RawGlobeCounters;
  alerts: RawGlobeAlert[];
}

/* ─── Raw country detail (from get_country_detail RPC) ────────── */

export interface RawCountryDetailSong {
  entity_id: string;
  song_name: string;
  artist_name: string;
  genre: string;
  platforms: {
    platform: string;
    metric: string;
    value: number;
    change: string | null; // "NEW" or null
  }[];
  velocity_class: string | null;
  is_label_song: boolean;
  other_countries: string[];
}

export interface RawCountryDetailData {
  country_code: string;
  country_name?: string; // added by edge function
  songs: RawCountryDetailSong[];
  genre_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
  trending_up: number;
  new_entries: number;
}

/* ─── View models (enriched, what components render) ──────────── */

export interface GlobeCountry {
  country_code: string;
  country_name: string;
  activity_score: number; // 0–1 normalized for rendering
  raw_activity: number; // original absolute count
  song_count: number;
  platform_count: number;
  dominant_genre: string;
  new_entries: number;
  label_songs: number;
  lat: number;
  lng: number;
}

export interface FlowArc {
  id: string;
  song_name: string;
  artist_name: string;
  genre: string;
  path: { country_code: string; date: string }[];
  velocity: number; // derived from path length / days
}

export interface GlobeAlert {
  id: string;
  type: string;
  message: string;
  artist?: string;
  song?: string;
}

export interface GlobeCounters {
  total_songs: number;
  total_countries: number;
  total_platforms: number;
  total_observations: number;
  total_artists: number;
}

export interface GlobeData {
  countries: GlobeCountry[];
  flows: FlowArc[];
  counters: GlobeCounters;
  alerts: GlobeAlert[];
}

export interface CountryDetailSong {
  entity_id: string;
  song_name: string;
  artist_name: string;
  is_label_roster: boolean;
  velocity_class: string;
  platforms: {
    platform: string;
    metric: string;
    rank: number | null;
    rank_change: string | null;
    is_new: boolean;
  }[];
  also_in: string[];
}

export interface CountryDetailData {
  country_code: string;
  country_name: string;
  song_count: number;
  platform_count: number;
  trending_up: number;
  new_entries: number;
  songs: CountryDetailSong[];
  genre_breakdown: { genre: string; count: number }[];
  platform_breakdown: { platform: string; count: number }[];
  arbitrage?: CountryArbitrage;
}

/* ─── Arbitrage / Radar types ────────────────────────────────── */

export type ArbitrageLabel = "HIGH" | "MEDIUM" | "LOW";

export interface CountryArbitrage {
  score: number; // 0–100
  label: ArbitrageLabel;
  roi_vs_us: number; // e.g. 3.2
  recommendation: string;
  ad_costs: {
    tiktok_cpm: number;
    meta_cpm: number;
    youtube_cpm: number;
  };
  fan_value: {
    merch_enthusiasm: number; // 0–100
    live_attendance: number;
    streaming_payout: number;
    avg_ticket_price: number;
  };
  market_growth: {
    streaming_yoy: number; // percentage, e.g. 45
    social_penetration: number; // percentage
    tier: "Emerging" | "Growth" | "Mature" | "Saturated";
  };
}

export interface ArbitrageMarket {
  country_code: string;
  country_name: string;
  arbitrage_score: number;
  arbitrage_label: ArbitrageLabel;
  roi_vs_us: number;
  avg_cpm_blended: number;
  total_songs: number;
  active_songs: number;
  dominant_genre: string;
  dominant_genre_pct: number; // e.g. 45 for 45%
}

export interface ArbitrageData {
  leaderboard: ArbitrageMarket[];
  hero_insight: {
    country_name: string;
    country_code: string;
    roi_vs_us: number;
    avg_cpm: number;
    active_songs: number;
    headline: string;
  };
  opportunity_buckets: {
    high: number;
    medium: number;
    low: number;
  };
  us_baseline_cpm: number;
}
