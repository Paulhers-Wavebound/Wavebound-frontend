import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Eye, Heart, Users, Check, Camera, Star, Layers, Calendar, Clock, Sparkles, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFavorites } from '../hooks/useFavorites';
import { fixSupabaseStorageUrl } from '../services/contentDataService';
import { format, addDays, startOfToday, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { Video } from '../types/content';
import TikTokThumbnail from './TikTokThumbnail';


interface PhotoCarousel {
  id: number;
  embedded_url?: string;
  outliar_score?: number;
  photo_views?: number;
  photo_likes?: number;
  comments?: string;
  profile_followers?: number;
  caption?: string;
  Hook?: string;
  "who?"?: string;
  genre?: string;
  sub_genre?: string;
  content_style?: string;
  Audience?: string;
  gender?: string;
  date_posted?: string;
  artist?: string;
  profile_bio?: string;
  photo_text_1?: string;
  photo_text_2?: string;
  photo_text_3?: string;
  photo_text_4?: string;
  photo_text_5?: string;
  photo_url_1?: string;
  photo_url_2?: string;
  photo_url_3?: string;
}

interface PhotoCarouselCardProps {
  photoCarousel: PhotoCarousel;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  showReplaceMode?: boolean;
  onReplaceInPlan?: (dayIndex: number) => void;
  currentPlanVideos?: Video[];
  onAskAI?: (photoCarousel: PhotoCarousel) => void;
  onShowMoreLikeThis?: (photoCarousel: PhotoCarousel) => void;
  onAddToPlan?: () => void;
  hasPlan?: boolean;
}

const PhotoCarouselCard: React.FC<PhotoCarouselCardProps> = React.memo(({
  photoCarousel,
  isSelected,
  onToggleSelect,
  onClick,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  onAskAI,
  onShowMoreLikeThis,
  onAddToPlan,
  hasPlan = false,
}) => {
  const { toggleFavorite, isFavorited } = useFavorites();
  const [isReplacePopoverOpen, setIsReplacePopoverOpen] = React.useState(false);
  
  const fixedPhotoUrl = fixSupabaseStorageUrl(photoCarousel.photo_url_1);
  const thumbnailUrl = fixedPhotoUrl;
  const thumbnailError = !thumbnailUrl;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getViralScore = (score: number) => {
    const fullScore = Math.round(score * 10000);
    return Math.floor(fullScore / 100);
  };

  const getViralityBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-500/90';
    if (score >= 0.6) return 'bg-orange-500/90';
    if (score >= 0.4) return 'bg-yellow-500/90';
    return 'bg-emerald-500/90';
  };

  const parseContentStyle = (contentStyle: string | undefined): string => {
    if (!contentStyle) return 'Content';
    try {
      const parsed = JSON.parse(contentStyle);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(s => s).join(', ');
      }
      return String(parsed);
    } catch {
      return contentStyle.replace(/^\[|\]$/g, '').replace(/"/g, '').trim();
    }
  };

  // Format date posted - matches VideoCard
  const formattedDate = useMemo(() => {
    if (!photoCarousel.date_posted) return null;
    try {
      const date = parseISO(photoCarousel.date_posted);
      if (!isValid(date)) return null;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return null;
    }
  }, [photoCarousel.date_posted]);

  // Native HTML5 drag handler for dropping into workspace notes
  const handleNativeDragStart = (e: React.DragEvent) => {
    const category = photoCarousel.content_style || photoCarousel.genre || 'Photo Carousel';
    const badge = `<span draggable="true" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: rgba(34, 197, 94, 0.2); color: rgb(134, 239, 172); border: 1px solid rgba(34, 197, 94, 0.3); margin: 0 4px; white-space: nowrap; cursor: move;" contenteditable="false" data-photo-id="${photoCarousel.id}" data-type="photo">📷 ${category}</span>`;
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', badge);
  };

  return (
    <div 
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleNativeDragStart}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02, rotateX: 2 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        className={`bg-gradient-to-b from-card via-card to-card/95 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_8px_24px_-4px_rgba(0,0,0,0.12),0_16px_48px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_8px_24px_-4px_rgba(0,0,0,0.4),0_16px_48px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1),0_16px_40px_-8px_rgba(0,0,0,0.18),0_32px_64px_-16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.5),0_32px_64px_-16px_rgba(0,0,0,0.4)] transition-all duration-300 relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none before:-z-10`}
      >
        {/* Image container - 9:16 aspect ratio */}
        <div className="relative aspect-[9/16] bg-muted overflow-hidden">
          {/* Gradient overlay for better badge visibility */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
          
          {/* Camera icon indicator */}
          <div className="absolute top-2 left-2 z-20 bg-black/60 rounded-md p-1.5">
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
            
          {/* Viral score badge */}
          <Badge className={`absolute top-2 right-2 z-20 ${getViralityBadgeColor(photoCarousel.outliar_score || 0)} text-white px-2 py-0.5 text-[10px] font-medium rounded-md shadow-sm border-0`}>
            {getViralScore(photoCarousel.outliar_score || 0)}
          </Badge>

          {/* Thumbnail image or fallback placeholder */}
          {thumbnailUrl && !thumbnailError ? (
            <img
              src={thumbnailUrl}
              alt="Photo Carousel Preview"
              className="w-full h-full object-cover object-center cursor-pointer"
              onClick={onClick}
            />
          ) : (
            <div 
              className="w-full h-full flex flex-col items-center justify-center text-white cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900"
              onClick={onClick}
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-1">
                  <Layers className="w-16 h-16 text-white/60" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white/80">Photo Carousel</p>
                  {photoCarousel.artist && (
                    <p className="text-sm text-white/50">@{photoCarousel.artist}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hover overlay with buttons */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none" />
          
          {/* Small favorites button - appears on hover */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(photoCarousel.id, 'photo_carousel');
                  }}
                  size="sm"
                  className={`absolute top-2 left-12 p-1.5 w-7 h-7 z-20 rounded-md ${
                    isFavorited(photoCarousel.id, 'photo_carousel') 
                      ? 'bg-yellow-500/90 hover:bg-yellow-500 text-white' 
                      : 'bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100'
                  } transition-all duration-200`}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorited(photoCarousel.id, 'photo_carousel') ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorited(photoCarousel.id, 'photo_carousel') ? 'Remove from favorites' : 'Add to favorites'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Stats section */}
        <div className="p-3 space-y-3">
          {/* Date posted */}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="font-medium">{formatNumber(photoCarousel.photo_views || 0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span className="font-medium">{formatNumber(photoCarousel.photo_likes || 0)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{formatNumber(photoCarousel.profile_followers || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Favorites button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => toggleFavorite(photoCarousel.id, 'photo_carousel')}
                    variant="ghost"
                    size="sm"
                    className={`w-8 h-8 rounded-lg ${
                      isFavorited(photoCarousel.id, 'photo_carousel') 
                        ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
                        : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                    } transition-all duration-200`}
                  >
                    <Star className={`w-4 h-4 ${isFavorited(photoCarousel.id, 'photo_carousel') ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorited(photoCarousel.id, 'photo_carousel') ? 'Remove from favorites' : 'Add to favorites'}</p>
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
                        onShowMoreLikeThis(photoCarousel);
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

            {/* Add to Plan button - shows when plan is active */}
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
                        return (
                          <Button
                            key={i}
                            variant="outline"
                            className="justify-start h-auto py-2 px-3"
                            onClick={() => {
                              onReplaceInPlan(i);
                              setIsReplacePopoverOpen(false);
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
                        onAskAI(photoCarousel);
                      }}
                      size="sm"
                      className="flex-1 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Ask AI</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI insights about this carousel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : !showReplaceMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onToggleSelect}
                      variant={isSelected ? "default" : "outline"}
                      className={`flex-1 h-8 rounded-lg ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-muted/50 hover:bg-muted border-border/50 text-foreground'
                      } transition-all duration-200 flex items-center justify-center gap-1.5`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span className="text-xs font-medium">{isSelected ? 'Added' : 'Add'}</span>
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

PhotoCarouselCard.displayName = 'PhotoCarouselCard';

export default PhotoCarouselCard;
