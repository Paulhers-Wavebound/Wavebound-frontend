import { useState, useMemo } from 'react';
import { Sparkles, Trash2, ArrowUpDown, Filter, Video, Image, Film } from 'lucide-react';
import { EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { IdeaCard } from './IdeaCard';
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

type SortOption = 'newest' | 'views' | 'viral' | 'likes' | 'multiplier';
type ContentTypeFilter = 'all' | 'video' | 'reel' | 'photo_carousel';
type PerformanceFilter = 'all' | '100k+' | '500k+' | '1m+';
type MultiplierFilter = 'all' | '2x+' | '5x+' | '10x+';

interface IdeaDeckProps {
  ideas: EnrichedIdea[];
  isProcessing?: boolean;
  onClear?: () => void;
  onRemoveIdea?: (id: string) => void;
  className?: string;
}

export function IdeaDeck({ 
  ideas, 
  isProcessing, 
  onClear, 
  onRemoveIdea,
  className 
}: IdeaDeckProps) {
  const { isFavorited, toggleFavorite, favoriteVideoIds, favoritePhotoIds, favoriteReelIds } = useFavorites();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');
  const [multiplierFilter, setMultiplierFilter] = useState<MultiplierFilter>('all');
  
  // Filter out ideas without valid video data (invalid IDs from AI)
  const validIdeas = ideas.filter(idea => idea.videoData);
  
  // Apply filters and sorting
  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = [...validIdeas];
    
    // Apply content type filter
    if (contentTypeFilter !== 'all') {
      filtered = filtered.filter(idea => {
        if (contentTypeFilter === 'video') return idea.contentType === 'tiktok' || !idea.contentType;
        return idea.contentType === contentTypeFilter;
      });
    }
    
    // Apply performance filter
    if (performanceFilter !== 'all') {
      const minViews = performanceFilter === '100k+' ? 100000 : performanceFilter === '500k+' ? 500000 : 1000000;
      filtered = filtered.filter(idea => {
        const views = idea.videoData?.video_views || idea.videoData?.photo_views || 0;
        return views >= minViews;
      });
    }
    
    // Apply multiplier filter
    if (multiplierFilter !== 'all') {
      const minMultiplier = multiplierFilter === '2x+' ? 2 : multiplierFilter === '5x+' ? 5 : 10;
      filtered = filtered.filter(idea => {
        const multiplierStr = (idea.videoData as any)?.performance_multiplier || '';
        const multiplierMatch = String(multiplierStr).match(/(\d+(?:\.\d+)?)/);
        const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 0;
        return multiplier >= minMultiplier;
      });
    }
    
    // Sort
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
  const hasActiveFilters = contentTypeFilter !== 'all' || performanceFilter !== 'all' || multiplierFilter !== 'all';

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

  const clearFilters = () => {
    setContentTypeFilter('all');
    setPerformanceFilter('all');
    setMultiplierFilter('all');
  };

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
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
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1.5" />
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
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {hasIdeas && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          
          {/* Content Type Filters */}
          <div className="flex items-center gap-1.5">
            <Badge 
              variant={contentTypeFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setContentTypeFilter('all')}
            >
              All
            </Badge>
            <Badge 
              variant={contentTypeFilter === 'video' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5 gap-1"
              onClick={() => setContentTypeFilter('video')}
            >
              <Video className="w-3 h-3" /> TikTok
            </Badge>
            <Badge 
              variant={contentTypeFilter === 'reel' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5 gap-1"
              onClick={() => setContentTypeFilter('reel')}
            >
              <Film className="w-3 h-3" /> Reels
            </Badge>
            <Badge 
              variant={contentTypeFilter === 'photo_carousel' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5 gap-1"
              onClick={() => setContentTypeFilter('photo_carousel')}
            >
              <Image className="w-3 h-3" /> Carousel
            </Badge>
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Performance Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Views:</span>
            <Badge 
              variant={performanceFilter === '100k+' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setPerformanceFilter(performanceFilter === '100k+' ? 'all' : '100k+')}
            >
              100K+
            </Badge>
            <Badge 
              variant={performanceFilter === '500k+' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setPerformanceFilter(performanceFilter === '500k+' ? 'all' : '500k+')}
            >
              500K+
            </Badge>
            <Badge 
              variant={performanceFilter === '1m+' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setPerformanceFilter(performanceFilter === '1m+' ? 'all' : '1m+')}
            >
              1M+
            </Badge>
          </div>

          <div className="w-px h-4 bg-border" />

          {/* Multiplier Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Multiplier:</span>
            <Badge 
              variant={multiplierFilter === '2x+' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setMultiplierFilter(multiplierFilter === '2x+' ? 'all' : '2x+')}
            >
              2x+
            </Badge>
            <Badge 
              variant={multiplierFilter === '5x+' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setMultiplierFilter(multiplierFilter === '5x+' ? 'all' : '5x+')}
            >
              5x+
            </Badge>
            <Badge 
              variant={multiplierFilter === '10x+' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setMultiplierFilter(multiplierFilter === '10x+' ? 'all' : '10x+')}
            >
              10x+
            </Badge>
          </div>

          {hasActiveFilters && (
            <>
              <div className="w-px h-4 bg-border" />
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs px-2">
                Clear filters
              </Button>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasIdeas ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Chat to generate ideas</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ask about content ideas, trends, or what's working for your music style. 
              Ideas will appear here as cards.
            </p>
          </div>
        ) : filteredAndSortedIdeas.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Filter className="w-8 h-8 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No matching ideas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredAndSortedIdeas.map((idea, index) => (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                index={index + 1}
                onRemove={onRemoveIdea}
                onFavorite={handleFavorite}
                isFavorited={checkIsFavorited(idea)}
              />
            ))}
            
            {isProcessing && (
              <div className="col-span-full flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Processing new ideas...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
