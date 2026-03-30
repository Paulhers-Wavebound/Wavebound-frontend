export interface Video {
  id: number;
  video_url: string;
  outliar_score: number;
  video_views: number;
  video_likes: number;
  comments: string;
  profile_followers: number;
  caption?: string;
  hook?: string;
  who?: string;
  genre?: string;
  sub_genre?: string;
  gif_url?: string | null;
  thumbnail_url?: string | null;
  content_style?: string;
  audience?: string;
  gender?: string;
  date_posted?: string;
  embedded_ulr?: string; // TikTok URL
  video_file_url?: string; // Full video URL from storage
  is_reel?: boolean; // Flag to indicate if this is an Instagram Reel
  ai_hook?: string; // AI-generated hook from content plan
  ai_description?: string; // AI-generated description from content plan
  ai_content_category?: string; // Content category from content plan
  ai_full_description?: string; // Full description from content plan
  Artist?: string; // TikTok artist/username
  profile_bio?: string; // Profile bio
  isPhotoCarousel?: boolean; // Flag for photo carousel handling in modal
  postUrl?: string; // Full TikTok post URL for photo carousel embed
  ai_effort?: string; // AI-assigned effort level (Low, Medium, High)
  ai_content_type_platform?: string; // AI-assigned content type and platform (e.g., "video, tiktok")
  plan_video_id?: number; // Original video ID from content plan
  viral_score?: number; // Viral score from database
  performance_multiplier?: string; // Performance multiplier from database
  context?: string; // AI-generated context from Visual AI table
  description?: string; // AI-generated description from Visual AI table
  sub_style?: string; // Content sub-style
  label_reasons?: string; // Why the AI labeled the content this way
  evidence_pointers?: string; // Evidence pointers from AI
}

export interface PhotoCarousel {
  id: number;
  embedded_url?: string;
  outliar_score?: number;
  photo_views?: number;
  photo_likes?: number;
  comments?: string;
  profile_followers?: number;
  caption?: string;
  Hook?: string;
  "who?"?: string;
  genre?: string;
  sub_genre?: string;
  content_style?: string;
  Audience?: string;
  gender?: string;
  date_posted?: string;
  artist?: string;
  profile_bio?: string;
  photo_text_1?: string;
  photo_text_2?: string;
  photo_text_3?: string;
  photo_text_4?: string;
  photo_text_5?: string;
  photo_url_1?: string;
  photo_url_2?: string;
  photo_url_3?: string;
  posts?: number;
  photo_saves?: number;
  sound_id?: number;
  sound_url?: string;
  content_sub_style?: string;
  median_views?: number;
  profile_likes?: number;
  avatar_url?: string;
  profile_url?: string;
  handle?: string;
  performance_multiplier?: string;
  created_at?: string;
  video_file_url?: string; // Full video URL from storage for Reels
  audio_url_96k?: string;
  ai_hook?: string; // AI-generated hook from content plan
  ai_description?: string; // AI-generated description from content plan
  ai_content_category?: string; // Content category from content plan
  ai_full_description?: string; // Full description from content plan
  is_photo_carousel?: boolean; // Flag to indicate this is a photo carousel
}

export type ContentItem = Video | PhotoCarousel;

export interface FilterState {
  genre: string[];
  subGenre: string[];
  contentStyle: string[];
  performanceRange: string;
  followerRange: string;
  effort: string;
  gender: string[];
  platform: string[];
  excludeGenre: string[];
  excludeContentStyle: string[];
}