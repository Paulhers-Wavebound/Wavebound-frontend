import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Clock, Flame, Trophy, Eye, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Video, PhotoCarousel, ContentItem } from '../types/content';
import { useCategoryExpansion } from '../hooks/useCategoryExpansion';
import { ContentPreviewScroll } from './ContentPreviewScroll';
import { ContentExpandedGrid } from './ContentExpandedGrid';
import { INITIAL_ITEMS_PER_CATEGORY } from '../utils/categoryConfig';
import { cn } from '@/lib/utils';

export type CategorySortMode = 'latest' | 'viral' | 'viral-year';
export type CategorySortMetric = 'views' | 'viral-score';

interface CategorySectionProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  videos: Video[];
  photoCarousels?: PhotoCarousel[];
  isContentSelected: (item: ContentItem) => boolean;
  toggleContentSelection: (item: ContentItem) => void;
  handleVideoClick: (video: Video) => void;
  handlePhotoCarouselClick: (carousel: PhotoCarousel) => void;
  sortByViralScore?: boolean;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  id?: string;
  autoExpand?: boolean;
  showReplaceMode?: boolean;
  onReplaceInPlan?: (video: Video, dayIndex: number) => void;
  currentPlanVideos?: Video[];
  selectedForReplace?: Video | null;
  onSelectForReplace?: (video: Video | null) => void;
  videoCount?: number;
  sortMode?: CategorySortMode;
  onSortModeChange?: (mode: CategorySortMode) => void;
  sortMetric?: CategorySortMetric;
  onSortMetricChange?: (metric: CategorySortMetric) => void;
  // AI integration handlers
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
  // Content plan integration
  onAddToPlan?: (video: Video) => void;
  hasPlan?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  subtitle,
  emoji,
  videos,
  photoCarousels = [],
  isContentSelected,
  toggleContentSelection,
  handleVideoClick,
  handlePhotoCarouselClick,
  sortByViralScore = false,
  loading = false,
  hasMore = false,
  onLoadMore,
  id,
  autoExpand = false,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  selectedForReplace,
  onSelectForReplace,
  videoCount,
  sortMode = 'latest',
  onSortModeChange,
  sortMetric = 'views',
  onSortMetricChange,
  onAskAI,
  onShowMoreLikeThis,
  onAddToPlan,
  hasPlan,
}) => {
  const {
    isExpanded,
    visibleItems,
    handleExpand,
    handleShowMore,
    handleCollapse,
    updateVisibleIfReady,
    isLoadingMore
  } = useCategoryExpansion({ autoExpand, title });

  // Combine and sort content
  const allContent = useMemo(() => {
    const combined: ContentItem[] = [...videos, ...photoCarousels];

    if (sortByViralScore) {
      return combined.sort((a, b) => {
        const scoreA = a.outliar_score || 0;
        const scoreB = b.outliar_score || 0;
        return scoreB - scoreA;
      });
    }

    return combined;
  }, [videos, photoCarousels, sortByViralScore]);

  // Update visible items when new content arrives or loading completes
  React.useEffect(() => {
    updateVisibleIfReady(allContent.length, loading);
  }, [allContent.length, loading, updateVisibleIfReady]);

  // Show first INITIAL_ITEMS_PER_CATEGORY items in preview, or more when expanded
  const previewContent = allContent.slice(0, INITIAL_ITEMS_PER_CATEGORY);
  const displayContent = isExpanded ? allContent.slice(0, Math.min(visibleItems, allContent.length)) : previewContent;
  const hasMoreToShow = displayContent.length < allContent.length || hasMore;


  return (
    <motion.div
      id={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative scroll-mt-24 bg-card/80 dark:bg-card/40 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] p-4 md:p-6 lg:p-8"
    >
      {/* Category Section */}
      <div className="space-y-2 md:space-y-4">
        {/* Category Header - matching landing page style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-1 gap-2 md:gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {emoji && (
                <span className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary/15 text-base md:text-lg">
                  {emoji}
                </span>
              )}
              <div className="flex flex-col">
                <h2 className="text-base md:text-2xl font-bold text-foreground tracking-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
                {sortMode === 'viral' && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Sorted by {sortMetric === 'viral-score' ? 'viral score' : 'most views'} · This Week
                  </p>
                )}
                {sortMode === 'viral-year' && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Sorted by {sortMetric === 'viral-score' ? 'viral score' : 'most views'} · This Year
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Sort Toggle */}
          {onSortModeChange && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-transparent shrink-0">
                <button
                  onClick={() => onSortModeChange('latest')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    sortMode === 'latest'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Latest
                </button>
                <button
                  onClick={() => onSortModeChange('viral')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    sortMode === 'viral'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Week
                </button>
                <button
                  onClick={() => onSortModeChange('viral-year')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    sortMode === 'viral-year'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Year
                </button>
              </div>

              {/* Sort Metric Toggle - disabled when Latest is selected */}
              {onSortMetricChange && (
                <div className={cn("shrink-0",
                  "flex items-center bg-muted/50 rounded-lg p-0.5 border border-transparent transition-opacity",
                  sortMode === 'latest' && "opacity-30 pointer-events-none"
                )}>
                  <button
                    onClick={() => onSortMetricChange('views')}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                      sortMetric === 'views'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Views
                  </button>
                  <button
                    onClick={() => onSortMetricChange('viral-score')}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                      sortMetric === 'viral-score'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Viral Score
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="relative">
          {/* Loading skeleton when fetching fresh data */}
          {loading && allContent.length === 0 && (
            <div className="flex gap-3 px-1 py-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[160px] md:w-[200px] space-y-2 animate-pulse"
                >
                  <div className="aspect-[9/16] rounded-xl bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {/* Horizontal Preview Scroll - hide when expanded */}
          {!isExpanded && !loading && (
            <ContentPreviewScroll
              previewContent={previewContent}
              isContentSelected={isContentSelected}
              toggleContentSelection={toggleContentSelection}
              handleVideoClick={handleVideoClick}
              handlePhotoCarouselClick={handlePhotoCarouselClick}
              showPlusCard={previewContent.length > 0 && (allContent.length >= INITIAL_ITEMS_PER_CATEGORY || hasMore)}
              isExpanded={isExpanded}
              onExpand={() => handleExpand(visibleItems, hasMore, allContent.length, onLoadMore)}
              onShowMore={() => handleShowMore(visibleItems, hasMore, allContent.length, onLoadMore)}
              totalCount={allContent.length}
              hasMore={hasMore}
              showReplaceMode={showReplaceMode}
              onReplaceInPlan={onReplaceInPlan}
              currentPlanVideos={currentPlanVideos}
              selectedForReplace={selectedForReplace}
              onSelectForReplace={onSelectForReplace}
              onAskAI={onAskAI}
              onShowMoreLikeThis={onShowMoreLikeThis}
              onAddToPlan={onAddToPlan}
              hasPlan={hasPlan}
            />
          )}

          {/* Expanded Grid */}
          <ContentExpandedGrid
            isExpanded={isExpanded}
            displayContent={displayContent}
            autoExpand={autoExpand}
            isContentSelected={isContentSelected}
            toggleContentSelection={toggleContentSelection}
            handleVideoClick={handleVideoClick}
            handlePhotoCarouselClick={handlePhotoCarouselClick}
            loading={loading}
            showReplaceMode={showReplaceMode}
            onReplaceInPlan={onReplaceInPlan}
            currentPlanVideos={currentPlanVideos}
            selectedForReplace={selectedForReplace}
            onSelectForReplace={onSelectForReplace}
            onAskAI={onAskAI}
            onShowMoreLikeThis={onShowMoreLikeThis}
            onAddToPlan={onAddToPlan}
            hasPlan={hasPlan}
          />

          {/* Collapsed State: Show More button below preview scroll */}
          {!isExpanded && previewContent.length > 0 && (allContent.length > INITIAL_ITEMS_PER_CATEGORY || hasMore) && (
            <div className="px-4 pt-6 pb-2 flex justify-center gap-3 relative z-20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExpand(visibleItems, hasMore, allContent.length, onLoadMore)}
                disabled={loading || isLoadingMore}
                className="text-muted-foreground hover:text-foreground bg-card/80 backdrop-blur-sm hover:bg-muted border-border/40 shadow-sm hover:shadow-md rounded-xl px-6 h-10 transition-all duration-200"
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              >
                {(loading || isLoadingMore) ? (
                  <>
                    <div className="w-3.5 h-3.5 mr-1.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Show More
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Expanded State: Show Less and Show More buttons below grid */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-4 flex justify-center gap-3 relative z-20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCollapse}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3"
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
              >
                Show Less
                <ChevronRight className="w-4 h-4 ml-1 rotate-90" />
              </Button>

              {hasMoreToShow && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShowMore(visibleItems, hasMore, allContent.length, onLoadMore)}
                  disabled={loading || isLoadingMore}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3"
                  style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                >
                  {(loading || isLoadingMore) ? (
                    <>
                      <div className="w-3.5 h-3.5 mr-1.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Show More
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CategorySection;