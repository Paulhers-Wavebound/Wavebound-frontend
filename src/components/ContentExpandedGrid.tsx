import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from './VideoCard';
import PhotoCarouselCard from './PhotoCarouselCard';
import InstagramReelCard from './InstagramReelCard';
import { ContentItem, Video, PhotoCarousel } from '../types/content';
import { INITIAL_ITEMS_PER_CATEGORY } from '../utils/categoryConfig';

interface ContentExpandedGridProps {
  isExpanded: boolean;
  displayContent: ContentItem[];
  autoExpand: boolean;
  isContentSelected: (item: ContentItem) => boolean;
  toggleContentSelection: (item: ContentItem) => void;
  handleVideoClick: (video: Video) => void;
  handlePhotoCarouselClick: (carousel: PhotoCarousel) => void;
  loading: boolean;
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

export const ContentExpandedGrid: React.FC<ContentExpandedGridProps> = ({
  isExpanded,
  displayContent,
  autoExpand,
  isContentSelected,
  toggleContentSelection,
  handleVideoClick,
  handlePhotoCarouselClick,
  loading,
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
  // Track the number of items that were already rendered so we only animate new ones
  const prevCountRef = useRef(0);
  const prevCount = prevCountRef.current;
  // Update ref after render
  React.useEffect(() => {
    prevCountRef.current = displayContent.length;
  }, [displayContent.length]);

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="px-4 pb-2"
        >
          <div className="border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {displayContent.map((item, index) => {
                const uniqueKey = 'video_url' in item ? `video-${item.id}` : `carousel-${item.id}`;
                const isNew = index >= prevCount;
                
                if ('video_url' in item) {
                  const isInstagramReel = item.embedded_ulr?.includes('instagram.com/reel') || 
                                         item.embedded_ulr?.includes('instagram.com/p/') ||
                                         item.video_url?.includes('instagram.com/reel') ||
                                         item.video_url?.includes('instagram.com/p/');
                  
                  if (isInstagramReel) {
                    return (
                      <motion.div 
                        key={uniqueKey} 
                        className="relative w-full"
                        initial={isNew ? { opacity: 0, y: 8 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      >
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
                      </motion.div>
                    );
                  }
                  
                  return (
                    <motion.div 
                      key={uniqueKey} 
                      className="relative w-full"
                      initial={isNew ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <VideoCard
                        video={item}
                        isSelected={isContentSelected(item)}
                        onToggleSelect={() => toggleContentSelection(item)}
                        onVideoClick={() => handleVideoClick(item)}
                        viewMode="grid"
                        allContent={displayContent}
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
                    </motion.div>
                  );
                } else {
                  return (
                    <motion.div 
                      key={uniqueKey} 
                      className="relative w-full"
                      initial={isNew ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <PhotoCarouselCard
                        photoCarousel={item}
                        isSelected={isContentSelected(item)}
                        onToggleSelect={() => toggleContentSelection(item)}
                        onClick={() => handlePhotoCarouselClick(item)}
                        onAskAI={onAskAI as any}
                        onShowMoreLikeThis={onShowMoreLikeThis as any}
                        onAddToPlan={onAddToPlan ? () => onAddToPlan(item as any) : undefined}
                        hasPlan={hasPlan}
                      />
                    </motion.div>
                  );
                }
              })}
            </div>
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Loading more...
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
