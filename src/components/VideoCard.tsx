import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ExternalLink, Plus, Eye, Heart, Users, Star, Calendar, Share2, Clock, Sparkles, Filter } from 'lucide-react';
import { format, addDays, startOfToday, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { toast } from '@/hooks/use-toast';

import { Video, ContentItem } from '../types/content';
import { useFavorites } from '../hooks/useFavorites';
import { useActivityTracker } from '../hooks/useActivityTracker';
import TikTokThumbnail from './TikTokThumbnail';
import { VideoActionMenu, VideoQuickActions } from './VideoActionMenu';
import { extractVideoMetadataForAI } from '@/contexts/DiscoverContext';

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onToggleSelect: () => void;
  onVideoClick: () => void;
  viewMode: 'grid' | 'table';
  allContent?: ContentItem[];
  currentIndex?: number;
  showReplaceMode?: boolean;
  onReplaceInPlan?: (dayIndex: number) => void;
  currentPlanVideos?: Video[];
  selectedForReplace?: Video | null;
  onSelectForReplace?: (video: Video | null) => void;
  // New: Discover integration actions
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
  // Content plan integration
  onAddToPlan?: () => void;
  hasPlan?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({
  video,
  isSelected,
  onToggleSelect,
  onVideoClick,
  viewMode,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  selectedForReplace,
  onSelectForReplace,
  onAskAI,
  onShowMoreLikeThis,
  onAddToPlan,
  hasPlan,
}) => {
  const { isFavorited, toggleFavorite } = useFavorites();
  const { trackActivity } = useActivityTracker();
  const [isReplacePopoverOpen, setIsReplacePopoverOpen] = useState(false);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  }, []);

  // Helper to parse content_style (can be JSON array or comma-separated string)
  const parseContentStyle = (contentStyle: string | undefined): string => {
    if (!contentStyle) return 'Content';
    
    try {
      const parsed = JSON.parse(contentStyle);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(s => s).join(', ');
      }
      return String(parsed);
    } catch {
      return contentStyle
        .replace(/^\[|\]$/g, '')
        .replace(/"/g, '')
        .trim();
    }
  };
  
  const getViralBadge = useCallback((score: number) => {
    const formattedScore = Math.floor((score * 100) / 100).toString();
    if (score >= 0.8) return { label: `🔥 ${formattedScore}`, color: "bg-red-500/90 text-white" };
    if (score >= 0.6) return { label: `⚡ ${formattedScore}`, color: "bg-orange-500/90 text-white" };
    if (score >= 0.4) return { label: `📈 ${formattedScore}`, color: "bg-yellow-500/90 text-white" };
    return { label: `✨ ${formattedScore}`, color: "bg-emerald-500/90 text-white" };
  }, []);

  // Format date posted
  const formattedDate = useMemo(() => {
    if (!video.date_posted) return null;
    try {
      const date = parseISO(video.date_posted);
      if (!isValid(date)) return null;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return null;
    }
  }, [video.date_posted]);

  const viralBadge = useMemo(() => getViralBadge(video.outliar_score), [getViralBadge, video.outliar_score]);

  const getTikTokUrl = useCallback(() => {
    // Prefer embedded_ulr (the proper social media URL) over video_url (which may be a storage download link)
    if (video.embedded_ulr) return video.embedded_ulr;
    // Only use video_url if it looks like a valid social media URL (not a storage/download link)
    if (video.video_url && !video.video_url.includes('supabase.co/storage/')) {
      return video.video_url;
    }
    return null;
  }, [video.embedded_ulr, video.video_url]);

  // Handle Ask AI action - must be before any early returns
  const handleAskAI = useCallback(() => {
    onAskAI?.(video);
  }, [video, onAskAI]);

  // Handle Show More Like This action - must be before any early returns
  const handleShowMoreLikeThis = useCallback(() => {
    onShowMoreLikeThis?.(video);
  }, [video, onShowMoreLikeThis]);

  // Handle share - must be before any early returns
  const handleShare = useCallback(() => {
    const shareLink = `${window.location.origin}/explore?video=${video.id}`;
    const shareText = `found this on Wavebound 🔥 ${shareLink}`;
    navigator.clipboard.writeText(shareText);
    toast({ title: 'Link copied!', description: 'Ready to share' });
  }, [video.id]);

  // Handle external link - must be before any early returns
  const handleOpenExternal = useCallback(() => {
    const url = getTikTokUrl();
    if (url) window.open(url, '_blank');
  }, [getTikTokUrl]);

  if (viewMode === 'table') {
    return (
      <Card className="bg-card shadow-sm shadow-black/5 dark:shadow-black/20 p-4 rounded-lg hover:bg-muted/50 transition-colors border-0">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden relative group/table-video cursor-pointer"
            onClick={onVideoClick}
          >
            <Badge className={`absolute top-0.5 left-0.5 z-10 ${viralBadge.color} border-0 text-[9px] px-1 py-0.5 rounded`}>
              {viralBadge.label}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const url = getTikTokUrl();
                if (url) window.open(url, '_blank');
              }}
              className="absolute bottom-0.5 left-0.5 z-10 p-0.5 bg-black/60 hover:bg-black/80 text-white rounded"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </Button>
            
            <TikTokThumbnail 
              videoId={video.id}
              tiktokUrl={video.embedded_ulr || ''}
              fallbackThumbnail={video.thumbnail_url}
              className="w-full h-full"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(video.video_views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(video.video_likes)}</span>
              </div>
              {video.profile_followers > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{formatNumber(video.profile_followers)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(video.id)}
                    className={`p-1.5 rounded-md ${isFavorited(video.id) ? 'bg-yellow-500/20 text-yellow-500' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorited(video.id) ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorited(video.id) ? 'Remove from favorites' : 'Add to favorites'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleSelect}
                    className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to your content plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </Card>
    );
  }

  // Native HTML5 drag handler for dropping into workspace notes or AI panel
  const handleNativeDragStart = (e: React.DragEvent) => {
    const category = parseContentStyle(video.content_style) || video.genre || 'Video';
    const badge = `<span draggable="true" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: rgba(59, 130, 246, 0.2); color: rgb(147, 197, 253); border: 1px solid rgba(59, 130, 246, 0.3); margin: 0 4px; white-space: nowrap; cursor: move;" contenteditable="false" data-video-id="${video.id}" data-type="video">🎬 ${category}</span>`;
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', badge);
    
    // Also set structured JSON data for AI panel drop
    const videoMetadata = extractVideoMetadataForAI(video);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'video-for-ai',
      id: video.id,
      metadata: videoMetadata,
    }));
  };

  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  return (
    <div
      {...(!isTouch ? { draggable: true, onDragStart: handleNativeDragStart } : {})}
      className={!isTouch ? "cursor-grab active:cursor-grabbing" : ""}
    >
    <motion.div
      whileHover={{ y: -8, scale: 1.02, rotateX: 2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={`bg-gradient-to-b from-card via-card to-card/95 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_8px_24px_-4px_rgba(0,0,0,0.12),0_16px_48px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_8px_24px_-4px_rgba(0,0,0,0.4),0_16px_48px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1),0_16px_40px_-8px_rgba(0,0,0,0.18),0_32px_64px_-16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.5),0_32px_64px_-16px_rgba(0,0,0,0.4)] transition-all duration-300 relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} w-full overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-b before:from-white/10 before:via-transparent before:to-transparent before:pointer-events-none before:-z-10`}
    >
      {/* TikTok embed preview - 9:16 aspect ratio container */}
      <div 
        className="aspect-[9/16] bg-muted overflow-hidden relative group/video cursor-pointer"
        onClick={() => { onVideoClick(); trackActivity('video_viewed', { videoId: video.id }); }}
      >
        {/* Gradient overlay for better badge visibility */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
        
        {/* Viral badge in top corner */}
        <Badge className={`absolute top-2 left-2 z-20 ${viralBadge.color} border-0 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-sm`}>
          {viralBadge.label}
        </Badge>

        {/* External link button in bottom left */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            const url = getTikTokUrl();
            if (url) window.open(url, '_blank');
          }}
          className="absolute bottom-2 left-2 z-20 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
        
        {/* Static thumbnail */}
        <TikTokThumbnail 
          videoId={video.id}
          tiktokUrl={video.embedded_ulr || ''}
          fallbackThumbnail={video.thumbnail_url}
          className="w-full h-full"
        />
      </div>

      {/* Bottom section with stats and add button */}
      <div className="p-2 md:p-3 space-y-1.5 md:space-y-3">
        {/* Date posted */}
        {formattedDate && (
          <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-muted-foreground">
            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Stats with icons */}
        <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5 md:gap-1">
            <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="font-medium">{formatNumber(video.video_views)}</span>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">
            <Heart className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="font-medium">{formatNumber(video.video_likes)}</span>
          </div>
          {video.profile_followers > 0 && (
            <div className="flex items-center gap-0.5 md:gap-1">
              <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="font-medium">{formatNumber(video.profile_followers)}</span>
            </div>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-1.5">
          {/* Favorites button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => toggleFavorite(video.id)}
                  size="sm"
                  className={`w-8 h-8 rounded-lg ${
                    isFavorited(video.id) 
                      ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  } transition-all duration-200`}
                >
                  <Star className={`w-4 h-4 ${isFavorited(video.id) ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorited(video.id) ? 'Remove from favorites' : 'Add to favorites'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Show More Like This button */}
          {onShowMoreLikeThis && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowMoreLikeThis();
                    }}
                    size="sm"
                    className="w-8 h-8 rounded-lg bg-muted/50 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-500 transition-all duration-200"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show more like this</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Add to Plan button - shows when plan is active and onAddToPlan is provided */}
          {hasPlan && onAddToPlan && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToPlan();
                    }}
                    size="sm"
                    className="w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to content plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Replace button - shows when in replace mode */}
          {showReplaceMode && onReplaceInPlan && (
            <Popover open={isReplacePopoverOpen} onOpenChange={setIsReplacePopoverOpen}>
              <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 flex items-center justify-center"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-popover border-border" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">Replace day in content plan</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = addDays(startOfToday(), i);
                      const currentVideo = currentPlanVideos[i];
                      const isSelectedDay = selectedForReplace?.id === currentVideo?.id;
                      return (
                        <Button
                          key={i}
                          variant="outline"
                          className={`justify-start h-auto py-2 px-3 ${
                            isSelectedDay ? 'ring-2 ring-primary bg-primary/10' : ''
                          }`}
                          onClick={() => {
                            onReplaceInPlan(i);
                            setIsReplacePopoverOpen(false);
                            if (onSelectForReplace) onSelectForReplace(null);
                          }}
                        >
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex flex-col items-center justify-center bg-muted rounded px-2 py-1 min-w-[44px]">
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {format(date, 'EEE')}
                              </span>
                              <span className="text-base font-bold">{format(date, 'd')}</span>
                            </div>
                            <div className="w-9 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                              {currentVideo?.thumbnail_url ? (
                                <img 
                                  src={currentVideo.thumbnail_url} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              ) : currentVideo?.embedded_ulr ? (
                                <TikTokThumbnail 
                                  videoId={currentVideo.id}
                                  tiktokUrl={currentVideo.embedded_ulr}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-xs text-foreground font-medium line-clamp-1">
                                {parseContentStyle(currentVideo?.content_style)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {currentVideo?.video_views?.toLocaleString() || '0'} views
                              </p>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Ask AI button */}
          {onAskAI ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAI();
                    }}
                    size="sm"
                    className="flex-1 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Ask AI</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI insights about this video</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : !showReplaceMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    onClick={onToggleSelect}
                    className={`flex-1 h-8 rounded-lg ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'bg-muted/50 hover:bg-muted border-border/50 text-foreground'
                    } transition-all duration-200 flex items-center justify-center gap-1.5`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Add</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to your content plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </motion.div>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;