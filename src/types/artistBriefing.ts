// Types for Artist Intelligence V2 — "The Analyst That Never Sleeps"
// Covers: Briefing Hero, Signal Map, Opportunity Engine, Outlook

// ─── Velocity & Signal Types ───────────────────────────────────────

export type VelocityClass =
  | "viral"
  | "accelerating"
  | "growing"
  | "steady"
  | "decelerating"
  | "declining"
  | "new";

export type MomentumDirection = "up" | "down" | "flat";

export type OpportunityUrgency = "act_now" | "plan" | "monitor";
export type WindowConfidence = "high" | "medium" | "low";

// ─── Song Velocity (from song_velocity table) ─────────────────────

export interface SongVelocityEntry {
  entity_id: string;
  song_name: string;
  artist_entity_id: string;
  artist_name: string;
  daily_streams: number;
  total_streams: number;
  delta_1d: number;
  delta_7d: number;
  pct_change_7d: number;
  z_score: number;
  peak_daily_streams: number;
  peak_ratio: number;
  velocity_class: VelocityClass;
  rank_by_streams: number;
  rank_by_growth: number;
}

// ─── Enhanced Market Opportunity (from market_opportunity_v2) ──────

export interface MarketOpportunityV2 {
  entity_id: string;
  country_code: string;
  is_present: boolean;
  market_strength: "dominant" | "strong" | "medium" | "fringe" | null;
  best_position: number | null;
  platforms_charting: number | null;

  // Velocity
  velocity: "surging" | "rising" | "stable" | "declining" | "exiting" | null;
  position_delta_7d: number | null;
  stream_pct_change_7d: number | null;
  days_trending: number | null;
  best_velocity_platform: string | null;

  // Discovery signals
  discovery_divergence: number | null;
  discovery_signal_type:
    | "pre_breakout"
    | "early_demand"
    | "discovery_only"
    | "streaming_only"
    | "balanced"
    | null;
  discovery_score: number | null;
  streaming_score: number | null;
  discovery_platform_list: string[] | null;

  // Entry song
  entry_song_entity_id: string | null;
  entry_song_name: string | null;
  song_entry_score: number | null;
  song_velocity: VelocityClass | null;
  song_adjacent_markets: number | null;

  // Spillover
  spillover_source_market: string | null;
  spillover_probability: number | null;
  spillover_median_lag: number | null;
  spillover_sample_size: number | null;
  estimated_activation_days: number | null;
  estimated_weeks_remaining: number | null;

  // Revenue
  estimated_monthly_streams: number | null;
  estimated_revenue_monthly: number | null;
  per_stream_rate: number | null;

  // Scoring
  opportunity_score: number;
  opportunity_tier: "high" | "medium" | "low" | "minimal";
  recommended_action: "expand" | "grow" | "push" | "maintain" | "monitor";
  window_confidence: WindowConfidence | null;
  urgency: OpportunityUrgency | null;

  // Score breakdown
  base_score: number | null;
  discovery_bonus: number | null;
  song_bonus: number | null;
  spillover_bonus: number | null;
  platform_fit_bonus: number | null;
  velocity_bonus: number | null;
}

// ─── Market Intelligence (CPM data from market_intelligence) ──────

export interface MarketIntelligence {
  country_code: string;
  country_name: string;
  avg_cpm_tiktok: number | null;
  avg_cpm_meta: number | null;
  avg_cpm_youtube: number | null;
  avg_cpm_blended: number | null;
  streaming_payout_index: number | null;
  market_tier: "tier_1" | "tier_2" | "emerging" | "frontier";
  population_millions: number | null;
  yoy_streaming_growth: number | null;
  social_penetration: number | null;
}

// ─── Market Spillover (cascade probabilities) ─────────────────────

export interface MarketSpillover {
  from_country: string;
  to_country: string;
  median_lag_days: number;
  avg_lag_days: number;
  confidence_pct: number;
  sample_size: number;
}

// ─── Assembled Briefing Data ──────────────────────────────────────

export interface BriefingData {
  // From get-artist-card
  artistCard: import("./artistIntelligence").ArtistCard;
  // From get-artist-alerts
  alerts: import("./artistIntelligence").AlertsResponse;
  // Enhanced market data
  marketsV2: MarketOpportunityV2[];
  // Song velocity for this artist
  songs: SongVelocityEntry[];
  // Market CPM data
  marketIntel: MarketIntelligence[];
  // Spillover predictions relevant to this artist's active markets
  spillovers: MarketSpillover[];
}

