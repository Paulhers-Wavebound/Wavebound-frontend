/**
 * A&R Command Center — Type Definitions
 *
 * Aligned to Bible_A&R.md:
 * - 5-stage discovery pipeline (§3)
 * - Scouting thresholds (§2)
 * - Deal structures (§5)
 * - Core "Alpha" metrics (§4)
 */

/* ─── Pipeline ────────────────────────────────────────────── */

export type PipelineStage =
  | "flagging"
  | "deep_dive"
  | "assessment"
  | "validation"
  | "execution";

export type ThresholdStatus =
  | "above"
  | "borderline"
  | "below"
  | "insufficient_data";

/* ─── Metrics ─────────────────────────────────────────────── */

/** Raw scouting numbers aligned to Bible §2 thresholds */
export interface ARMetrics {
  spotify_monthly_listeners: number;
  spotify_monthly_listeners_delta_pct: number; // MoM
  spotify_follower_growth_mom: number; // >15% threshold
  spotify_save_rate: number; // >10% threshold
  tiktok_followers: number;
  instagram_followers: number;
  social_engagement_rate: number; // >5% threshold
  track_completion_rate_30s: number; // >60% threshold
  live_ticket_capacity: number | null;
  live_sellout_pct: number | null;
  conversion_alpha: number; // casual → superfan ratio
  seven_day_velocity: number; // growth velocity Vg
}

/** Early-adopter region predicting Western success */
export interface TriggerMarket {
  country_code: string;
  country_name: string;
  region:
    | "US"
    | "UK"
    | "DACH"
    | "Nordics"
    | "LatAm"
    | "SEA"
    | "Africa"
    | "MENA";
  platform: string;
  position: number | null;
  velocity_score: number;
  is_early_adopter: boolean;
}

/** Which content version drives most engagement */
export interface FormatAlpha {
  best_format: string;
  best_format_engagement_lift: number;
  formats_tested: {
    format: string;
    engagement_rate: number;
    save_rate: number;
    completion_rate: number;
  }[];
}

/** Bible NLP classes: emoji → casual → recognition → event → purchase → collab */
export interface CommentIntent {
  total_analyzed: number;
  distribution: {
    emoji_only: number;
    casual_praise: number;
    artist_recognition: number;
    event_intent: number;
    purchase_intent: number;
    collab_request: number;
  };
  intent_score: number;
  top_signals: string[];
}

/** Cross-platform migration — the "killer metric" (Bible §10) */
export interface CrossPlatformMigration {
  tiktok_to_spotify: number;
  spotify_to_ig_follow: number;
  ig_to_merch: number | null;
  funnel_health: "strong" | "moderate" | "weak" | "broken";
  migration_trend: "accelerating" | "steady" | "declining";
}

/** Signability scorecard — 4 pills */
export interface SignabilityScore {
  overall: number;
  creative: { score: number; factors: string[] };
  commercial: { score: number; factors: string[] };
  legal_pulse: { score: number; factors: string[] };
  three_sixty_upside: {
    score: number;
    live_pct: number;
    merch_pct: number;
    endorsement_pct: number;
  };
}

/* ─── Deal ────────────────────────────────────────────────── */

export type DealTier = "development" | "viral_breakout" | "established";

export interface SignOffStep {
  role: string;
  status: "approved" | "pending" | "not_started" | "rejected";
}

export interface DealStatus {
  tier: DealTier;
  advance_range: [number, number];
  terms: string;
  three_sixty_clauses: { live: number; merch: number; endorsements: number };
  projected_irr: number;
  sign_off_chain: SignOffStep[];
}

/* ─── Ghost Curve ─────────────────────────────────────────── */

export interface GhostCurveMatch {
  artist_name: string;
  match_pct: number;
  week_offset: number;
}

/* ─── Growth Velocity ─────────────────────────────────────── */

export interface GrowthVelocity {
  value: number;
  acceleration: number;
  trend: "accelerating" | "steady" | "decelerating";
}

/* ─── Prospect (Central Object) ───────────────────────────── */

