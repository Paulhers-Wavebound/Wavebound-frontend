import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ExternalLink, Plus, Eye, Heart, Users, Star, Instagram, Calendar, Share2, Clock, Filter, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFavorites } from '../hooks/useFavorites';
import { format, addDays, startOfToday } from 'date-fns';
import { Video } from '../types/content';
import TikTokThumbnail from './TikTokThumbnail';
import { VideoActionMenu } from './VideoActionMenu';
import { extractVideoMetadataForAI } from '@/contexts/DiscoverContext';
interface InstagramReel {
  id: number;
  embedded_url: string;
  video_url?: string;
  video_views: number;
  video_likes: number;
  profile_followers: number;
  outliar_score: number;
  date_posted?: string | null;
  thumbnail_url?: string | null;
  content_style?: string;
  [key: string]: any;
}

interface InstagramReelCardProps {
  reel: InstagramReel;
  isSelected: boolean;
  onToggleSelect: () => void;
  onReelClick: () => void;
  viewMode: 'grid' | 'table';
  showReplaceMode?: boolean;
  onReplaceInPlan?: (dayIndex: number) => void;
  currentPlanVideos?: Video[];
  onAskAI?: () => void;
  onShowMoreLikeThis?: () => void;
}

const InstagramReelCard: React.FC<InstagramReelCardProps> = ({
  reel,
  isSelected,
  onToggleSelect,
  onReelClick,
  viewMode,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  onAskAI,
  onShowMoreLikeThis,
}) => {
  const { isFavorited, toggleFavorite } = useFavorites();
  const [isReplacePopoverOpen, setIsReplacePopoverOpen] = useState(false);
  
  const thumbnailUrl = reel.thumbnail_url;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getViralBadge = (score: number) => {
    const formattedScore = Math.floor((score * 100) / 100).toString();
    if (score >= 0.8) return { label: `🔥 ${formattedScore}`, color: "bg-red-500/90 text-white" };
    if (score >= 0.6) return { label: `⚡ ${formattedScore}`, color: "bg-orange-500/90 text-white" };
    if (score >= 0.4) return { label: `📈 ${formattedScore}`, color: "bg-yellow-500/90 text-white" };
    return { label: `✨ ${formattedScore}`, color: "bg-emerald-500/90 text-white" };
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  // Helper to parse content_style
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

  const viralBadge = getViralBadge(reel.outliar_score);

  const getReelUrl = () => {
    // Prefer embedded_url (the proper Instagram URL) over video_url (which may be a storage download link)
    if (reel.embedded_url) return reel.embedded_url;
    // Only use video_url if it looks like a valid social media URL (not a storage/download link)
    if (reel.video_url && !reel.video_url.includes('supabase.co/storage/')) {
      return reel.video_url;
    }
    return null;
  };

  const renderPreview = () => {
    if (!thumbnailUrl) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex flex-col items-center justify-center gap-2 p-4">
          <Instagram className="w-10 h-10 text-white/80" />
          <p className="text-white/80 text-xs font-medium text-center">Reel Preview</p>
          <p className="text-white/60 text-[10px] text-center">Click to watch</p>
        </div>
      );
    }

    return (
      <img 
        src={thumbnailUrl} 
        alt="Instagram Reel"
        className="w-full h-full object-cover"
      />
    );
  };

  if (viewMode === 'table') {
    return (
      <div className="bg-card shadow-sm shadow-black/5 dark:shadow-black/20 rounded-lg p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden relative group/table-reel cursor-pointer"
            onClick={onReelClick}
          >
            <Badge className={`absolute top-0.5 left-0.5 z-10 ${viralBadge.color} border-0 text-[9px] px-1 py-0.5 rounded`}>
              {viralBadge.label}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const url = getReelUrl();
                if (url) window.open(url, '_blank');
              }}
              className="absolute bottom-0.5 left-0.5 z-10 p-0.5 bg-black/60 hover:bg-black/80 text-white rounded"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </Button>
            
            {renderPreview()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(reel.video_views)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(reel.video_likes)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{formatNumber(reel.profile_followers)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(reel.id, 'instagram_reel')}
                    className={`p-1.5 rounded-md ${isFavorited(reel.id, 'instagram_reel') ? 'bg-yellow-500/20 text-yellow-500' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isFavorited(reel.id, 'instagram_reel') ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFavorited(reel.id, 'instagram_reel') ? 'Remove from favorites' : 'Add to favorites'}</p>
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
      </div>
    );
  }

  // Convert reel to Video type for metadata extraction
  const reelAsVideo: Video = {
    id: reel.id,
    video_url: reel.video_url || reel.embedded_url || '',
    video_views: reel.video_views,
    video_likes: reel.video_likes,
    profile_followers: reel.profile_followers,
    outliar_score: reel.outliar_score,
    comments: '',
    genre: reel.genre,
    sub_genre: reel.sub_genre,
    content_style: reel.content_style,
    audience: reel.Audience,
    gender: reel.gender,
    date_posted: reel.date_posted || undefined,
    caption: reel.caption,
    hook: reel.Hook,
    Artist: reel.artist,
    is_reel: true,
    thumbnail_url: reel.thumbnail_url,
    ai_hook: reel.ai_hook,
    ai_description: reel.ai_description,
    ai_content_category: reel.ai_content_category,
  };

  // Native HTML5 drag handler for dropping into workspace notes or AI panel
  const handleNativeDragStart = (e: React.DragEvent) => {
    const category = reel.content_style || reel.genre || 'Reel';
    const badge = `<span draggable="true" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: linear-gradient(to right, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2)); color: rgb(216, 180, 254); border: 1px solid rgba(168, 85, 247, 0.3); margin: 0 4px; white-space: nowrap; cursor: move;" contenteditable="false" data-reel-id="${reel.id}" data-type="reel">📹 ${category}</span>`;
    
    // Also include structured video metadata for AI panel drop
    const metadata = extractVideoMetadataForAI(reelAsVideo);
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/html', badge);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'video',
      video: reelAsVideo,
      metadata,
    }));
  };

  return (
    <div
      draggable
      onDragStart={handleNativeDragStart}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layout
        whileHover={{ y: -8, scale: 1.02, rotateX: 2 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
        className={`bg-gradient-to-b from-card via-card to-card/95 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_8px_24px_-4px_rgba(0,0,0,0.12),0_16px_48px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_8px_24px_-4px_rgba(0,0,0,0.4),0_16px_48px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1),0_16px_40px_-8px_rgba(0,0,0,0.18),0_32px_64px_-16px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.5),0_32px_64px_-16px_rgba(0,0,0,0.4)] transition-all duration-300 relative group ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} w-full overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent before:pointer-events-none before:-z-10`}
      >
      <div 
        className="aspect-[9/16] bg-muted overflow-hidden relative group/reel cursor-pointer"
        onClick={onReelClick}
      >
        {/* Gradient overlay for better badge visibility */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
        
        <Badge className={`absolute top-2 left-2 z-20 ${viralBadge.color} border-0 text-[10px] px-2 py-0.5 rounded-md font-medium shadow-sm`}>
          {viralBadge.label}
        </Badge>

        {/* Instagram badge */}
        <Badge className="absolute top-2 right-2 z-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-[10px] px-1.5 py-0.5 rounded-md">
          <Instagram className="w-3 h-3" />
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            const url = getReelUrl();
            if (url) window.open(url, '_blank');
          }}
          className="absolute bottom-2 left-2 z-20 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
        
        {renderPreview()}
      </div>

      <div className="p-3 space-y-2">
        {formatDate(reel.date_posted) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">{formatDate(reel.date_posted)}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-medium">{formatNumber(reel.video_views)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span className="font-medium">{formatNumber(reel.video_likes)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">{formatNumber(reel.profile_followers)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Favorites button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => toggleFavorite(reel.id, 'instagram_reel')}
                  size="sm"
                  className={`w-8 h-8 rounded-lg ${
                    isFavorited(reel.id, 'instagram_reel')
                      ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  } transition-all duration-200`}
                >
                  <Star className={`w-4 h-4 ${isFavorited(reel.id, 'instagram_reel') ? 'fill-current' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorited(reel.id, 'instagram_reel') ? 'Remove from favorites' : 'Add to favorites'}</p>
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
                      onShowMoreLikeThis();
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

          {/* Replace button */}
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
          {onAskAI && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAI();
                    }}
                    size="sm"
                    className="flex-1 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.4)]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Ask AI</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI insights about this reel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </motion.div>
    </div>
  );
};

export default InstagramReelCard;