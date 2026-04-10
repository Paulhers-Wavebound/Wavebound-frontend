// Expansion Radar V2 — full response shape from expansion-radar-v2 edge function

export interface ExpansionRadarV2Artist {
  entity_id: string;
  name: string;
  monthly_listeners: number;
  global_rank: number | null;
  artist_score: number;
  tier: string;
  trend: string;
  momentum_score: number;
  cross_platform_signal: string;
  platforms_growing: number;
  markets_reached: number;
  total_markets_tracked: number;
}

export interface ScoreBreakdown {
  base: number;
  discovery: number;
  song: number;
  spillover: number;
  platform_fit: number;
  velocity: number;
}

export interface EntrySong {
  entity_id: string;
  name: string;
  score: number;
  velocity: string;
  adjacent_markets: number;
}

export interface SpilloverSource {
  market: string;
  market_name: string;
  probability: number;
  estimated_weeks: number | null;
  sample_size: number;
}

export type Velocity =
  | "surging"
  | "rising"
  | "stable"
  | "declining"
  | "exiting";
export type MarketStrength = "dominant" | "strong" | "medium" | "fringe";
export type WindowConfidence = "high" | "medium" | "low";
export type Urgency = "act_now" | "plan" | "monitor";

export interface ActiveMarket {
  country_code: string;
  country_name: string;
  is_present: true;
  market_strength: MarketStrength;
  best_position: number;
  opportunity_score: number;
  velocity: Velocity;
  position_delta_7d: number;
  stream_pct_change_7d: number;
  days_trending: number;
  discovery_divergence: number;
  discovery_signal_type: string;
  entry_song: EntrySong | null;
  spillover_from: SpilloverSource | null;
  estimated_monthly_streams: number;
  estimated_revenue_monthly: number;
  chart_streams: number | null;
  platform_to_activate_first: string;
  window_confidence: WindowConfidence;
  urgency: Urgency;
  score_breakdown: ScoreBreakdown;
}

export interface ExpansionOpportunity {
  country_code: string;
  country_name: string;
  is_present: false;
  market_strength: MarketStrength | null;
  best_position: number;
  opportunity_score: number;
  velocity: Velocity;
  position_delta_7d: number;
  stream_pct_change_7d: number;
  days_trending: number;
  discovery_divergence: number;
  discovery_signal_type: string;
  entry_song: EntrySong | null;
  spillover_from: SpilloverSource | null;
  estimated_monthly_streams: number;
  estimated_revenue_monthly: number;
  platform_to_activate_first: string;
  window_confidence: WindowConfidence;
  urgency: Urgency;
  score_breakdown: ScoreBreakdown;
}

export type SignalType =
  | "pre_breakout"
  | "early_demand"
  | "discovery_only"
  | "streaming_only"
  | "balanced";

export interface DiscoveryRadarEntry {
  country_code: string;
  country_name: string;
  discovery_score: number;
  streaming_score: number;
  divergence: number;
  signal_type: SignalType;
  discovery_platform_count: number;
  is_present: boolean;
}

export interface EntrySongRecommendation {
  country_code: string;
  country_name: string;
  song_entity_id: string;
  song_name: string;
  entry_score: number;
  velocity_class: string;
  adjacent_market_count: number;
  best_position: number;
  platforms_charting: number;
  playlist_reach: number;
  reach_tier: string;
  global_daily_streams: number;
  rank_for_market: number;
}

export interface SpilloverPrediction {
  from_market: string;
  from_market_name: string;
  to_market: string;
  to_market_name: string;
  probability_pct: number;
  median_days: number;
  sample_size: number;
  source: "computed" | "blended" | "seed";
  region_cluster: string | null;
}

export interface MarketHeatEntry {
  country_code: string;
  country_name: string;
  is_present: boolean;
  market_strength: string | null;
  signal_score: number;
  velocity: string;
  discovery_score: number;
  market_health_score: number;
}

export interface ComparableArtist {
  entity_id: string;
  name: string;
  slug: string | null;
  markets_reached: number;
  common_markets: number;
  unique_markets: string[];
  unique_market_names: string[];
}

export interface RevenueSizing {
  total_uncaptured_monthly: number;
  top_markets: Array<{
    country_code: string;
    country_name: string;
    estimated_streams: number;
    estimated_revenue: number;
    per_stream_rate: number;
  }>;
  methodology: string;
}

