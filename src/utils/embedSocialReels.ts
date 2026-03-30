import { supabase } from '../integrations/supabase/client';

export interface EmbedSocialResponse {
  thumbnail_url: string | null;
  author_name?: string;
}

/**
 * Extract Instagram Reel shortcode from URL
 */
export function extractReelShortcode(reelUrl: string): string | null {
  const match = reelUrl.match(/\/(?:reel|p)\/([^/?]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Instagram Reel thumbnail using wsrv.nl proxy workaround
 * Converts /reel/ to /p/ format, adds /media/?size=l, and proxies through wsrv.nl
 */
export async function getInstagramReelThumbnail(
  videoId: string | number, 
  reelUrl: string
): Promise<string | null> {
  try {
    console.log('🔍 Fetching Instagram Reel thumbnail for:', videoId, reelUrl);

    // Validate URL exists
    if (!reelUrl || reelUrl.trim() === '') {
      console.error('❌ Empty or invalid reel URL for video:', videoId);
      return null;
    }

    const shortcode = extractReelShortcode(reelUrl);
    if (!shortcode) {
      console.error('❌ Could not extract shortcode from URL:', reelUrl);
      return null;
    }

    console.log('✅ Extracted shortcode:', shortcode);

    // Check cache first
    const { data: cached } = await supabase
      .from('oembed_cache')
      .select('thumbnail_url, updated_at')
      .eq('video_id', `ig_${shortcode}`)
      .single();

    if (cached?.thumbnail_url) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
        console.log('✅ Using cached thumbnail');
        return cached.thumbnail_url;
      }
    }

    // Try multiple thumbnail URL strategies
    // Strategy 1: wsrv.nl proxy with HTTPS protocol
    const thumbnailUrl = `https://wsrv.nl/?url=https://instagram.com/p/${shortcode}/media/?size=l`;

    // Cache the thumbnail URL
    await supabase
      .from('oembed_cache')
      .upsert({
        video_id: `ig_${shortcode}`,
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString()
      });

    console.log('✅ Generated Instagram thumbnail:', thumbnailUrl);
    return thumbnailUrl;

  } catch (error) {
    console.error('❌ Error fetching Instagram Reel thumbnail:', error);
    return null;
  }
}
