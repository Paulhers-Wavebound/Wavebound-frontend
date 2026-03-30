import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { X, Heart, Users, ExternalLink, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format, addDays, startOfToday } from 'date-fns';
import { parseGenreJson, parseSubGenreJson } from '@/utils/genreParser';
import { getGenreColor, getContentCategoryColor } from '@/utils/tagColors';
import TikTokEmbed from './TikTokEmbed';
import InstagramEmbed from './InstagramEmbed';
import useEmblaCarousel from 'embla-carousel-react';
import { stopAllMedia } from '@/utils/mediaEvents';

interface Video {
  id: number;
  video_url: string;
  outliar_score: number;
  video_views: number;
  video_likes: number;
  comments: string;
  profile_followers: number;
  caption?: string;
  hook?: string;
  who?: string;
  genre?: string;
  sub_genre?: string;
  gif_url?: string | null;
  thumbnail_url?: string | null;
  content_style?: string;
  audience?: string;
  gender?: string;
  date_posted?: string;
  embedded_ulr?: string;
  Artist?: string;
  profile_bio?: string;
  video_file_url?: string;
  isPhotoCarousel?: boolean; // Flag for photo carousel handling
  postUrl?: string; // Full TikTok post URL for photo carousel embed
}

interface VideoDetailsModalProps {
  video: Video | null;
  videos?: Video[];
  isOpen: boolean;
  onClose: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showReplaceMode?: boolean;
  onReplaceInPlan?: (dayIndex: number) => void;
  currentPlanVideos?: Video[];
  selectedForReplace?: Video | null;
  onSelectForReplace?: (video: Video | null) => void;
}