// Market intelligence (global, not per-artist)
export interface MarketIntelligence {
  country_code: string;
  country_name: string;
  avg_cpm_blended: number;
  fan_value_index: number;
  arbitrage_score: number;
  avg_ticket_price_usd: number;
  merch_enthusiasm_index: number;
  live_attendance_index: number;
  yoy_streaming_growth: number;
  population_millions: number;
  internet_penetration: number;
  music_revenue_per_capita: number;
  top_platform: string;
}

export type ArbitrageAction =
  | "go_now"
  | "test"
  | "optimize"
  | "baseline"
  | "monitor";

export interface ExpansionRadarResponse {
  artist: ExpansionRadarV2Artist;
  active_markets: ActiveMarket[];
  discovery_radar: DiscoveryRadarEntry[];
  entry_songs: EntrySongRecommendation[];
  spillover_predictions: SpilloverPrediction[];
  expansion_opportunities: ExpansionOpportunity[];
  market_heat: MarketHeatEntry[];
  comparable_artists: ComparableArtist[];
  revenue_sizing: RevenueSizing;
  _meta: {
    generated_at: string;
    query_time_ms: number;
    version: "v2" | "v3";
    is_roster?: boolean;
  };

  // Roster-only fields (present when _meta.is_roster === true)
  enriched_opportunities?: EnrichedOpportunity[];
  roster_signals?: RosterSignals;
  market_evidence?: Record<string, EvidenceItem[]>;
  budget_allocation?: BudgetAllocation[];
}

// ─── Roster Expansion Intelligence types ───

export interface EvidenceItem {
  type:
    | "tiktok_audience"
    | "language"
    | "discovery"
    | "spillover"
    | "song_entry"
    | "velocity"
    | "touring";
  text: string;
  value: number | string;
  confidence: "high" | "medium" | "low";
}

export interface SignalScore {
  score: number;
}

export interface AudienceSignal extends SignalScore {
  tiktok_pct: number | null;
}

export interface LanguageSignal extends SignalScore {
  pct: number;
  languages: string[];
}

export interface FanIntensitySignal extends SignalScore {
  energy: number;
  vibe: string;
}

export interface TouringSignal extends SignalScore {
  status: string;
}

export interface PlatformSignal extends SignalScore {
  dominant: string;
}

export interface PlaylistSignal extends SignalScore {
  reach_tier: string;
}

export interface EnrichedOpportunity {
  country_code: string;
  country_name: string;
  is_present: boolean;
  market_strength: MarketStrength | null;
  best_position: number;
  opportunity_score: number;
  enriched_score: number;
  signal_convergence: number;
  enriched_tier: "high" | "medium" | "low" | "minimal";
  enriched_urgency: "act_now" | "plan" | "monitor";

  velocity: Velocity;
  position_delta_7d: number;
  stream_pct_change_7d: number;
  days_trending: number;

  discovery_divergence: number;
  discovery_signal_type: string;

  entry_song: EntrySong | null;
  spillover_from: SpilloverSource | null;

  estimated_monthly_streams: number;
  estimated_revenue_monthly: number;
  platform_to_activate_first: string;
  window_confidence: WindowConfidence;

  // Roster signal scores
  audience_signal: AudienceSignal;
  language_signal: LanguageSignal;
  fan_intensity: FanIntensitySignal;
  touring_signal: TouringSignal;
  platform_signal: PlatformSignal;
  playlist_signal: PlaylistSignal;

  score_breakdown: ScoreBreakdown;
  evidence_items: EvidenceItem[];
}

export interface RosterSignals {
  tiktok_audience_geo: Array<{
    country_code: string;
    country_name: string;
    audience_pct: number;
    has_chart_presence: boolean;
  }>;
  comment_language_distribution: Record<string, number>;
  fan_energy: number;
  audience_vibe: string;
  sentiment_score: number;
  touring_status: string;
  total_upcoming_events: number;
  new_events_announced_7d: number;
  dominant_platform: string;
  fastest_growing_platform: string;
  total_social_reach: number;
  tiktok_growth_pct_7d: number;
  playlist_reach_tier: string;
  total_playlist_reach: number;
  top_comments: Array<{
    text: string;
    language: string;
    likes: number;
    replies: number;
  }>;
}

export interface BudgetAllocation {
  country_code: string;
  country_name: string;
  recommended_pct: number;
  enriched_score: number;
  signal_convergence: number;
  estimated_roi_index: number;
  cpm: number;
  fan_value_index: number;
  reasoning: string;
}
