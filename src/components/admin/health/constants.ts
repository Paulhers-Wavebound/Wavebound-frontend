import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import {
  SUPABASE_URL_RAW,
  SUPABASE_ANON_KEY as SUPABASE_ANON_KEY_SRC,
} from "@/integrations/supabase/client";

export const SUPABASE_URL = SUPABASE_URL_RAW;
export const SUPABASE_ANON_KEY = SUPABASE_ANON_KEY_SRC;

export const SCRAPER_LABELS: Record<string, string> = {
  kworb_listeners: "Spotify listeners (25K)",
  kworb_country_charts: "Spotify country charts (80)",
  kworb_global_ranking: "Global digital ranking",
  kworb_radio: "US radio chart",
  kworb_youtube: "YouTube views + trending",
  kworb_apple_charts: "Apple Music + iTunes charts",
  kworb_tiktok: "TikTok trending charts",
  kworb_shazam: "Shazam charts",
  kworb_platform_charts: "Apple/iTunes/Deezer per-country",
  free_youtube_api: "YouTube API (subs, views)",
  free_wikipedia: "Wikipedia pageviews",
  free_deezer: "Deezer API (fans)",
  free_lastfm: "Last.fm (listeners, tags)",
  free_musicbrainz: "MusicBrainz (IDs, metadata)",
  free_genius: "Genius (lyrics pageviews)",
  dbt_run: "dbt transforms",
  dbt_test: "dbt tests",
};

export const GROUP_ORDER: { key: string; label: string; schedule: string }[] = [
  { key: "4x_daily", label: "4x daily", schedule: "Every 6 hours" },
  { key: "daily", label: "Daily", schedule: "Runs at 01:00 UTC" },
  { key: "free_apis", label: "Free APIs", schedule: "Runs at 04:00 UTC" },
  { key: "dbt", label: "dbt", schedule: "Runs at 06:00 UTC" },
];

export const TOTAL_LABELS: Record<string, string> = {
  wb_entities: "Entities",
  wb_observations: "Observations",
  wb_observations_geo: "Geo",
  wb_platform_ids: "Platform IDs",
  wb_entity_relationships: "Relationships",
};

export const BANNER_CONFIG = {
  red: {
    bg: "var(--red-light)",
    color: "#ef4444",
    icon: XCircle,
    text: "Scrapers failed in last 24h",
  },
  yellow: {
    bg: "var(--yellow-light)",
    color: "#f59e0b",
    icon: AlertTriangle,
    text: "Scrapers overdue",
  },
  green: {
    bg: "var(--green-light)",
    color: "#34d399",
    icon: CheckCircle2,
    text: "All systems operational",
  },
} as const;

export const PLATFORM_COLORS: Record<string, string> = {
  spotify: "#1DB954",
  youtube: "#FF4444",
  tiktok: "#69C9D0",
  shazam: "#0088FF",
  apple_music: "#FC3C44",
  itunes: "#A855F7",
  deezer: "#A238FF",
  lastfm: "#D51007",
  genius: "#FFFF64",
  wikipedia: "#9CA3AF",
  bandsintown: "#00CEC8",
  musicbrainz: "#BA478F",
  radio: "#6366F1",
  kworb: "#22c55e",
};

export const ENTITY_TYPE_COLORS: Record<string, string> = {
  artist: "#3b82f6",
  sound: "#f59e0b",
  playlist: "#8b5cf6",
  creator: "#ec4899",
  market: "#22c55e",
  niche: "#6366f1",
};

/**
 * Estimated daily intake targets per table, derived from cron schedules.
 * Tune these as the scraper fleet evolves.
 *
 * wb_observations: ~25K listeners (×4) + 300×9 global ranking (×4) + 15K×9 extended + charts
 * wb_observations_geo: country charts (73 countries) + artist charts (ramping up)
 * wb_entities: new entities from overnight artist detail discovery
 */
export const DAILY_TARGETS: Partial<Record<string, number>> = {
  wb_observations: 300_000,
  wb_observations_geo: 50_000,
  wb_entities: 500,
};

/* ── Ops dashboard constants ─────────────────────────── */

/** Expected cron intervals per scraper group, used for gap detection */
export const CRON_SCHEDULES: Record<
  string,
  { interval_hours: number; expected_utc?: string }
> = {
  "4x_daily": { interval_hours: 6 },
  daily: { interval_hours: 24, expected_utc: "01:00" },
  free_apis: { interval_hours: 24, expected_utc: "04:00" },
  dbt: { interval_hours: 24, expected_utc: "06:00" },
};

/** Alert thresholds for API quotas */
export const QUOTA_THRESHOLDS = {
  sc_credits: { warn: 100_000, critical: 25_000, total: 500_000 },
  youtube_daily: { warn: 8_000, critical: 9_500, total: 10_000 },
};

/** ScrapeCreators scraper names (for filtering quota data from metadata) */
export const SC_SCRAPERS = [
  "sc_tiktok_trending_sounds",
  "sc_tiktok_trending_hashtags",
  "sc_tiktok_profiles",
  "sc_tiktok_comments",
  "sc_tiktok_sound_details",
  "sc_tiktok_sound_videos",
  "sc_tiktok_audience_geo",
  "sc_tiktok_handle_discovery",
];

/** Maps data_totals keys → AccumulationData field names for today/yesterday/delta values */
export const ACCUMULATION_KEY_MAP: Record<
  string,
  { today: string; yesterday: string; delta?: string }
> = {
  wb_observations: {
    today: "observations_today",
    yesterday: "observations_yesterday",
    delta: "observations_delta_pct",
  },
  wb_observations_geo: {
    today: "geo_today",
    yesterday: "geo_yesterday",
    delta: "geo_delta_pct",
  },
  wb_entities: {
    today: "entities_created_today",
    yesterday: "entities_created_yesterday",
  },
};