const VideoDetailsModal: React.FC<VideoDetailsModalProps> = ({
  video,
  videos = [],
  isOpen,
  onClose,
  isSelected = false,
  onToggleSelect,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  selectedForReplace,
  onSelectForReplace,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, skipSnaps: false });
  const [isReplacePopoverOpen, setIsReplacePopoverOpen] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  // Reorder videos so the selected video is first — prevents Embla defaulting to index 0 (wrong video)
  const displayVideos = (() => {
    if (videos.length > 0 && video) {
      const idx = videos.findIndex(v => v.id === video.id);
      if (idx > 0) {
        return [...videos.slice(idx), ...videos.slice(0, idx)];
      }
      return videos;
    }
    return video ? [video] : [];
  })();

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // No longer needed - InstagramEmbed fetches its own embed HTML

  // Stop all other media when the video modal opens
  useEffect(() => {
    if (isOpen) {
      stopAllMedia();
    }
  }, [isOpen]);

  // Scroll to the selected video when modal opens or video changes
  useEffect(() => {
    if (isOpen && emblaApi && video && displayVideos.length > 0) {
      console.log('📺 Video modal opened for video ID:', video?.id);
      const videoIndex = displayVideos.findIndex(v => v.id === video.id);
      if (videoIndex !== -1) {
        console.log(`🎯 Scrolling to video index ${videoIndex}`);
        emblaApi.reInit();
        emblaApi.scrollTo(videoIndex, true);
      }
    }
  }, [isOpen, video?.id, emblaApi, displayVideos]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const getViralScore = (score: number) => {
    return Math.round(score * 100);
  };

  // Extract TikTok/Instagram video ID from URL
  const extractVideoIdFromUrl = (vid: Video): string => {
    const contentUrl = (vid as any).content_url || (vid as any).embedded_url || vid.embedded_ulr || vid.video_url || '';
    
    // TikTok video/photo ID pattern
    const tiktokMatch = contentUrl.match(/\/(?:video|photo)\/(\d+)/);
    if (tiktokMatch) return tiktokMatch[1];
    
    // Instagram reel/post ID pattern
    const instaMatch = contentUrl.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (instaMatch) return instaMatch[1];
    
    // Fallback to database ID
    return String(vid.id);
  };

  const getGenreTags = () => {
    const tags = [];
    if (video.genre) {
      // Parse JSON-formatted genre data
      tags.push(...parseGenreJson(video.genre));
    }
    return tags.slice(0, 2); // Show max 2 genre tags
  };

  // Helper to parse content_style (can be JSON array or comma-separated string)
  const parseContentStyle = (contentStyle: string): string[] => {
    if (!contentStyle) return [];
    
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(contentStyle);
      if (Array.isArray(parsed)) {
        return parsed.map(s => String(s).trim()).filter(s => s);
      }
      // If it's a string after parse, split by comma
      return String(parsed).split(',').map(s => s.trim()).filter(s => s);
    } catch {
      // Fallback: clean up any brackets/quotes and split by comma
      return contentStyle
        .replace(/^\[|\]$/g, '') // Remove leading/trailing brackets
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, '')) // Remove quotes
        .filter(s => s);
    }
  };

  const getContentStyleTags = () => {
    const tags = [];
    if (video.content_style) {
      tags.push(...parseContentStyle(video.content_style));
    }
    if (video.hook) {
      tags.push('Statement Hook');
    }
    return tags.slice(0, 2); // Show max 2 content style tags
  };

  if (!video || displayVideos.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Navigation Arrows - Outside the modal */}
      {canScrollPrev && (
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      {canScrollNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}
      
      <DialogContent 
        className="max-w-[360px] w-full bg-black border-0 p-0 overflow-hidden shadow-2xl"
        aria-describedby="video-description"
        hideClose
      >
        {/* Accessibility requirements */}
        <VisuallyHidden>
          <DialogTitle>Video Preview</DialogTitle>
          <DialogDescription id="video-description">
            TikTok video embed for content preview
          </DialogDescription>
        </VisuallyHidden>


        {/* Embla carousel container - key forces reset on video change */}
        <div className="overflow-hidden" ref={emblaRef} key={`carousel-${video?.id}`}>
          <div className="flex">
            {displayVideos.map((vid) => {
              // Photo carousel iframe embed using /player/v1/ extracted from content_url
              // Check content_url (profile analysis), embedded_url (photo carousel), embedded_ulr (typo in videos), video_url
              const contentUrl = (vid as any).content_url || (vid as any).embedded_url || vid.embedded_ulr || vid.video_url || '';
              
              // Check if it's a photo carousel by checking flag, photo_url fields, or /photo/ in URL
              const isPhotoCarousel = !!(vid as any).isPhotoCarousel ||
                                      !!(vid as any).photo_carousel_analysis || 
                                      !!(vid as any).photo_url ||
                                      !!(vid as any).photo_url_1 ||
                                      contentUrl.includes('/photo/');
              
              console.log('🎬 VideoDetailsModal rendering video:', vid.id, 'contentUrl:', contentUrl, 'isPhotoCarousel:', isPhotoCarousel);
              
              if (isPhotoCarousel) {
                // Use pre-built playerUrl from postUrl prop, or extract video ID from content_url
                let playerUrl = (vid as any).postUrl;
                if (!playerUrl || !playerUrl.includes('player/v1')) {
                  const postId = contentUrl.match(/\/(?:video|photo)\/(\d+)/)?.[1];
                  playerUrl = postId 
                    ? `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&controls=1&volume_control=1`
                    : null;
                }

                console.log('🖼️ Photo carousel detected! PlayerURL:', playerUrl);

                if (playerUrl) {
                  return (
                    <div key={vid.id} className="flex-[0_0_100%] min-w-0">
                      {/* Compact tags section with ID */}
                      <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 justify-center flex-wrap items-center">
                        <span className="text-[10px] text-gray-400 font-mono">ID: {(vid as any).plan_video_id || vid.id}</span>
                        {vid.genre && parseGenreJson(vid.genre).slice(0, 2).map((tag, idx) => {
                          const colors = getGenreColor(tag);
                          return (
                            <Badge 
                              key={`genre-${idx}`} 
                              className="text-xs px-2 py-0.5 border"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderColor: colors.border
                              }}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                        {vid.content_style && parseContentStyle(vid.content_style).slice(0, 2).map((tag, idx) => {
                          const colors = getContentCategoryColor(tag);
                          return (
                            <Badge 
                              key={`style-${idx}`} 
                              className="text-xs px-2 py-0.5 border"
                              style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderColor: colors.border
                              }}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                      </div>

                      {/* TikTok photo carousel iframe player */}
                      <div className="w-full flex items-center justify-center bg-gray-100">
                        <iframe
                          src={playerUrl}
                          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                          allowFullScreen
                          title="TikTok Photo Carousel Player"
                          style={{ width: '100%', height: '600px', border: 'none', pointerEvents: 'auto' }}
                          loading="lazy"
                          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-forms"
                          onLoad={() => console.log('✅ Photo carousel iframe loaded successfully')}
                          onError={(e) => {
                            console.error('❌ Photo carousel iframe failed to load', e);
                            console.error('Failed URL:', playerUrl);
                            window.open(contentUrl, '_blank', 'noopener,noreferrer');
                            onClose();
                          }}
                        />
                      </div>
                    </div>
                  );
                } else {
                  console.error('❌ No player URL generated for photo carousel:', contentUrl);
                }
              }

              // Instagram Reel handling (check both embedded_url and embedded_ulr typo)
              const embedUrl = (vid as any).embedded_url || vid.embedded_ulr || vid.video_url || '';
              const isInstagram = embedUrl && (embedUrl.includes('instagram.com/reel') || embedUrl.includes('instagram.com/p/'));
              
              if (isInstagram) {
                return (
                  <div key={vid.id} className="flex-[0_0_100%] min-w-0">
                    {/* Compact tags section with ID */}
                    <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 justify-center flex-wrap items-center">
                      <span className="text-[10px] text-gray-400 font-mono">ID: {(vid as any).plan_video_id || vid.id}</span>
                      {vid.genre && parseGenreJson(vid.genre).slice(0, 2).map((tag, idx) => {
                        const colors = getGenreColor(tag);
                        return (
                          <Badge 
                            key={`genre-${idx}`} 
                            className="text-xs px-2 py-0.5 border"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border
                            }}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                      {vid.content_style && parseContentStyle(vid.content_style).slice(0, 2).map((tag, idx) => {
                        const colors = getContentCategoryColor(tag);
                        return (
                          <Badge 
                            key={`style-${idx}`} 
                            className="text-xs px-2 py-0.5 border"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border
                            }}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Instagram Reel embed */}
                    <div className="w-full flex items-center justify-center">
                      <InstagramEmbed
                        reelUrl={embedUrl || vid.video_url}
                        videoId={vid.id}
                        videoFileUrl={vid.video_file_url}
                        className="mx-auto"
                      />
                    </div>
                  </div>
                );
              }

              // Regular TikTok video handling
              return (
                <div key={vid.id} className="flex-[0_0_100%] min-w-0">
                  {/* Compact tags section with ID */}
                  <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-2 justify-center flex-wrap items-center">
                    <span className="text-[10px] text-gray-400 font-mono">ID: {(vid as any).plan_video_id || vid.id}</span>
                    {vid.genre && parseGenreJson(vid.genre).slice(0, 2).map((tag, idx) => {
                      const colors = getGenreColor(tag);
                      return (
                        <Badge 
                          key={`genre-${idx}`} 
                          className="text-xs px-2 py-0.5 border"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border
                          }}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                    {vid.content_style && parseContentStyle(vid.content_style).slice(0, 2).map((tag, idx) => {
                      const colors = getContentCategoryColor(tag);
                      return (
                        <Badge 
                          key={`style-${idx}`} 
                          className="text-xs px-2 py-0.5 border"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border
                          }}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* TikTok video embed */}
                  <div className="w-full flex items-center justify-center">
                    <TikTokEmbed
                      tiktokUrl={vid.embedded_ulr || vid.video_url}
                      videoId={vid.id}
                      videoDbId={vid.id}
                      className="mx-auto"
                      caption={vid.caption}
                      username={vid.Artist}
                      showShareOverlay={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoDetailsModal;