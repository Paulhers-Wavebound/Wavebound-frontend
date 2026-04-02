export interface VelocityDay {
  date: string;
  videos: number;
  avg_views: number;
}

export interface FormatHooks {
  face_pct: number;
  snippet: string;
  snippet_pct: number;
  top_hooks: string[];
}

export interface FormatTopVideo {
  handle: string;
  why: string;
  views: string;
  share: string;
  video_url?: string;
}

export interface FormatBreakdown {
  name: string;
  video_count: number;
  pct_of_total: number;
  avg_views: number;
  share_rate: number;
  actual_share_rate?: number;
  verdict: "SCALE" | "SATURATED" | "EMERGING" | "DECLINING";
  daily: number[];
  posting_hours?: number[];
  songBars: number[];
  hooks: FormatHooks;
  topVideos: FormatTopVideo[];
  insight: string;
  top_niches?: { name: string; count: number }[];
  top_intents?: { name: string; count: number }[];
  dominant_vibe?: string;
}

export interface WinnerFormat {
  format: string;
  multiplier: number;
  video_count: number;
  avg_views: number;
  share_rate: number;
  actual_share_rate?: number;
  recommendation: string;
}

export interface HookAnalysis {
  face_pct: number;
  face_multiplier: number;
  text_hook_pct: number;
  top_hooks: string[];
  optimal_snippet: string;
  snippet_appearance_pct: number;
}

export interface DurationAnalysis {
  top10_avg: number;
  bottom10_avg: number;
  insight: string;
}

export interface TopVideo {
  rank: number;
  creator: string;
  format: string;
  why: string;
  views: string;
  share_rate: string;
  url: string;
  niche?: string;
  intent?: string;
  vibe?: string;
}

export interface TierFormatPref {
  name: string;
  pct: number;
}

export interface TierCreator {
  handle: string;
  followers: string;
  views: string;
  share: string;
}

export interface CreatorTier {
  tier: string;
  range: string;
  count: number;
  pct: number;
  avg_views: number;
  avg_share_rate: number;
  daily: number[];
  firstPostDay: string;
  peakDay: string;
  daysActive: number;
  topFormats: TierFormatPref[];
  topCreators: TierCreator[];
  insight: string;
}

export interface GeoFormatPref {
  name: string;
  pct: number;
}

export interface GeoBreakdown {
  country: string;
  flag: string;
  pct: number;
  daily: number[];
  firstPostDay: string;
  peakDay: string;
  daysActive: number;
  topFormats: GeoFormatPref[];
  avgViews: string;
  avgShare: string;
  insight: string;
}

export interface LifecycleInfo {
  current_phase: string;
  days_since_peak: number;
  current_velocity: number;
  insight: string;
}

// === v2 Classification Types ===