export interface ARProspect {
  id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string;
  origin_country: string;
  pipeline_stage: PipelineStage;
  rise_probability: number;
  threshold_status: ThresholdStatus;
  flagged_date: string;
  assigned_to: string | null;
  ghost_curve_match: GhostCurveMatch | null;
  growth_velocity: GrowthVelocity;
  metrics: ARMetrics;
  trigger_markets: TriggerMarket[];
  format_alpha: FormatAlpha;
  comment_intent: CommentIntent;
  cross_platform: CrossPlatformMigration;
  signability: SignabilityScore;
  deal_status: DealStatus | null;
  sparkline_data: number[];
  risk_flags: string[];
  ai_narrative: string;
  unreleased_test: { score: number; label: string } | null;
  /* Social handles & links (from ar_prospects columns) */
  source_platform: string;
  source_handle: string;
  tiktok_handle?: string | null;
  instagram_handle?: string | null;
  spotify_url?: string | null;
  /* RAG aggregate stats */
  total_rag_videos?: number;
  total_rag_plays?: number;
  avg_viral_score?: number;
  /* Discovery video — top viral video from HITL tables */
  discovery_video?: {
    web_url: string | null;
    play_count: number;
    like_count: number;
    share_count: number;
    collect_count: number;
    caption: string;
    video_cover_url: string | null;
    viral_score: number;
    performance_multiplier: string | null;
    music_title: string | null;
    music_author: string | null;
    duration_seconds: number | null;
    hashtags: string | null;
    creator_median_views: number | null;
    date_posted: string | null;
  } | null;
}

/* ─── Gemini Analysis (HITL per-video AI analysis) ───────── */

export interface GeminiAnalysis {
  hook_type?: string;
  content_style?: string;
  virality_type?: string;
  video_description?: string;
  comment_sentiment?: string;
  replicable_elements?: string;
  audio_analysis?: {
    mood?: Record<string, number>;
    genre?: Record<string, number>;
    sub_genre?: Record<string, number>;
    instruments?: Record<string, number>;
    voices?: {
      presence_profile?: string;
      predominant_gender?: string;
      confidence?: number;
    };
    lyric_analysis?: {
      themes?: string[];
      language?: string;
      sentiment?: string;
      transcription?: string;
    };
    emotional_profile?: {
      profile?: string;
      dynamics?: string;
      energy_level?: string;
      energy_dynamics?: string;
    };
    technical_feedback?: {
      key?: string;
      tempo_bpm?: number;
      effects?: string;
      quality?: string;
    };
  };
  visual_analysis?: {
    main_categories?: string[];
    sub_categories?: string[];
    hook?: string;
    description_of_video_and_context?: string;
    description_of_enviroment_and_location?: string;
    effort?: string;
    confidence?: Record<string, number>;
    gender_present?: string;
  };
}

/* ─── Enriched Video (HITL per-video record) ─────────────── */

export interface EnrichedVideo {
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  collect_count: number;
  caption: string;
  date_posted: string;
  viral_score: number;
  video_cover_url: string | null;
  video_id: string | null;
  web_url: string | null;
  performance_multiplier: string | null;
  music_name: string | null;
  music_author: string | null;
  duration_seconds: number | null;
  hashtags: string | null;
  creator_median_views: number | null;
  creator_avg_views: number | null;
  is_ad: boolean;
  is_author_artist: boolean;
  gemini_analysis: GeminiAnalysis | null;
  red_flags: string[];
  reasoning: string | null;
  confidence: number | null;
  location: string | null;
}

/* ─── Decision Points ─────────────────────────────────────── */

export type ARDecisionCategory =
  | "SCALE_NOW"
  | "REALLOCATE"
  | "PIPELINE"
  | "GREENLIGHT_READY"
  | "RISK";

export interface ARDecisionPoint {
  category: ARDecisionCategory;
  artist_name: string | null;
  avatar_url: string | null;
  signal: string;
  decision: string;
  urgency: "now" | "today" | "this_week";
  evidence: { label: string; value: string; color?: string }[];
}

/* ─── Roster Option ───────────────────────────────────────── */

export interface RosterOption {
  id: string;
  label: string;
  artist_count: number;
}

/* ─── Simulation ──────────────────────────────────────────── */

/** Legacy types kept for backward compat with mockARData */
export interface SimulationScenario {
  artist_id: string;
  deal_tier: DealTier;
  advance_amount: number;
  firm_albums: number;
  option_albums: number;
  live_pct: number;
  merch_pct: number;
  endorsement_pct: number;
  risk_factors: string[];
}

export interface SimulationResult {
  monte_carlo_distribution: { percentile: number; revenue: number }[];
  recoupment_timeline: {
    month: number;
    cumulative: number;
    break_even: boolean;
  }[];
  irr: number;
  roi: number;
  breakeven_months: number;
  risk_breakdown: { factor: string; weight: number; color: string }[];
  sign_off_chain: SignOffStep[];
}

