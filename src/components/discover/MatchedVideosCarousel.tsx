import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Video } from '@/types/content';
import TikTokThumbnail from '@/components/TikTokThumbnail';
import { AudioAnalysisResult } from './SongUploadDialog';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

interface MatchedVideosCarouselProps {
  videos: Video[];
  audioAnalysis: AudioAnalysisResult;
  onVideoClick: (video: Video) => void;
  isContentSelected?: (content: Video) => boolean;
  toggleContentSelection?: (content: Video) => void;
  onClear: () => void;
}

export function MatchedVideosCarousel({
  videos,
  audioAnalysis,
  onVideoClick,
  isContentSelected,
  toggleContentSelection,
  onClear,
}: MatchedVideosCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return null;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return null;
    }
  };

  if (!videos || videos.length === 0) return null;

  return (
    <section className="py-6 px-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20 mb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Perfect Matches for Your Song
                <Badge variant="secondary" className="text-xs">
                  AI-Powered
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                <Music className="w-3 h-3" />
                {audioAnalysis.genre}
                {audioAnalysis.sub_genre && ` • ${audioAnalysis.sub_genre}`}
                {audioAnalysis.mood && ` • ${audioAnalysis.mood}`}
                {audioAnalysis.bpm && ` • ${audioAnalysis.bpm} BPM`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Filter
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {videos.map((video, index) => (
            <div
              key={`matched-${video.id}-${index}`}
              className="flex-shrink-0 w-[200px] relative group cursor-pointer"
              onClick={() => onVideoClick(video)}
            >
              {/* Match Score Badge */}
              {(video as any).matchScore && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge 
                    className={cn(
                      "text-xs font-medium",
                      (video as any).matchScore >= 80 
                        ? "bg-primary text-primary-foreground" 
                        : (video as any).matchScore >= 60 
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {(video as any).matchScore}% Match
                  </Badge>
                </div>
              )}
              
              {/* Thumbnail */}
              <div className="aspect-[9/16] rounded-lg overflow-hidden bg-muted">
                <TikTokThumbnail 
                  videoId={video.id}
                  tiktokUrl={video.embedded_ulr || video.video_url}
                  fallbackThumbnail={video.thumbnail_url}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Info */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {video.genre || video.content_style || 'Video'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatNumber(video.video_views)} views</span>
                  {video.date_posted && (
                    <span>• {formatDate(video.date_posted)}</span>
                  )}
                </div>
                {(video as any).matchReason && (
                  <p className="text-xs text-primary/80 line-clamp-2">
                    {(video as any).matchReason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
