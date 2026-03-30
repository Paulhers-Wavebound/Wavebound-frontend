import { supabase } from '@/integrations/supabase/client';

/**
 * Instagram oEmbed response structure
 */
export interface InstagramOEmbedResponse {
  thumbnail_url: string | null;
  author_name: string | null;
  html: string | null;
  error?: string;
  fallback?: boolean;
}

/**
 * Fetch Instagram oEmbed data via Supabase edge function
 * This avoids CORS issues by proxying through our backend
 */
export const fetchInstagramOEmbed = async (reelUrl: string): Promise<InstagramOEmbedResponse | null> => {
  if (!reelUrl || !reelUrl.includes('instagram.com')) {
    console.warn('Invalid Instagram URL:', reelUrl);
    return null;
  }

  try {
    console.log('🔄 Fetching Instagram oEmbed for:', reelUrl);
    
    const { data, error } = await supabase.functions.invoke('fetch-instagram-oembed', {
      body: { reelUrl }
    });

    if (error) {
      console.error('❌ Error fetching Instagram oEmbed:', error);
      return null;
    }

    console.log('✅ Instagram oEmbed data received:', data);
    return data as InstagramOEmbedResponse;
  } catch (err) {
    console.error('❌ Exception fetching Instagram oEmbed:', err);
    return null;
  }
};

/**
 * Get cached Instagram thumbnail or fetch new one
 * Uses the same oembed_cache table as TikTok
 */
export const getCachedInstagramThumbnail = async (
  videoId: string | number,
  reelUrl: string
): Promise<string | null> => {
  try {
    // Check cache first (7 day cache)
    const { data: cached, error: cacheError } = await supabase
      .from('oembed_cache')
      .select('thumbnail_url, updated_at')
      .eq('video_id', videoId.toString())
      .single();

    if (!cacheError && cached) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (cacheAge < sevenDays && cached.thumbnail_url) {
        console.log('✅ Using cached Instagram thumbnail for video:', videoId);
        return cached.thumbnail_url;
      }
    }

    // Fetch fresh oEmbed data
    console.log('🔄 Fetching fresh Instagram oEmbed data for video:', videoId);
    const oembedData = await fetchInstagramOEmbed(reelUrl);
    
    if (!oembedData || oembedData.fallback) {
      console.warn('⚠️ Instagram oEmbed fetch failed or returned fallback');
      return null;
    }

    const thumbnailUrl = oembedData.thumbnail_url;
    
    if (!thumbnailUrl) {
      console.warn('⚠️ No thumbnail URL in Instagram oEmbed response');
      return null;
    }

    // Update cache
    const { error: upsertError } = await supabase
      .from('oembed_cache')
      .upsert({
        video_id: videoId.toString(),
        thumbnail_url: thumbnailUrl,
        author_name: oembedData.author_name,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('❌ Error updating Instagram cache:', upsertError);
    } else {
      console.log('✅ Instagram thumbnail cached for video:', videoId);
    }

    return thumbnailUrl;
  } catch (err) {
    console.error('❌ Error in getCachedInstagramThumbnail:', err);
    return null;
  }
};

/**
 * Get cached Instagram embed HTML or fetch new one
 */
export const getCachedInstagramEmbedHTML = async (
  videoId: string | number,
  reelUrl: string
): Promise<string | null> => {
  try {
    // Check cache first (7 day cache)
    const { data: cached, error: cacheError } = await supabase
      .from('oembed_cache')
      .select('embed_html, updated_at')
      .eq('video_id', videoId.toString())
      .single();

    if (!cacheError && cached) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (cacheAge < sevenDays && cached.embed_html) {
        console.log('✅ Using cached Instagram embed HTML for video:', videoId);
        return cached.embed_html;
      }
    }

    // Fetch fresh oEmbed data
    console.log('🔄 Fetching fresh Instagram oEmbed data for video:', videoId);
    const oembedData = await fetchInstagramOEmbed(reelUrl);
    
    if (!oembedData || oembedData.fallback) {
      console.warn('⚠️ Instagram oEmbed fetch failed or returned fallback');
      return null;
    }

    const embedHtml = oembedData.html;
    
    if (!embedHtml) {
      console.warn('⚠️ No embed HTML in Instagram oEmbed response');
      return null;
    }

    // Update cache
    const { error: upsertError } = await supabase
      .from('oembed_cache')
      .upsert({
        video_id: videoId.toString(),
        thumbnail_url: oembedData.thumbnail_url,
        author_name: oembedData.author_name,
        embed_html: embedHtml,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('❌ Error updating Instagram cache:', upsertError);
    } else {
      console.log('✅ Instagram embed HTML cached for video:', videoId);
    }

    return embedHtml;
  } catch (err) {
    console.error('❌ Error in getCachedInstagramEmbedHTML:', err);
    return null;
  }
};

/**
 * Check if a URL is an Instagram URL
 */
export const isInstagramUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes('instagram.com');
};