// ─── Generated Briefing Paragraph ─────────────────────────────────

export interface BriefingParagraph {
  text: string;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  keyDrivers: string[];
}

// ─── Opportunity Card (assembled client-side) ─────────────────────

export interface OpportunityCard {
  priority: number;
  type: "strike_now" | "test" | "reallocate" | "defend" | "explore";
  title: string;
  country_code: string;
  country_name: string;

  // Why this opportunity exists
  why: string;

  // The specific play
  play: {
    platform: string;
    budget_usd: number;
    target_cities: string[];
    projected_reach: number;
    cpm: number;
    roi_vs_us: number | null;
  };

  // Timing
  window_days: number;
  window_urgency: "critical" | "high" | "medium" | "normal";

  // Spillover info
  spillover_targets?: Array<{
    country_code: string;
    country_name: string;
    probability: number;
    lag_days: number;
  }>;

  // Score
  opportunity_score: number;
}

// ─── Signal Group (for Signal Map section) ─────────────────────────

export interface SignalGroup {
  velocity: "breaking_out" | "growing" | "steady" | "declining";
  label: string;
  icon: string;
  color: string;
  songs: SignalSong[];
}

export interface SignalSong {
  song_name: string;
  entity_id: string;
  velocity_class: VelocityClass;
  daily_streams: number;
  pct_change_7d: number;
  markets: SignalMarket[];
  cascade: CascadeDetection | null;
}

export interface SignalMarket {
  country_code: string;
  country_name: string;
  platform: string;
  position: number | null;
  position_delta_7d: number | null;
  velocity: string | null;
  is_new: boolean; // entered < 7 days
}

export interface CascadeDetection {
  pattern: string; // e.g. "TikTok → Shazam → Spotify"
  stage: number;
  totalStages: number;
  prediction: string | null;
  confidence: "high" | "medium" | "low";
}

// ─── Outlook Predictions ──────────────────────────────────────────

export interface MarketPrediction {
  country_code: string;
  country_name: string;
  probability: number;
  source: string; // what's driving this prediction
  estimated_days: number;
}

export interface PlatformCascadePrediction {
  song_name: string;
  country: string;
  stages: Array<{
    platform: string;
    status: "confirmed" | "predicted";
    day: number | null;
    position: number | null;
  }>;
  confidence: string;
  basis: string;
}

export interface RiskItem {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

// ─── Velocity visual config ───────────────────────────────────────

export const VELOCITY_CONFIG: Record<
  VelocityClass,
  { label: string; color: string; bg: string; icon: string }
> = {
  viral: {
    label: "Viral",
    color: "#FF453A",
    bg: "rgba(255,69,58,0.12)",
    icon: "\uD83D\uDD25",
  },
  accelerating: {
    label: "Accelerating",
    color: "#FF9F0A",
    bg: "rgba(255,159,10,0.12)",
    icon: "\uD83D\uDE80",
  },
  growing: {
    label: "Growing",
    color: "#30D158",
    bg: "rgba(48,209,88,0.12)",
    icon: "\uD83D\uDCC8",
  },
  steady: {
    label: "Steady",
    color: "#8E8E93",
    bg: "rgba(142,142,147,0.12)",
    icon: "\u2794",
  },
  decelerating: {
    label: "Decelerating",
    color: "#FFD60A",
    bg: "rgba(255,214,10,0.12)",
    icon: "\uD83D\uDCC9",
  },
  declining: {
    label: "Declining",
    color: "#FF453A",
    bg: "rgba(255,69,58,0.12)",
    icon: "\uD83D\uDD3B",
  },
  new: {
    label: "New",
    color: "#BF5AF2",
    bg: "rgba(191,90,242,0.12)",
    icon: "\u2728",
  },
};

export const URGENCY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  strike_now: {
    label: "STRIKE NOW",
    color: "#30D158",
    bg: "rgba(48,209,88,0.12)",
  },
  test: { label: "TEST", color: "#FFD60A", bg: "rgba(255,214,10,0.12)" },
  reallocate: {
    label: "REALLOCATE",
    color: "#FF453A",
    bg: "rgba(255,69,58,0.12)",
  },
  defend: { label: "DEFEND", color: "#FF9F0A", bg: "rgba(255,159,10,0.12)" },
  explore: { label: "EXPLORE", color: "#0A84FF", bg: "rgba(10,132,255,0.12)" },
};
