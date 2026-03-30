import { useState, useEffect } from 'react';
import { Lightbulb, Eye, Heart, X, ExternalLink, Loader2, Play, Star, Flame, TrendingUp } from 'lucide-react';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface IdeaCardProps {
  idea: EnrichedIdea;
  index?: number;
  onRemove?: (id: string) => void;
  onFavorite?: (idea: EnrichedIdea) => void;
  isFavorited?: boolean;
}

export function IdeaCard({ idea, index, onRemove, onFavorite, isFavorited = false }: IdeaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [assetThumbnail, setAssetThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  
  const embedUrl = idea.videoData?.video_embedded_url || idea.videoData?.embedded_url || idea.videoData?.post_url;
  
  // Extract video ID from various URL formats
  const extractVideoId = (url?: string): string | null => {
    if (!url) return null;
    // Match /video/ID, /photo/ID, or just a raw numeric ID at the end
    const patterns = [
      /video\/(\d+)/,
      /photo\/(\d+)/,
      /\/(\d{10,})/,  // Long numeric ID anywhere
      /embed\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };
  
  const videoId = extractVideoId(embedUrl);
  const views = idea.videoData?.video_views || idea.videoData?.photo_views;
  const likes = idea.videoData?.video_likes || idea.videoData?.photo_likes;
  const dbThumbnailUrl = idea.videoData?.thumbnail_url;
  const viralScore = idea.videoData?.viral_score;
  const performanceMultiplier = idea.videoData?.performance_multiplier;

  // Fallback: fetch thumbnail from 0.1 asset tables if it's missing on the idea
  useEffect(() => {
    if (dbThumbnailUrl || assetThumbnail || thumbnailLoading) return;
    if (!embedUrl) return;

    const fetchThumbnailFromAssets = async () => {
      try {
        setThumbnailLoading(true);
        let thumb: string | null = null;

        if (idea.contentType === 'tiktok' || (!idea.contentType && embedUrl.includes('tiktok.com'))) {
          // 1) Find internal video ID by embedded URL
          const { data: videoRow } = await supabase
            .from('0.1. Table 2 - Video - TikTok')
            .select('id')
            .eq('video_embedded_url', embedUrl)
            .maybeSingle();

          if (videoRow?.id) {
            // 2) Fetch thumbnail from 0.1. Table 4 - Assets - TikTok
            const { data: tiktokAsset } = await supabase
              .from('0.1. Table 4 - Assets - TikTok')
              .select('thumbnail_url')
              .eq('video_id', videoRow.id)
              .maybeSingle();

            if (tiktokAsset?.thumbnail_url) {
              thumb = tiktokAsset.thumbnail_url;
            }
          }
        } else if (idea.contentType === 'reel') {
          const { data: reelRow } = await supabase
            .from('0.1. Table 2.2 - Video - Reels')
            .select('id')
            .eq('video_embedded_url', embedUrl)
            .maybeSingle();

          if (reelRow?.id) {
            const { data: reelAsset } = await supabase
              .from('0.1. Table 4.2 - Assets - Reels')
              .select('thumbnail_url')
              .eq('video_id', reelRow.id)
              .maybeSingle();

            if (reelAsset?.thumbnail_url) {
              thumb = reelAsset.thumbnail_url;
            }
          }
        } else if (idea.contentType === 'photo_carousel') {
          const { data: pcRow } = await supabase
            .from('0.1. Table 2.1 - PC - TikTok')
            .select('id')
            .eq('post_url', embedUrl)
            .maybeSingle();

          if (pcRow?.id) {
            const { data: pcAsset } = await supabase
              .from('0.1. Table 4.1 - Assets - PC - TikTok')
              .select('thumbnail_url')
              .eq('video_id', pcRow.id)
              .maybeSingle();

            if (pcAsset?.thumbnail_url) {
              thumb = pcAsset.thumbnail_url;
            }
          }
        }

        if (thumb) {
          setAssetThumbnail(thumb);
        }
      } finally {
        setThumbnailLoading(false);
      }
    };

    fetchThumbnailFromAssets();
  }, [dbThumbnailUrl, assetThumbnail, thumbnailLoading, embedUrl, idea.contentType]);

  const thumbnailUrl = dbThumbnailUrl || assetThumbnail;

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getViralScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground bg-muted';
    if (score >= 80) return 'text-orange-500 bg-orange-500/10';
    if (score >= 60) return 'text-amber-500 bg-amber-500/10';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-muted-foreground bg-muted';
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(idea);
  };

  // Extract numeric ID for favorites
  const getNumericId = (): number | null => {
    const rawId = idea.video_embed_id || idea.id;
    const numericId = parseInt(String(rawId).replace(/^(video_|reel_|pc_)/, ''));
    return isNaN(numericId) ? null : numericId;
  };

  if (idea.isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse aspect-[3/4]">
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Compact Card */}
      <div 
        className={cn(
          "bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer",
          "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]"
        )}
        onClick={() => setIsExpanded(true)}
      >
        {/* Thumbnail / Video Preview */}
        <div className="relative aspect-[9/16] bg-muted overflow-hidden">
        {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={idea.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Hide broken image
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : thumbnailLoading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : videoId ? (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 flex items-center justify-center">
              <Play className="w-8 h-8 text-primary" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
          )}
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            {onFavorite && getNumericId() && (
              <button
                onClick={handleFavorite}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isFavorited 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-black/50 hover:bg-black/70 text-white"
                )}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(idea.id);
                }}
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>

          {/* Number Badge */}
          {index !== undefined && (
            <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center text-xs font-bold text-white bg-primary rounded-full shadow-lg">
              {index}
            </span>
          )}

          {/* DB ID Badge (for debugging) */}
          {getNumericId() && (
            <span className="absolute top-10 left-2 px-1.5 py-0.5 text-[9px] font-mono text-white/70 bg-black/40 rounded">
              #{getNumericId()}
            </span>
          )}

          {/* Stats Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex items-center justify-between text-[10px] text-white/90">
              <div className="flex items-center gap-2">
                {views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(views)}
                  </span>
                )}
                {likes && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {formatNumber(likes)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {viralScore && (
                  <span className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium",
                    getViralScoreColor(viralScore)
                  )}>
                    <Flame className="w-3 h-3" />
                    {viralScore}
                  </span>
                )}
                {performanceMultiplier && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    {performanceMultiplier}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="p-2.5">
          <h3 className="font-medium text-xs text-foreground line-clamp-2 leading-tight">
            {idea.title}
          </h3>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in"
          onClick={() => setIsExpanded(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Player */}
            {idea.contentType === 'reel' ? (
              idea.videoData?.video_file_url ? (
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  <video
                    src={idea.videoData.video_file_url}
                    className="absolute inset-0 w-full h-full object-contain"
                    controls
                    playsInline
                  />
                </div>
              ) : embedUrl?.includes('instagram.com') ? (
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  <iframe
                    src={`https://www.instagram.com/p/${embedUrl.match(/\/(?:reel|p|tv)\/([^/?]+)/)?.[1]}/embed`}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    scrolling="no"
                    allowFullScreen
                    title="Instagram Reel"
                  />
                </div>
              ) : null
            ) : videoId && (
              <div className="relative aspect-[9/16] overflow-hidden">
                <iframe
                  src={`https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="fullscreen"
                  allowFullScreen
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{idea.title}</h3>
                    {idea.contentType && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                        {idea.contentType === 'photo_carousel' ? 'Photo Carousel' : idea.contentType === 'reel' ? 'Reel' : 'TikTok'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onFavorite && getNumericId() && (
                    <button
                      onClick={handleFavorite}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isFavorited 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Star className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Why It Works */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Why it works: </span>
                  {idea.why_it_works}
                </p>
              </div>

              {/* Stats & Link */}
              {idea.videoData && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {views && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {formatNumber(views)}
                        </span>
                      )}
                      {likes && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {formatNumber(likes)}
                        </span>
                      )}
                    </div>
                    {embedUrl && (
                      <a
                        href={embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        View Original
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  
                  {/* Viral Score & Performance Badges */}
                  {(viralScore || performanceMultiplier) && (
                    <div className="flex items-center gap-2">
                      {viralScore && (
                        <span className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                          getViralScoreColor(viralScore)
                        )}>
                          <Flame className="w-3.5 h-3.5" />
                          Viral Score: {viralScore}
                        </span>
                      )}
                      {performanceMultiplier && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {performanceMultiplier}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
