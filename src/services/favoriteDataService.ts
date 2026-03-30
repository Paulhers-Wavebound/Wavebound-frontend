import { supabase } from '@/integrations/supabase/client';

// Fields to exclude from webhook payloads
const EXCLUDED_FIELDS = [
  'created_at', 'updated_at', 'file_url', 'bucket_link', 'storage_path',
  'thumbnail_url', 'gif_url', 'photo_url_1', 'photo_url_2', 'photo_url_3',
  'photo_url_4', 'photo_url_5', 'video_file_url', 'audio_file_url',
];

function stripFields(obj: Record<string, any> | null): Record<string, any> {
  if (!obj) return {};
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (EXCLUDED_FIELDS.includes(key)) continue;
    if (typeof value === 'string' && (value.startsWith('https://') && (value.includes('supabase') || value.includes('storage')))) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

export async function fetchEnrichedVideoData(
  videoId: number,
  platform: 'tiktok' | 'instagram_reel'
): Promise<{
  profile: Record<string, any>;
  video: Record<string, any>;
  sound: Record<string, any>;
  ai_analysis: Record<string, any>;
}> {
  if (platform === 'tiktok') {
    const [profileRes, videoRes, soundRes, aiRes] = await Promise.all([
      supabase.from('0.1. Table 1 - Profile - TikTok')
        .select('handle, profile_followers, profile_bio, gender, avg_views, median_views, avg_engagement')
        .eq('video_id', videoId).maybeSingle(),
      supabase.from('0.1. Table 2 - Video - TikTok')
        .select('caption, video_views, video_likes, video_shares, video_saves, video_comments, duration, hashtags, viral_score, performance_multiplier')
        .eq('id', videoId).maybeSingle(),
      supabase.from('0.1. Table 3 - Sound - TikTok')
        .select('genre, sub_genre, instruments, voices, mood, technical_feedback, lyric_analysis')
        .eq('video_id', videoId).maybeSingle(),
      supabase.from('0.1. Table 5 - Ai - TikTok')
        .select('content_style, sub_style, hook, context, description, effort, label_reasons, evidence_pointers')
        .eq('video_id', videoId).maybeSingle(),
    ]);

    return {
      profile: stripFields(profileRes.data),
      video: stripFields(videoRes.data),
      sound: stripFields(soundRes.data),
      ai_analysis: stripFields(aiRes.data),
    };
  } else {
    const [profileRes, videoRes, soundRes, aiRes] = await Promise.all([
      supabase.from('0.1. Table 1.2 - Profile - Instagram')
        .select('handle, profile_followers, profile_bio, gender, avg_views, median_views, avg_engagement')
        .eq('video_id', videoId).maybeSingle(),
      supabase.from('0.1. Table 2.2 - Video - Reels')
        .select('caption, video_views, video_likes, video_shares, video_saves, video_comments, duration, hashtags, viral_score, performance_multiplier')
        .eq('id', videoId).maybeSingle(),
      supabase.from('0.1. Table 3.2 - Sound - Reels')
        .select('genre, sub_genre, instruments, voices, mood, technical_feedback, lyric_analysis')
        .eq('video_id', videoId).maybeSingle(),
      supabase.from('0.1. Table 5.2 - Ai - Reels')
        .select('content_style, sub_style, hook, context, description, effort, label_reasons, evidence_pointers')
        .eq('video_id', videoId).maybeSingle(),
    ]);

    return {
      profile: stripFields(profileRes.data),
      video: stripFields(videoRes.data),
      sound: stripFields(soundRes.data),
      ai_analysis: stripFields(aiRes.data),
    };
  }
}
