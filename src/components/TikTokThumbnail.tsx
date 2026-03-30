import React, { useEffect, useState } from 'react';
import { getCachedThumbnail } from '@/utils/tiktokOEmbed';
import { Skeleton } from './ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Play } from 'lucide-react';

interface TikTokThumbnailProps {
  videoId: string | number;
  tiktokUrl: string;
  className?: string;
  fallbackThumbnail?: string | null;
}

// Helper to validate thumbnail URL
const isValidThumbnailUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;

  // Reject incomplete Supabase storage URLs (just the base path without a file)
  const isBaseStoragePath = url.endsWith('/storage/v1/object/public/') || url.endsWith('/storage/v1/object/public');
  if (url.includes('supabase.co/storage/') && (isBaseStoragePath || !url.match(/\.(jpg|jpeg|png|gif|webp|mp4)(\?|$)/i))) {
    return false;
  }

  // Accept URLs with image extensions or complete supabase storage paths
  return url.length > 10 && (
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.png') ||
    url.includes('.gif') ||
    url.includes('.webp') ||
    (url.includes('supabase.co/storage/') && url.length > 80)
  );
};

// Helper to fetch thumbnail from new normalized Assets table (self-hosted fallback)
const fetchThumbnailFromAssets = async (videoId: number): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('0.1. Table 4 - Assets - TikTok')
      .select('thumbnail_url')
      .eq('video_id', videoId)
      .maybeSingle();

    // Some rows mistakenly contain only the storage base path. In that case,
    // construct the known thumbnail object path from the numeric video id.
    const raw = data?.thumbnail_url || null;
    const isBaseStoragePath = raw?.endsWith('/storage/v1/object/public/') || raw?.endsWith('/storage/v1/object/public');
    if (raw && isBaseStoragePath) {
      return `https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/object/public/0.1._thumbnails_tiktok/${videoId}_thumbnail_tiktok_video.jpg`;
    }

    if (raw && isValidThumbnailUrl(raw)) {
      return raw;
    }
  } catch {
    // Silently fail, will try other fallbacks
  }
  return null;
};

// Helper to fetch from old GIF thumbnail table as last resort
const fetchThumbnailFromGifTable = async (videoId: number): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('media_assets_gif_thumbnail')
      .select('thumbnail_url')
      .eq('video_id', videoId)
      .maybeSingle();
    
    if (data?.thumbnail_url && isValidThumbnailUrl(data.thumbnail_url)) {
      return data.thumbnail_url;
    }
  } catch (err) {
    // Silently fail
  }
  return null;
};

const TikTokThumbnail: React.FC<TikTokThumbnailProps> = ({ 
  videoId, 
  tiktokUrl,
  className = '',
  fallbackThumbnail
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const numericId = Number(videoId);

    const loadThumbnail = async () => {
      // PRIORITY 1: Try oEmbed API first (external source - required for licensing)
      if (tiktokUrl && tiktokUrl.includes('tiktok.com')) {
        try {
          const oembedThumbnail = await getCachedThumbnail(videoId, tiktokUrl);
          if (isMounted && oembedThumbnail) {
            setThumbnailUrl(oembedThumbnail);
            setError(false);
            setIsLoading(false);
            return;
          }
        } catch {
          // Silently fall through to next priority
        }
      }

      // PRIORITY 2: Use passed fallbackThumbnail if oEmbed failed
      if (fallbackThumbnail && isValidThumbnailUrl(fallbackThumbnail)) {
        if (isMounted) {
          setThumbnailUrl(fallbackThumbnail);
          setError(false);
          setIsLoading(false);
          return;
        }
      }

      // PRIORITY 3: Try Assets table (self-hosted fallback)
      const assetsThumbnail = await fetchThumbnailFromAssets(numericId);
      if (isMounted && assetsThumbnail) {
        setThumbnailUrl(assetsThumbnail);
        setError(false);
        setIsLoading(false);
        return;
      }

      // PRIORITY 4: Try old GIF thumbnail table as last resort
      const gifThumbnail = await fetchThumbnailFromGifTable(numericId);
      if (isMounted && gifThumbnail) {
        setThumbnailUrl(gifThumbnail);
        setError(false);
        setIsLoading(false);
        return;
      }

      // No thumbnail found - show placeholder
      if (isMounted) {
        setError(true);
        setIsLoading(false);
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
    };
  }, [videoId, tiktokUrl, fallbackThumbnail]);

  // Handle image load error - try self-hosted fallbacks
  const handleImageError = async () => {
    if (triedFallback) {
      setError(true);
      return;
    }
    setTriedFallback(true);
    setIsLoading(true);
    
    const numericId = Number(videoId);
    
    // Try Assets table (self-hosted fallback)
    const assetsThumbnail = await fetchThumbnailFromAssets(numericId);
    if (assetsThumbnail) {
      setThumbnailUrl(assetsThumbnail);
      setIsLoading(false);
      return;
    }
    
    // Try GIF table
    const gifThumbnail = await fetchThumbnailFromGifTable(numericId);
    if (gifThumbnail) {
      setThumbnailUrl(gifThumbnail);
      setIsLoading(false);
      return;
    }
    
    setError(true);
    setIsLoading(false);
  };

  if (isLoading) {
    return <Skeleton className={`${className} bg-muted/50`} />;
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={`${className} bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center`}>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Play className="w-5 h-5 text-white/70 ml-0.5" fill="currentColor" />
        </div>
      </div>
    );
  }

  return (
    <img 
      src={thumbnailUrl}
      alt="Video preview"
      className={`${className} object-cover`}
      onError={handleImageError}
    />
  );
};

export default TikTokThumbnail;