/* ─── Enhanced Simulation (2026 Deal Simulator) ──────────── */

export type DealType =
  | "development_360"
  | "viral_distribution"
  | "established_licensing"
  | "indie_profit_split"
  | "upstream_subsidiary"
  | "ai_synthetic_hybrid"
  | "major_traditional"
  | "track_level_single";

export type RecoupmentModel = "at_royalty" | "net_profit";

export type RiskFactorId =
  | "cross_collateralization"
  | "fuzzy_recoupment"
  | "navil_perpetuity"
  | "ai_walled_garden"
  | "audit_barriers";

export interface SimulationState {
  artistId: string;
  dealType: DealType;
  advanceAmount: number;
  firmAlbums: number;
  optionAlbums: number;
  artistRoyaltyPct: number;
  termLengthYears: number;
  recoupmentModel: RecoupmentModel;
  livePct: number;
  merchPct: number;
  endorsementPct: number;
  riskFactors: RiskFactorId[];
}

export interface MonteCarloPercentile {
  percentile: number;
  revenue: number;
  artistNet: number;
  labelNet: number;
}

export interface ProjectionPoint {
  month: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface RecoupmentPoint {
  month: number;
  cumulativeLabel: number;
  cumulativeArtist: number;
  breakEven: boolean;
}

export interface RiskImpact {
  id: RiskFactorId;
  label: string;
  description: string;
  impactPct: number;
  appliedMultiplier: number;
  color: string;
}

export interface SignalInsight {
  type: "positive" | "warning" | "critical";
  title: string;
  detail: string;
}

export interface EnhancedSimulationResult {
  monteCarloDistribution: MonteCarloPercentile[];
  projectionTimeline: ProjectionPoint[];
  recoupmentTimeline: RecoupmentPoint[];
  labelIRR: number;
  artistIRR: number;
  labelROI: number;
  artistROI: number;
  breakevenMonths: number;
  probabilityOfRecoupment: number;
  riskBreakdown: RiskImpact[];
  aggregateRiskMultiplier: number;
  signOffChain: SignOffStep[];
  approvalProbability: number;
  insights: SignalInsight[];
  iterationsRun: number;
  computeTimeMs: number;
}

export interface DealPreset {
  id: DealType;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  defaults: Omit<SimulationState, "artistId">;
  advanceRange: { min: number; median: number; max: number };
  royaltyRange: { min: number; max: number };
  termRange: { min: number; max: number };
  has360: boolean;
  tags: string[];
}

export interface RiskFactorDefinition {
  id: RiskFactorId;
  label: string;
  description: string;
  impactDescription: string;
  impactMultiplier: number;
  impactTarget: string;
  color: string;
}

/* ─── Pipeline Stage Config ───────────────────────────────── */

export const PIPELINE_STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; color: string; bg: string }
> = {
  flagging: {
    label: "Flagging",
    color: "#8E8E93",
    bg: "rgba(142,142,147,0.12)",
  },
  deep_dive: {
    label: "Deep Dive",
    color: "#0A84FF",
    bg: "rgba(10,132,255,0.12)",
  },
  assessment: {
    label: "Assessment",
    color: "#FFD60A",
    bg: "rgba(255,214,10,0.12)",
  },
  validation: {
    label: "Validation",
    color: "#BF5AF2",
    bg: "rgba(191,90,242,0.12)",
  },
  execution: {
    label: "Execution",
    color: "#30D158",
    bg: "rgba(48,209,88,0.12)",
  },
};

/** Rise Probability color scale */
export function getRiseProbabilityColor(rp: number): string {
  if (rp >= 8) return "#30D158";
  if (rp >= 5) return "#0A84FF";
  if (rp >= 3) return "#FFD60A";
  return "#FF453A";
}

/** Threshold status config */
export const THRESHOLD_CONFIG: Record<
  ThresholdStatus,
  { label: string; color: string; bg: string }
> = {
  above: { label: "Above", color: "#30D158", bg: "rgba(48,209,88,0.12)" },
  borderline: {
    label: "Borderline",
    color: "#FFD60A",
    bg: "rgba(255,214,10,0.12)",
  },
  below: { label: "Below", color: "#FF453A", bg: "rgba(255,69,58,0.12)" },
  insufficient_data: {
    label: "No Data",
    color: "#8E8E93",
    bg: "rgba(142,142,147,0.12)",
  },
};
