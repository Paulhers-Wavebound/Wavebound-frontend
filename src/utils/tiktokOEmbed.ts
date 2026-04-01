import { supabase } from "@/integrations/supabase/client";

export interface TikTokOEmbedResponse {
  version: string;
  type: string;
  title: string;
  author_url: string;
  author_name: string;
  width: string;
  height: string;
  html: string;
  thumbnail_width: number;
  thumbnail_height: number;
  thumbnail_url: string;
  provider_name: string;
  provider_url: string;
}

/**
 * Fetch oEmbed data from TikTok API via Supabase edge function (to avoid CORS)
 */
export const fetchTikTokOEmbed = async (
  tiktokUrl: string,
): Promise<TikTokOEmbedResponse | null> => {
  // Validate that this is actually a TikTok URL
  if (!isTikTokUrl(tiktokUrl)) {
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      "fetch-tiktok-oembed",
      {
        body: { tiktokUrl },
      },
    );

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

/**
 * Check if a TikTok signed URL has expired based on x-expires parameter
 */
const isSignedUrlExpired = (url: string): boolean => {
  try {
    const expiresMatch = url.match(/x-expires=(\d+)/);
    if (expiresMatch) {
      const expiresTimestamp = parseInt(expiresMatch[1], 10) * 1000; // Convert to ms
      // Consider expired if less than 1 hour remaining
      return Date.now() > expiresTimestamp - 60 * 60 * 1000;
    }
  } catch {
    // If we can't parse, assume it's not expired
  }
  return false;
};

/**
 * Get thumbnail URL with caching in Supabase
 */
export const getCachedThumbnail = async (
  videoId: string | number,
  tiktokUrl: string,
): Promise<string | null> => {
  if (!tiktokUrl) {
    return null;
  }

  try {
    // Check cache first
    const { data: cached } = await supabase
      .from("oembed_cache")
      .select("thumbnail_url, updated_at")
      .eq("video_id", videoId.toString())
      .maybeSingle();

    // Return cached if exists, fresh (less than 7 days old), AND not expired (for signed URLs)
    if (cached?.thumbnail_url) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const isExpired = isSignedUrlExpired(cached.thumbnail_url);

      if (cacheAge < sevenDays && !isExpired) {
        return cached.thumbnail_url;
      }
    }

    // Fetch fresh data from TikTok
    const oembed = await fetchTikTokOEmbed(tiktokUrl);

    if (!oembed?.thumbnail_url) {
      return null;
    }

    // Update cache
    await supabase.from("oembed_cache").upsert({
      video_id: videoId.toString(),
      thumbnail_url: oembed.thumbnail_url,
      embed_html: oembed.html,
      author_name: oembed.author_name,
      updated_at: new Date().toISOString(),
    });

    return oembed.thumbnail_url;
  } catch {
    return null;
  }
};

/**
 * Get full embed HTML with caching
 */
export const getCachedEmbedHTML = async (
  videoId: string | number,
  tiktokUrl: string,
): Promise<string | null> => {
  try {
    // Check cache first
    const { data: cached } = await supabase
      .from("oembed_cache")
      .select("embed_html, updated_at")
      .eq("video_id", videoId.toString())
      .maybeSingle();

    // Return cached if exists and fresh
    if (cached?.embed_html) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge < sevenDays) {
        return cached.embed_html;
      }
    }

    // Fetch fresh data
    const oembed = await fetchTikTokOEmbed(tiktokUrl);

    if (!oembed?.html) {
      return null;
    }

    // Update cache
    await supabase.from("oembed_cache").upsert({
      video_id: videoId.toString(),
      thumbnail_url: oembed.thumbnail_url,
      embed_html: oembed.html,
      author_name: oembed.author_name,
      updated_at: new Date().toISOString(),
    });

    return oembed.html;
  } catch {
    return null;
  }
};

/**
 * Check if URL is a valid TikTok URL
 */
export const isTikTokUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes("tiktok.com");
};
