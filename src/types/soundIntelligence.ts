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
  verdict: 'SCALE' | 'SATURATED' | 'EMERGING' | 'DECLINING';
  daily: number[];
  songBars: number[];
  hooks: FormatHooks;
  topVideos: FormatTopVideo[];
  insight: string;
}

export interface WinnerFormat {
  format: string;
  multiplier: number;
  video_count: number;
  avg_views: number;
  share_rate: number;
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

export interface SoundAnalysis {
  sound_url: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  status: 'accelerating' | 'active' | 'declining';
  created_at: string;
  last_scan: string;
  videos_analyzed: number;

  total_views: number;
  avg_share_rate: number;
  avg_duration_seconds: number;
  peak_day: string;
  peak_day_count: number;
  weekly_delta_videos: number;
  weekly_delta_views_pct: number;

  velocity: VelocityDay[];
  formats: FormatBreakdown[];
  winner: WinnerFormat;
  hook_analysis: HookAnalysis;
  duration: DurationAnalysis;
  top_videos: TopVideo[];
  creator_tiers: CreatorTier[];
  geography: GeoBreakdown[];
  lifecycle: LifecycleInfo;
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
  'Lyric Overlay': '#e8430a',
  'POV / Storytelling': '#0A84FF',
  'Reaction / Duet': '#BF5AF2',
  'Aesthetic / Mood': '#64D2FF',
  'Aesthetic / Mood Edit': '#64D2FF',
  'Transition Edit': '#30D158',
  'Concert Fancam': '#FFD60A',
  'Dance / Challenge': '#FF453A',
  'Skit / Comedy': '#FF6482',
  'Tutorial / GRWM': '#FF9F0A',
  'Audio Edit': '#8E8E93',
};

const FALLBACK_COLORS = ['#AC8E68', '#7EC8E3', '#C9B1FF', '#FFB4A2', '#B5E48C'];

export function getFormatColor(name: string, index = 0): string {
  return FORMAT_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}
