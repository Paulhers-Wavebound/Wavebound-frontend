import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ScrollCarouselWrapper } from './ScrollCarouselWrapper';
import VideoCard from './VideoCard';
import PhotoCarouselCard from './PhotoCarouselCard';
import InstagramReelCard from './InstagramReelCard';
import { ContentItem, Video, PhotoCarousel } from '../types/content';

interface ContentPreviewScrollProps {
  previewContent: ContentItem[];
  isContentSelected: (item: ContentItem) => boolean;
  toggleContentSelection: (item: ContentItem) => void;
  handleVideoClick: (video: Video) => void;
  handlePhotoCarouselClick: (carousel: PhotoCarousel) => void;
  showPlusCard: boolean;
  isExpanded: boolean;
  onExpand: () => void;
  onShowMore: () => void;
  totalCount: number;
  hasMore: boolean;
  showReplaceMode?: boolean;
  onReplaceInPlan?: (video: Video, dayIndex: number) => void;
  currentPlanVideos?: Video[];
  selectedForReplace?: Video | null;
  onSelectForReplace?: (video: Video | null) => void;
  // AI integration handlers
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
  // Content plan integration
  onAddToPlan?: (video: Video) => void;
  hasPlan?: boolean;
}

export const ContentPreviewScroll: React.FC<ContentPreviewScrollProps> = ({
  previewContent,
  isContentSelected,
  toggleContentSelection,
  handleVideoClick,
  handlePhotoCarouselClick,
  showPlusCard,
  isExpanded,
  onExpand,
  onShowMore,
  totalCount,
  hasMore,
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
  return (
    <ScrollCarouselWrapper scrollClassName="px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="contents"
      >
      {previewContent.length > 0 ? (
        previewContent.map((item, index) => {
          const uniqueKey = 'video_url' in item ? `video-${item.id}` : `carousel-${item.id}`;
          
          if ('video_url' in item) {
            // Check if it's an Instagram Reel
            const isInstagramReel = item.embedded_ulr?.includes('instagram.com/reel') || 
                                   item.embedded_ulr?.includes('instagram.com/p/') ||
                                   item.video_url?.includes('instagram.com/reel') ||
                                   item.video_url?.includes('instagram.com/p/');
            
            if (isInstagramReel) {
              return (
                <div key={uniqueKey} className="flex-shrink-0 w-40 md:w-48 md:snap-start">
                  <InstagramReelCard
                    reel={item as any}
                    isSelected={isContentSelected(item)}
                    onToggleSelect={() => toggleContentSelection(item)}
                    onReelClick={() => handleVideoClick(item)}
                    viewMode="grid"
                    showReplaceMode={showReplaceMode}
                    onReplaceInPlan={onReplaceInPlan ? (dayIndex) => onReplaceInPlan(item, dayIndex) : undefined}
                    currentPlanVideos={currentPlanVideos}
                    onAskAI={onAskAI ? () => onAskAI(item) : undefined}
                    onShowMoreLikeThis={onShowMoreLikeThis ? () => onShowMoreLikeThis(item) : undefined}
                  />
                </div>
              );
            }
            
            return (
              <div key={uniqueKey} className="flex-shrink-0 w-40 md:w-48 md:snap-start">
                <VideoCard
                  video={item}
                  isSelected={isContentSelected(item)}
                  onToggleSelect={() => toggleContentSelection(item)}
                  onVideoClick={() => handleVideoClick(item)}
                  viewMode="grid"
                  allContent={previewContent}
                  currentIndex={index}
                  showReplaceMode={showReplaceMode}
                  onReplaceInPlan={onReplaceInPlan ? (dayIndex) => onReplaceInPlan(item, dayIndex) : undefined}
                  currentPlanVideos={currentPlanVideos}
                  selectedForReplace={selectedForReplace}
                  onSelectForReplace={onSelectForReplace}
                  onAskAI={onAskAI}
                  onShowMoreLikeThis={onShowMoreLikeThis}
                  onAddToPlan={onAddToPlan ? () => onAddToPlan(item) : undefined}
                  hasPlan={hasPlan}
                />
              </div>
            );
          } else {
            return (
              <div key={uniqueKey} className="flex-shrink-0 w-40 md:w-48 md:snap-start">
                <PhotoCarouselCard
                  photoCarousel={item}
                  isSelected={isContentSelected(item)}
                  onToggleSelect={() => toggleContentSelection(item)}
                  onClick={() => handlePhotoCarouselClick(item)}
                  showReplaceMode={showReplaceMode}
                  onReplaceInPlan={onReplaceInPlan ? (dayIndex) => onReplaceInPlan(item as any, dayIndex) : undefined}
                  currentPlanVideos={currentPlanVideos}
                  onAskAI={onAskAI as any}
                  onShowMoreLikeThis={onShowMoreLikeThis as any}
                  onAddToPlan={onAddToPlan ? () => onAddToPlan(item as any) : undefined}
                  hasPlan={hasPlan}
                />
              </div>
            );
          }
        })
      ) : (
        <div className="w-full py-12 text-center">
          <p className="text-gray-400 text-sm">No content matches your current filters</p>
        </div>
      )}
      
      {/* Plus card to show all - always visible when there's content */}
      {showPlusCard && (
        <div className="flex-shrink-0 w-40 md:w-48 md:snap-start ml-2 md:ml-3 relative z-10">
          <button
            type="button"
            onClick={isExpanded ? onShowMore : onExpand}
            className="group w-full h-[300px] md:h-[360px] flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30 hover:from-primary/5 hover:via-primary/10 hover:to-primary/5 transition-all duration-300 rounded-xl md:rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-3 md:mb-4 transition-all duration-300 group-hover:scale-110">
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-primary/70 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-muted-foreground group-hover:text-foreground text-xs md:text-sm font-medium transition-colors">
              {isExpanded ? 'Show More' : 'Show All'}
            </p>
            <p className="text-muted-foreground/60 text-[10px] md:text-xs mt-1">{totalCount} videos</p>
          </button>
        </div>
      )}
      </motion.div>
    </ScrollCarouselWrapper>
  );
};
