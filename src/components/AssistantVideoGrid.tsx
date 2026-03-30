import { useState, useMemo } from 'react';
import { Sparkles, Trash2, ArrowUpDown, Video, Image, Film, X, Star } from 'lucide-react';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import TikTokThumbnail from './TikTokThumbnail';
import { Eye, Heart } from 'lucide-react';

type SortOption = 'newest' | 'views' | 'viral' | 'likes' | 'multiplier';
type ContentTypeFilter = 'all' | 'video' | 'reel' | 'photo_carousel';
type PerformanceFilter = 'all' | '100k+' | '500k+' | '1m+';
type MultiplierFilter = 'all' | '2x+' | '5x+' | '10x+';

interface AssistantVideoGridProps {
  ideas: EnrichedIdea[];
  isProcessing?: boolean;
  onClear?: () => void;
  onRemoveIdea?: (id: string) => void;
  className?: string;
}

const formatNumber = (num: number | undefined) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function AssistantVideoGrid({ 
  ideas, 
  isProcessing, 
  onClear, 
  onRemoveIdea,
  className 
}: AssistantVideoGridProps) {
  const { toggleFavorite, favoriteVideoIds, favoritePhotoIds, favoriteReelIds } = useFavorites();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');
  const [multiplierFilter, setMultiplierFilter] = useState<MultiplierFilter>('all');
  
  // Filter out ideas without valid video data
  const validIdeas = ideas.filter(idea => idea.videoData);
  
  // Apply filters and sorting
  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = [...validIdeas];
    
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(idea => {
        if (contentTypeFilter === 'video') return idea.contentType === 'tiktok' || !idea.contentType;
        return idea.contentType === contentTypeFilter;
      });
    }
    
    if (performanceFilter !== 'all') {
      const minViews = performanceFilter === '100k+' ? 100000 : performanceFilter === '500k+' ? 500000 : 1000000;
      filtered = filtered.filter(idea => {
        const views = idea.videoData?.video_views || idea.videoData?.photo_views || 0;
        return views >= minViews;
      });
    }
    
    if (multiplierFilter !== 'all') {
      const minMultiplier = multiplierFilter === '2x+' ? 2 : multiplierFilter === '5x+' ? 5 : 10;
      filtered = filtered.filter(idea => {
        const multiplierStr = (idea.videoData as any)?.performance_multiplier || '';
        const multiplierMatch = String(multiplierStr).match(/(\d+(?:\.\d+)?)/);
        const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 0;
        return multiplier >= minMultiplier;
      });
    }
    
    switch (sortBy) {
      case 'views':
        return filtered.sort((a, b) => {
          const viewsA = a.videoData?.video_views || a.videoData?.photo_views || 0;
          const viewsB = b.videoData?.video_views || b.videoData?.photo_views || 0;
          return viewsB - viewsA;
        });
      case 'viral':
        return filtered.sort((a, b) => {
          const scoreA = (a.videoData as any)?.outliar_score || (a.videoData as any)?.viral_score || 0;
          const scoreB = (b.videoData as any)?.outliar_score || (b.videoData as any)?.viral_score || 0;
          return scoreB - scoreA;
        });
      case 'likes':
        return filtered.sort((a, b) => {
          const likesA = a.videoData?.video_likes || a.videoData?.photo_likes || 0;
          const likesB = b.videoData?.video_likes || b.videoData?.photo_likes || 0;
          return likesB - likesA;
        });
      case 'multiplier':
        return filtered.sort((a, b) => {
          const getMultiplier = (idea: any) => {
            const str = idea.videoData?.performance_multiplier || '';
            const match = String(str).match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
          };
          return getMultiplier(b) - getMultiplier(a);
        });
      case 'newest':
      default:
        return filtered;
    }
  }, [validIdeas, sortBy, contentTypeFilter, performanceFilter, multiplierFilter]);
  
  const hasIdeas = validIdeas.length > 0;

  const handleFavorite = async (idea: EnrichedIdea) => {
    const rawId = idea.video_embed_id || idea.id;
    const numericId = parseInt(String(rawId).replace(/^(video_|reel_|pc_)/, ''));
    
    if (isNaN(numericId)) {
      toast.error('Cannot favorite this item');
      return;
    }

    let videoType: 'tiktok' | 'photo_carousel' | 'instagram_reel' = 'tiktok';
    if (idea.contentType === 'photo_carousel') {
      videoType = 'photo_carousel';
    } else if (idea.contentType === 'reel') {
      videoType = 'instagram_reel';
    }

    await toggleFavorite(numericId, videoType);
  };

  const checkIsFavorited = (idea: EnrichedIdea): boolean => {
    const rawId = idea.video_embed_id || idea.id;
    const numericId = parseInt(String(rawId).replace(/^(video_|reel_|pc_)/, ''));
    
    if (isNaN(numericId)) return false;

    if (idea.contentType === 'photo_carousel') {
      return favoritePhotoIds.includes(numericId);
    } else if (idea.contentType === 'reel') {
      return favoriteReelIds.includes(numericId);
    }
    return favoriteVideoIds.includes(numericId);
  };

  const getMultiplier = (idea: EnrichedIdea) => {
    const str = (idea.videoData as any)?.performance_multiplier || (idea as any).performance_score || '';
    const match = String(str).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Idea Deck</h2>
          {hasIdeas && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filteredAndSortedIdeas.length}/{validIdeas.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasIdeas && (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="viral">Viral Score</SelectItem>
                <SelectItem value="likes">Most Likes</SelectItem>
                <SelectItem value="multiplier">Multiplier</SelectItem>
              </SelectContent>
            </Select>
          )}
          {hasIdeas && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive h-8"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {hasIdeas && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 overflow-x-auto">
          {/* Content Type Filters */}
          <Badge 
            variant={contentTypeFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setContentTypeFilter('all')}
          >
            All
          </Badge>
          <Badge 
            variant={contentTypeFilter === 'video' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1 gap-1"
            onClick={() => setContentTypeFilter('video')}
          >
            <Video className="w-3 h-3" /> TikTok
          </Badge>
          <Badge 
            variant={contentTypeFilter === 'reel' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1 gap-1"
            onClick={() => setContentTypeFilter('reel')}
          >
            <Film className="w-3 h-3" /> Reels
          </Badge>
          <Badge 
            variant={contentTypeFilter === 'photo_carousel' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1 gap-1"
            onClick={() => setContentTypeFilter('photo_carousel')}
          >
            <Image className="w-3 h-3" /> Carousel
          </Badge>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Performance Filters */}
          <span className="text-xs text-muted-foreground">Views:</span>
          <Badge 
            variant={performanceFilter === '100k+' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setPerformanceFilter(performanceFilter === '100k+' ? 'all' : '100k+')}
          >
            100K+
          </Badge>
          <Badge 
            variant={performanceFilter === '500k+' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setPerformanceFilter(performanceFilter === '500k+' ? 'all' : '500k+')}
          >
            500K+
          </Badge>
          <Badge 
            variant={performanceFilter === '1m+' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setPerformanceFilter(performanceFilter === '1m+' ? 'all' : '1m+')}
          >
            1M+
          </Badge>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Multiplier Filters */}
          <span className="text-xs text-muted-foreground">Multiplier:</span>
          <Badge 
            variant={multiplierFilter === '2x+' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setMultiplierFilter(multiplierFilter === '2x+' ? 'all' : '2x+')}
          >
            2x+
          </Badge>
          <Badge 
            variant={multiplierFilter === '5x+' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setMultiplierFilter(multiplierFilter === '5x+' ? 'all' : '5x+')}
          >
            5x+
          </Badge>
          <Badge 
            variant={multiplierFilter === '10x+' ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-2.5 py-1"
            onClick={() => setMultiplierFilter(multiplierFilter === '10x+' ? 'all' : '10x+')}
          >
            10x+
          </Badge>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasIdeas ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Chat to generate ideas</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask about content ideas, trends, or what's working. Videos will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredAndSortedIdeas.map((idea, index) => {
              const videoData = idea.videoData;
              const views = videoData?.video_views || videoData?.photo_views || 0;
              const likes = videoData?.video_likes || videoData?.photo_likes || 0;
              const multiplier = getMultiplier(idea);
              const isFavorited = checkIsFavorited(idea);
              const thumbnailUrl = (videoData as any)?.thumbnail_url || (videoData as any)?.gif_url;
              const embedId = idea.video_embed_id || idea.id;
              
               const clickUrl =
                 (videoData as any)?.video_embedded_url ||
                 (videoData as any)?.embedded_url ||
                 (videoData as any)?.embedded_ulr ||
                 (videoData as any)?.post_url ||
                 (videoData as any)?.video_url ||
                 (videoData as any)?.video_file_url ||
                 '';
               const isClickable = Boolean(clickUrl);

              return (
                <div 
                  key={idea.id}
                  onClick={() => {
                    if (!isClickable) return;
                    window.open(clickUrl, '_blank');
                  }}
                  className={cn(
                    "relative group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-200",
                    isClickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {/* Index badge */}
                  <div className="absolute top-2 left-2 z-20 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                  
                  {/* Favorite button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(idea);
                    }}
                    className={cn(
                      "absolute top-2 right-8 z-20 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isFavorited 
                        ? "bg-yellow-500 text-white" 
                        : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <Star className={cn("w-3.5 h-3.5", isFavorited && "fill-current")} />
                  </button>
                  
                  {/* Remove button */}
                  {onRemoveIdea && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveIdea(idea.id);
                      }}
                      className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {/* Video ID tag */}
                  <div className="absolute top-10 left-2 z-20 text-[10px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
                    #{embedId}
                  </div>
                  
                  {/* Thumbnail */}
                  <div className="aspect-[9/16] bg-muted overflow-hidden">
                     {idea.contentType === 'tiktok' || !idea.contentType ? (
                       <TikTokThumbnail
                         videoId={parseInt(String(embedId).replace(/\D/g, '')) || 0}
                         tiktokUrl={(videoData as any)?.video_embedded_url || (videoData as any)?.embedded_url || (videoData as any)?.embedded_ulr || ''}
                         fallbackThumbnail={thumbnailUrl}
                         className="w-full h-full object-cover"
                       />
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt={idea.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  {/* Stats overlay at bottom of thumbnail */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 pt-8">
                    <div className="flex items-center gap-3 text-white text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{formatNumber(likes)}</span>
                      </div>
                      {multiplier > 1 && (
                        <div className="flex items-center gap-1 text-emerald-400 font-medium">
                          <span>🔥 {multiplier.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isProcessing && (
              <div className="col-span-full flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Finding videos...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title bar at bottom */}
      {hasIdeas && filteredAndSortedIdeas.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{filteredAndSortedIdeas[0]?.title}</span>
            {filteredAndSortedIdeas.length > 1 && ` and ${filteredAndSortedIdeas.length - 1} more`}
          </p>
        </div>
      )}
    </div>
  );
}
