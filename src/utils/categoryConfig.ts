// Category configuration for content exploration
// Optimized: Load fewer items initially for faster page load
export const INITIAL_ITEMS_PER_CATEGORY = 12;
export const LOAD_MORE_ITEMS = 6;

export type CategoryKey = 
  | 'viralRightNowVideos'
  | 'viralRightNowReels'
  | 'trendingVideos'
  | 'trendingPhotoCarousels'
  | 'viralPhotoCarousels'
  | 'hookStatementVideos'
  | 'selfiePerformanceVideos'
  | 'selfieLipsyncVideos'
  | 'fastPaceVideos'
  | 'lyricVideoVideos'
  | 'proCameraLipsyncVideos'
  | 'livePerformanceVideos'
  | 'coverVideos'
  | 'memeVideos'
  | 'transitionVideos'
  | 'productionVideos'
  | 'compilationVisualsVideos'
  | 'cinematicEditVideos'
  | 'instrumentPerformanceVideos';

export interface CategoryConfig {
  key: CategoryKey;
  type: 'viral-tiktok' | 'viral-reels' | 'trending' | 'content-style' | 'photo-carousel';
  contentStyle?: string;
  scoreRange?: { min: number; max: number };
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: 'viralRightNowVideos', type: 'viral-tiktok' },
  { key: 'viralRightNowReels', type: 'viral-reels' },
  { key: 'trendingVideos', type: 'trending', scoreRange: { min: 0.6, max: 0.8 } },
  { key: 'trendingPhotoCarousels', type: 'photo-carousel', scoreRange: { min: 0.6, max: 0.8 } },
  { key: 'viralPhotoCarousels', type: 'photo-carousel' },
  { key: 'hookStatementVideos', type: 'content-style', contentStyle: 'hook statement' },
  { key: 'selfiePerformanceVideos', type: 'content-style', contentStyle: 'selfie performance' },
  { key: 'selfieLipsyncVideos', type: 'content-style', contentStyle: 'selfie lipsync' },
  { key: 'fastPaceVideos', type: 'content-style', contentStyle: 'fast pace' },
  { key: 'lyricVideoVideos', type: 'content-style', contentStyle: 'lyric video' },
  { key: 'proCameraLipsyncVideos', type: 'content-style', contentStyle: 'pro camera lipsync' },
  { key: 'livePerformanceVideos', type: 'content-style', contentStyle: 'live performance' },
  { key: 'coverVideos', type: 'content-style', contentStyle: 'cover' },
  { key: 'memeVideos', type: 'content-style', contentStyle: 'meme' },
  { key: 'transitionVideos', type: 'content-style', contentStyle: 'transition' },
  { key: 'productionVideos', type: 'content-style', contentStyle: 'production' },
  { key: 'compilationVisualsVideos', type: 'content-style', contentStyle: 'compilation visuals' },
  { key: 'cinematicEditVideos', type: 'content-style', contentStyle: 'cinematic edit' },
  { key: 'instrumentPerformanceVideos', type: 'content-style', contentStyle: 'instrument performance' },
];
