import { supabase } from "@/integrations/supabase/client";

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
export const fetchInstagramOEmbed = async (
  reelUrl: string,
): Promise<InstagramOEmbedResponse | null> => {
  if (!reelUrl || !reelUrl.includes("instagram.com")) {
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      "fetch-instagram-oembed",
      {
        body: { reelUrl },
      },
    );

    if (error) {
      return null;
    }

    return data as InstagramOEmbedResponse;
  } catch {
    return null;
  }
};

/**
 * Get cached Instagram thumbnail or fetch new one
 * Uses the same oembed_cache table as TikTok
 */
export const getCachedInstagramThumbnail = async (
  videoId: string | number,
  reelUrl: string,
): Promise<string | null> => {
  try {
    // Check cache first (7 day cache)
    const { data: cached, error: cacheError } = await supabase
      .from("oembed_cache")
      .select("thumbnail_url, updated_at")
      .eq("video_id", videoId.toString())
      .single();

    if (!cacheError && cached) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge < sevenDays && cached.thumbnail_url) {
        return cached.thumbnail_url;
      }
    }

    // Fetch fresh oEmbed data
    const oembedData = await fetchInstagramOEmbed(reelUrl);

    if (!oembedData || oembedData.fallback) {
      return null;
    }

    const thumbnailUrl = oembedData.thumbnail_url;

    if (!thumbnailUrl) {
      return null;
    }

    // Update cache
    const { error: upsertError } = await supabase.from("oembed_cache").upsert({
      video_id: videoId.toString(),
      thumbnail_url: thumbnailUrl,
      author_name: oembedData.author_name,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      // Cache update failed silently
    }

    return thumbnailUrl;
  } catch {
    return null;
  }
};

/**
 * Get cached Instagram embed HTML or fetch new one
 */
export const getCachedInstagramEmbedHTML = async (
  videoId: string | number,
  reelUrl: string,
): Promise<string | null> => {
  try {
    // Check cache first (7 day cache)
    const { data: cached, error: cacheError } = await supabase
      .from("oembed_cache")
      .select("embed_html, updated_at")
      .eq("video_id", videoId.toString())
      .single();

    if (!cacheError && cached) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cacheAge < sevenDays && cached.embed_html) {
        return cached.embed_html;
      }
    }

    // Fetch fresh oEmbed data
    const oembedData = await fetchInstagramOEmbed(reelUrl);

    if (!oembedData || oembedData.fallback) {
      return null;
    }

    const embedHtml = oembedData.html;

    if (!embedHtml) {
      return null;
    }

    // Update cache
    const { error: upsertError } = await supabase.from("oembed_cache").upsert({
      video_id: videoId.toString(),
      thumbnail_url: oembedData.thumbnail_url,
      author_name: oembedData.author_name,
      embed_html: embedHtml,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      // Cache update failed silently
    }

    return embedHtml;
  } catch {
    return null;
  }
};

/**
 * Check if a URL is an Instagram URL
 */
export const isInstagramUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes("instagram.com");
};
