export interface ScraperEntry {
  scraper_name: string;
  scraper_group: string;
  status: string;
  health: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  rows_inserted: number | null;
  entities_created: number | null;
  entities_matched: number | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  hours_since_completion: number | null;
  overdue_threshold_hours: number;
}

export interface ScraperRun {
  scraper_name: string;
  scraper_group: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  rows_inserted: number | null;
  entities_created: number | null;
  entities_matched: number | null;
  duration_ms: number | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

export interface DataFreshnessEntry {
  platform: string;
  last_observation_at: string;
  hours_ago: number;
  status: "fresh" | "stale" | "critical";
  observation_count: number;
}

export interface VelocityStatus {
  first_observation_date: string;
  days_of_data: number;
  days_until_velocity: number;
  velocity_active: boolean;
  pct_complete: number;
  target_date: string;
}

export interface AccumulationData {
  observations_today: number;
  observations_yesterday: number;
  observations_delta_pct: number;
  geo_today: number;
  geo_yesterday: number;
  geo_delta_pct: number;
  entities_created_today: number;
  entities_created_yesterday: number;
  platform_ids_today?: number;
  platform_ids_yesterday?: number;
  relationships_today?: number;
  relationships_yesterday?: number;
}

export interface CoverageData {
  artists_total: number;
  artists_with_geo: number;
  artists_with_geo_pct: number;
  artists_with_multi_platform: number;
  artists_with_multi_platform_pct: number;
  songs_total: number;
  songs_with_observations: number;
  songs_with_observations_pct: number;
  markets_total: number;
  avg_platforms_per_artist: number;
}

export interface PlatformBreakdownEntry {
  platform: string;
  total_observations: number;
  total_geo_observations: number;
  unique_entities: number;
  unique_countries: number;
  distinct_metrics: string[];
}

export interface ScoreDistribution {
  below_30: number;
  between_30_50: number;
  between_50_70: number;
  above_70: number;
}

export interface DbtModelStat {
  name: string;
  rows: number;
}

export interface DbtHealth {
  last_run_at: string | null;
  last_run_duration_seconds: number | null;
  last_run_status: "success" | "error" | null;
  total_models: number;
  entity_health_rows: number;
  entity_health_avg_score: number;
  entity_health_score_distribution: ScoreDistribution;
  discovery_momentum_active: number;
  streaming_momentum_active: number;
  social_momentum_active: number;
  geographic_momentum_active: number;
  song_health_rows: number;
  song_health_avg_score: number;
  song_health_has_radio: number;
  song_health_has_apple: number;
  song_health_has_youtube: number;
  market_health_rows: number;
  market_health_avg_score: number;
  daily_summaries_rows: number;
  daily_summaries_distinct_dates: number;
  daily_summaries_metric_combos: number;
  compression_models: DbtModelStat[];
  health_models: DbtModelStat[];
  intelligence_models: DbtModelStat[];
  anomalies_rows: number;
}

export interface TopEntities {
  most_listeners: Array<{ name: string; value: number }>;
  most_countries: Array<{ name: string; countries: number }>;
  most_platforms: Array<{ name: string; platforms: number }>;
  newest_entities: Array<{
    name: string;
    entity_type: string;
    created_at: string;
  }>;
}

export interface DataQuality {
  duplicate_observations: number;
  null_value_observations: number;
  zero_heavy_metrics: Array<{
    platform: string;
    metric: string;
    zero_pct: number;
  }>;
  orphan_entities: number;
}

/* ── Ops dashboard types ─────────────────────────────── */

export interface BriefingItem {
  severity: "critical" | "warning" | "info";
  category:
    | "scraper_error"
    | "scraper_overdue"
    | "data_stale"
    | "api_quota"
    | "unresolved";
  title: string;
  detail: string;
  scraper_name?: string;
}

export interface ScCreditSnapshot {
  scraper_name: string;
  completed_at: string;
  credits_remaining: number;
  api_calls: number;
}

export interface YtQuotaSnapshot {
  completed_at: string;
  quota_units_used: number;
}

export interface ApiQuotaData {
  sc_credits: {
    latest_remaining: number;
    burn_rate_daily: number;
    projected_exhaustion_date: string | null;
    history: ScCreditSnapshot[];
  };
  youtube: {
    daily_limit: number;
    history: YtQuotaSnapshot[];
  };
}

export interface PlatformIdTrend {
  platform: string;
  total: number;
  added_7d: number;
}

export interface PlatformIdDaily {
  platform: string;
  day: string;
  count: number;
}

export interface UnresolvedEntities {
  count: number;
  sample: Array<{ name: string; created_at: string }>;
}

export interface ScraperRunHistoryEntry {
  scraper_name: string;
  scraper_group: string;
  started_at: string;
  status: string;
}

/* ── Handle Health ──────────────────────────────────── */

export interface HandleHealthPlatform {
  platform: string;
  total: number;
  alive: number;
  dead: number;
  stale: number;
  changed: number;
  unknown_ct: number;
}

export interface HandleHealthDeath {
  entity_id: string;
  platform: string;
  platform_id: string;
  last_checked_at: string;
  consecutive_failures: number;
  artist_name: string;
}

export interface HandleHealthChange {
  entity_id: string;
  platform: string;
  old_handle: string;
  new_handle: string;
  changed_at: string;
  artist_name: string;
}

export interface HandleHealthData {
  total_handles: number;
  by_status: Record<string, number>;
  by_platform: HandleHealthPlatform[];
  never_checked: number;
  stale_over_7d: number;
  recent_deaths: HandleHealthDeath[];
  recent_changes: HandleHealthChange[];
}

/* ── Main response ───────────────────────────────────── */

export interface HealthData {
  overall_health: "green" | "yellow" | "red";
  scrapers_by_group: Record<string, ScraperEntry[]>;
  scrapers: ScraperEntry[];
  data_totals: Record<string, number>;
  checked_at: string;
  data_freshness: DataFreshnessEntry[] | null;
  velocity_status: VelocityStatus | null;
  accumulation: AccumulationData | null;
  coverage: CoverageData | null;
  platform_breakdown: PlatformBreakdownEntry[] | null;
  dbt_health: DbtHealth | null;
  top_entities: TopEntities | null;
  data_quality: DataQuality | null;
  api_quotas: ApiQuotaData | null;
  platform_id_trend: PlatformIdTrend[] | null;
  platform_id_daily: PlatformIdDaily[] | null;
  unresolved_entities: UnresolvedEntities | null;
  scraper_run_history: ScraperRunHistoryEntry[] | null;
  handle_health: HandleHealthData | null;
}