export interface NicheEntry {
  niche: string;
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface IntentEntry {
  intent: "organic" | "artist_official" | "paid" | "fan_account";
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface SongRoleEntry {
  role: "primary" | "background" | "sound_bite";
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface VibeEntry {
  vibe: string;
  video_count: number;
  pct: number;
  avg_views: number;
  engagement: number;
}

export interface CreatorProfileEntry {
  profile: string;
  video_count: number;
  pct: number;
  avg_views: number;
}

export interface AgeBreakdownEntry {
  age: string;
  count: number;
  pct: number;
}

export interface GenderBreakdownEntry {
  gender: string;
  count: number;
  pct: number;
}

export interface CreatorDemographics {
  profiles: CreatorProfileEntry[];
  age_breakdown: AgeBreakdownEntry[];
  gender_breakdown: GenderBreakdownEntry[];
}

export interface SoundAnalysis {
  sound_url: string;
  cover_url?: string | null;
  track_name: string;
  artist_name: string;
  album_name: string;
  status: "accelerating" | "active" | "declining";
  created_at: string;
  last_scan: string;
  last_refresh_at?: string | null;
  refresh_count?: number;
  videos_analyzed: number;
  total_videos_on_sound?: number | null;

  total_views: number;
  avg_share_rate: number;
  actual_share_rate?: number;
  avg_duration_seconds: number;
  peak_day: string;
  peak_day_count: number;
  weekly_delta_videos: number;
  weekly_delta_views_pct: number;
  posting_hours?: number[];

  velocity: VelocityDay[];
  formats: FormatBreakdown[];
  winner: WinnerFormat;
  hook_analysis: HookAnalysis;
  duration: DurationAnalysis;
  top_videos: TopVideo[];
  creator_tiers: CreatorTier[];
  geography: GeoBreakdown[];
  lifecycle: LifecycleInfo;

  // v2 classification axes
  niche_distribution?: NicheEntry[];
  intent_breakdown?: IntentEntry[];
  song_role_distribution?: SongRoleEntry[];
  vibe_distribution?: VibeEntry[];
  creator_demographics?: CreatorDemographics;
  unclassified_count?: number;
}

// Monitoring state returned by list/get endpoints
export interface SoundMonitoring {
  monitoring_interval: "standard" | "intensive" | "paused";
  last_monitored_at: string | null;
  next_check_at: string | null;
  spike_format: string | null;
  intensive_since: string | null;
}

// Alert from get-sound-alerts
export interface SoundAlert {
  id: string;
  job_id: string;
  label_id: string;
  sound_id: string;
  alert_type:
    | "format_spike"
    | "format_peak"
    | "new_videos_detected"
    | "velocity_surge"
    | "format_emerging"
    | "spike_ended"
    | "user_count_milestone";
  severity: "info" | "warning" | "celebration";
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  track_name: string;
  artist_name: string;
  cover_url: string | null;
}

// Monitoring snapshot from get-sound-monitoring-history
export interface MonitoringSnapshot {
  id: number;
  job_id: string;
  sound_id: string;
  captured_at: string;
  user_count: number;
  total_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  new_videos_count: number;
  format_stats: Record<
    string,
    {
      count: number;
      views: number;
      likes: number;
      shares: number;
      comments: number;
      engagement: number;
    }
  >;
  niche_stats?: Record<string, { count: number; views: number; likes: number }>;
  intent_stats?: Record<
    string,
    { count: number; views: number; likes: number }
  >;
}

export interface FormatGrowth {
  views_start: number;
  views_end: number;
  views_delta: number;
  growth_pct: number;
  count_start: number;
  count_end: number;
}

export interface MonitoringHistorySummary {
  snapshot_count: number;
  hours_span: number;
  total_view_growth: number;
  total_video_growth: number;
  format_growth: Record<string, FormatGrowth>;
}

export interface SoundIntelligenceState {
  jobId: string | null;
  soundId: string | null;
  analysis: SoundAnalysis | null;
  isLoading: boolean;
  loadingStatus: string | null;
  progress: { videos_scraped: number; videos_analyzed: number } | null;
  expandedFormat: number | null;
  expandedTier: number | null;
  expandedGeo: number | null;
  disabledTrendLines: Set<string>;
  searchInput: string;
  error: string | null;
}

export const FORMAT_COLORS: Record<string, string> = {
  // === v3 canonical format names ===
  "Lip Sync / Dance": "#FF453A",
  "Dance Choreography": "#FF6B6B",
  "Comedy": "#FF6482",
  "POV": "#0A84FF",
  "Talking Head": "#5AC8FA",
  "Tutorial": "#FF9F0A",
  "Reaction": "#BF5AF2",
  "Cover": "#E040FB",
  "Vlog": "#0A84FF",
  "Review": "#B5E48C",
  "Lyric Overlay": "#e8430a",
  "Aesthetic Edit": "#64D2FF",
  "Transition Edit": "#30D158",
  "Montage": "#7EC8E3",
  "Slideshow": "#AC8E68",
  "Text Story": "#C9B1FF",
  "Concert": "#FFD60A",
  "BTS": "#FFA726",
  "ASMR": "#8E8E93",
  "Pet": "#FFCA28",
  "Food": "#FF8A65",
  "Art": "#DA70D6",
  "Fitness": "#34C759",
  "Gaming Clip": "#EF5350",
  // === Legacy mappings (pre-v3 data backwards compat) ===
  "Skit / Comedy": "#FF6482",
  "Meme / Remix Edit": "#FF6482",
  "POV / Storytelling": "#0A84FF",
  "Talking Head / Opinion": "#5AC8FA",
  "Tutorial / GRWM": "#FF9F0A",
  "GRWM / Tutorial": "#FF9F0A",
  "Reaction / Duet": "#BF5AF2",
  "Unboxing / Review": "#B5E48C",
  "Aesthetic / Mood Edit": "#64D2FF",
  "Aesthetic / Mood": "#64D2FF",
  "Compilation / Montage": "#7EC8E3",
  "Carousel / Slideshow": "#AC8E68",
  "Text Story / Rant": "#C9B1FF",
  "Concert / Live Event": "#FFD60A",
  "Concert Fancam": "#FFD60A",
  "BTS / Behind the Scenes": "#FFA726",
  "ASMR / Satisfying": "#8E8E93",
  "Satisfying / ASMR": "#8E8E93",
  "Pet / Animal": "#FFCA28",
  "Food / Cooking": "#FF8A65",
  "Cooking / Food": "#FF8A65",
  "Art / Creative Process": "#DA70D6",
  "Art / Creative": "#DA70D6",
  "Fitness / Sports": "#34C759",
  "Fitness / Workout": "#34C759",
  // === v1 legacy ===
  "Dance / Challenge": "#FF453A",
  "Audio Edit": "#8E8E93",
  "Fan Edit": "#FFB4A2",
  "Product Review": "#B5E48C",
  "Travel / Adventure": "#64D2FF",
  "Vlog / Lifestyle": "#0A84FF",
  "Beauty / Skincare": "#FF6482",
  "Educational / Informative": "#0A84FF",
  Other: "#636366",
};

export const VIBE_COLORS: Record<string, string> = {
  // v3 canonical single-word vibe names
  Playful: "#FFD60A",
  Confident: "#FF453A",
  Chill: "#64D2FF",
  Hype: "#FF9F0A",
  Edgy: "#8E8E93",
  Emotional: "#BF5AF2",
  Wholesome: "#30D158",
  // Legacy backwards-compat
  "Funny / Playful": "#FFD60A",
  "Confident / Flex": "#FF453A",
  "Chill / Aesthetic": "#64D2FF",
  "Hype / Party": "#FF9F0A",
  "Edgy / Raw": "#8E8E93",
  "Emotional / Sentimental": "#BF5AF2",
  "Wholesome / Feel-Good": "#30D158",
};

export const INTENT_COLORS: Record<string, string> = {
  organic: "#30D158",
  artist_official: "#0A84FF",
  paid: "#FFD60A",
  fan_account: "#BF5AF2",
};

const FALLBACK_COLORS = ["#AC8E68", "#7EC8E3", "#C9B1FF", "#FFB4A2", "#B5E48C"];

export function getFormatColor(name: string, index = 0): string {
  return FORMAT_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
