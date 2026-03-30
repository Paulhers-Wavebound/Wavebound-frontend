import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import CategorySection, { CategorySortMode, CategorySortMetric } from './CategorySection';
import { Video, PhotoCarousel, ContentItem } from '../types/content';
import { Loader2, ChevronDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INITIAL_CATEGORIES_TO_SHOW = 6;
const CATEGORIES_PER_LOAD = 3;

interface CategoryData {
  videos: Video[];
  photoCarousels: PhotoCarousel[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

interface CategorySectionListProps {
  viralRightNowVideos: CategoryData;
  viralRightNowReels: CategoryData;
  viralPhotoCarousels: CategoryData;
  hookStatementVideos: CategoryData;
  selfiePerformanceVideos: CategoryData;
  selfieLipsyncVideos: CategoryData;
  fastPaceVideos: CategoryData;
  lyricVideoVideos: CategoryData;
  proCameraLipsyncVideos: CategoryData;
  livePerformanceVideos: CategoryData;
  coverVideos: CategoryData;
  memeVideos: CategoryData;
  transitionVideos: CategoryData;
  productionVideos: CategoryData;
  compilationVisualsVideos: CategoryData;
  cinematicEditVideos: CategoryData;
  instrumentPerformanceVideos: CategoryData;
  expandedCategoryId: string | null;
  isContentSelected: (content: ContentItem) => boolean;
  toggleContentSelection: (content: ContentItem) => void;
  handleVideoClick: (video: Video) => void;
  handlePhotoCarouselClick: (carousel: PhotoCarousel) => void;
  filterCategoryVideos: (items: Video[], query?: string, skipContentStyleFilter?: boolean) => Video[];
  filterCategoryPhotoCarousels: (items: PhotoCarousel[]) => PhotoCarousel[];
  showReplaceMode?: boolean;
  onReplaceInPlan?: (video: Video, dayIndex: number) => void;
  currentPlanVideos?: Video[];
  selectedForReplace?: Video | null;
  onSelectForReplace?: (video: Video | null) => void;
  activeContentStyleFilter?: string[];
  // Role-based category ordering from onboarding preferences
  categoryOrder?: string[];
  // Sort modes lifted from parent
  sortModes: Record<string, CategorySortMode>;
  onSortModeChange: (categoryId: string, mode: CategorySortMode) => void;
  sortMetrics?: Record<string, CategorySortMetric>;
  onSortMetricChange?: (categoryId: string, metric: CategorySortMetric) => void;
  // New: AI integration handlers
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
  // New: Content plan integration
  onAddToPlan?: (video: Video) => void;
  hasPlan?: boolean;
  // Hide viral sections when user has onboarding preferences active
  hasOnboardingPrefs?: boolean;
}

// Videos are now sorted at the DB level; this just ensures consistent client-side ordering
const sortVideosByMode = (videos: Video[], mode: CategorySortMode, metric: CategorySortMetric = 'views'): Video[] => {
  if (mode === 'viral' || mode === 'viral-year') {
    if (metric === 'viral-score') {
      return [...videos].sort((a, b) => (b.outliar_score || 0) - (a.outliar_score || 0));
    }
    // DB already filtered by date range and sorted by views; just ensure sort order
    return [...videos].sort((a, b) => (b.video_views || 0) - (a.video_views || 0));
  } else {
    // Latest - sort by date
    return [...videos].sort((a, b) => {
      const dateA = a.date_posted ? new Date(a.date_posted).getTime() : 0;
      const dateB = b.date_posted ? new Date(b.date_posted).getTime() : 0;
      return dateB - dateA;
    });
  }
};

export const CategorySectionList: React.FC<CategorySectionListProps> = ({
  viralRightNowVideos,
  viralRightNowReels,
  viralPhotoCarousels,
  hookStatementVideos,
  selfiePerformanceVideos,
  selfieLipsyncVideos,
  fastPaceVideos,
  lyricVideoVideos,
  proCameraLipsyncVideos,
  livePerformanceVideos,
  coverVideos,
  memeVideos,
  transitionVideos,
  productionVideos,
  compilationVisualsVideos,
  cinematicEditVideos,
  instrumentPerformanceVideos,
  expandedCategoryId,
  isContentSelected,
  toggleContentSelection,
  handleVideoClick,
  handlePhotoCarouselClick,
  filterCategoryVideos,
  filterCategoryPhotoCarousels,
  showReplaceMode = false,
  onReplaceInPlan,
  currentPlanVideos = [],
  selectedForReplace,
  onSelectForReplace,
  activeContentStyleFilter = [],
  categoryOrder: roleCategoryOrder,
  sortModes,
  onSortModeChange: handleSortModeChange,
  sortMetrics = {},
  onSortMetricChange: handleSortMetricChange,
  onAskAI,
  onShowMoreLikeThis,
  onAddToPlan,
  hasPlan,
  hasOnboardingPrefs = false,
}) => {
  // Track how many categories to show (lazy loading)
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(INITIAL_CATEGORIES_TO_SHOW);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Define category order based on total database counts (TikTok + Reels combined)
  // Define category order based on total database counts (TikTok + Reels combined)
  // This order is based on actual content_style counts from database
  const categoryOrder = React.useMemo(() => {
    const baseOrder = [
      { id: 'hook-statement', title: 'Hook Statement', emoji: '⚡️', data: hookStatementVideos, dbCount: 132 },
      { id: 'pro-camera-lipsync', title: 'Pro Camera Lipsync', emoji: '📹', data: proCameraLipsyncVideos, dbCount: 98 },
      { id: 'selfie-performance', title: 'Selfie Performance', emoji: '🤳', data: selfiePerformanceVideos, dbCount: 90 },
      { id: 'live-performance', title: 'Live Performance', emoji: '🎤', data: livePerformanceVideos, dbCount: 80 },
      { id: 'cinematic-edit', title: 'Cinematic Edit', emoji: '🎥', data: cinematicEditVideos, dbCount: 66 },
      { id: 'compilation-visuals', title: 'Compilation Visuals', emoji: '🎞️', data: compilationVisualsVideos, dbCount: 56 },
      { id: 'meme', title: 'Meme', emoji: '😂', data: memeVideos, dbCount: 37 },
      { id: 'selfie-lipsync', title: 'Selfie Lipsync', emoji: undefined, data: selfieLipsyncVideos, dbCount: 35 },
      { id: 'instrument-performance', title: 'Instrument Performance', emoji: '🎹', data: instrumentPerformanceVideos, dbCount: 29 },
      { id: 'cover', title: 'Cover', emoji: '🎸', data: coverVideos, dbCount: 18 },
      { id: 'lyric-video', title: 'Lyric Video', emoji: '🎵', data: lyricVideoVideos, dbCount: 9 },
      { id: 'fast-pace-performance', title: 'Fast Pace Performance', emoji: undefined, data: fastPaceVideos, dbCount: 0 },
      { id: 'transition', title: 'Transition', emoji: '🔄', data: transitionVideos, dbCount: 0 },
      { id: 'production', title: 'Production', emoji: '🎬', data: productionVideos, dbCount: 0 },
    ];

    // Helper to check if category matches any active content style filter
    const categoryMatchesFilter = (categoryTitle: string) => {
      if (activeContentStyleFilter.length === 0) return false;
      return activeContentStyleFilter.some(filter => 
        categoryTitle.toLowerCase() === filter.toLowerCase()
      );
    };

    // When a content style filter is active, sort by filtered count (existing behavior)
    // When roleCategoryOrder is provided and no content style filter, apply role-based priority
    if (activeContentStyleFilter.length > 0) {
      return [...baseOrder].sort((a, b) => {
        const aSkipStyleFilter = categoryMatchesFilter(a.title);
        const bSkipStyleFilter = categoryMatchesFilter(b.title);
        const aCount = filterCategoryVideos(a.data.videos, undefined, aSkipStyleFilter).length;
        const bCount = filterCategoryVideos(b.data.videos, undefined, bSkipStyleFilter).length;
        if (aSkipStyleFilter && !bSkipStyleFilter) return -1;
        if (!aSkipStyleFilter && bSkipStyleFilter) return 1;
        if (bCount !== aCount) return bCount - aCount;
        return b.dbCount - a.dbCount;
      });
    }

    if (roleCategoryOrder && roleCategoryOrder.length > 0) {
      return [...baseOrder].sort((a, b) => {
        const aIdx = roleCategoryOrder.indexOf(a.id);
        const bIdx = roleCategoryOrder.indexOf(b.id);
        // Both in priority list → sort by priority index
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        // Only one in priority list → it comes first
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        // Neither → fall back to count-based
        const aCount = filterCategoryVideos(a.data.videos).length;
        const bCount = filterCategoryVideos(b.data.videos).length;
        if (bCount !== aCount) return bCount - aCount;
        return b.dbCount - a.dbCount;
      });
    }

    // Default: sort by filtered count
    return [...baseOrder].sort((a, b) => {
      const aCount = filterCategoryVideos(a.data.videos).length;
      const bCount = filterCategoryVideos(b.data.videos).length;
      if (bCount !== aCount) return bCount - aCount;
      return b.dbCount - a.dbCount;
    });
  }, [
    hookStatementVideos.videos,
    selfiePerformanceVideos.videos,
    selfieLipsyncVideos.videos,
    fastPaceVideos.videos,
    lyricVideoVideos.videos,
    proCameraLipsyncVideos.videos,
    livePerformanceVideos.videos,
    coverVideos.videos,
    memeVideos.videos,
    transitionVideos.videos,
    productionVideos.videos,
    compilationVisualsVideos.videos,
    cinematicEditVideos.videos,
    instrumentPerformanceVideos.videos,
    filterCategoryVideos,
    activeContentStyleFilter,
    roleCategoryOrder
  ]);

  // Filter categories - when a content style filter is active, show matching category + cross-tagged
  const filteredCategories = useMemo(() => {
    return categoryOrder.filter(category => {
      // Check if this category's title matches the active filter (primary match)
      const isPrimaryMatch = activeContentStyleFilter.some(filter => 
        category.title.toLowerCase() === filter.toLowerCase()
      );
      
      // Skip content style filter for primary matching categories
      const skipStyleFilter = isPrimaryMatch;
      
      // Get video count: for primary categories skip style filter, for others apply it (to find cross-tagged)
      const videoCount = filterCategoryVideos(category.data.videos, undefined, skipStyleFilter).length;
      
      // When filter is active, show primary categories AND other categories with cross-tagged videos
      if (activeContentStyleFilter.length > 0) {
        if (isPrimaryMatch) {
          return videoCount > 0 || category.data.loading;
        }
        // Show non-primary categories if they have cross-tagged videos
        return videoCount > 0;
      }
      
      return videoCount > 0 || category.data.loading;
    });
  }, [categoryOrder, filterCategoryVideos, activeContentStyleFilter]);
  
  // Categories to actually render (lazy loaded)
  const visibleCategories = useMemo(() => {
    return filteredCategories.slice(0, visibleCategoryCount);
  }, [filteredCategories, visibleCategoryCount]);
  
  const hasMoreCategories = visibleCategoryCount < filteredCategories.length;
  const remainingCount = filteredCategories.length - visibleCategoryCount;

  const handleLoadMoreCategories = useCallback(() => {
    setVisibleCategoryCount(prev => Math.min(prev + CATEGORIES_PER_LOAD, filteredCategories.length));
  }, [filteredCategories.length]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Viral Right Now TikTok - only show when no onboarding prefs and no content style filter */}
      {viralRightNowVideos.videos.length > 0 && activeContentStyleFilter.length === 0 && !hasOnboardingPrefs && (
        <CategorySection
          title="Viral Right Now TikTok"
          emoji="🔥"
          videos={sortVideosByMode(filterCategoryVideos(viralRightNowVideos.videos), sortModes['viral-tiktok'] || 'latest', sortMetrics['viral-tiktok'] || 'views')}
          photoCarousels={[]}
          isContentSelected={isContentSelected}
          toggleContentSelection={toggleContentSelection}
          handleVideoClick={handleVideoClick}
          handlePhotoCarouselClick={handlePhotoCarouselClick}
          loading={viralRightNowVideos.loading}
          hasMore={viralRightNowVideos.hasMore}
          onLoadMore={viralRightNowVideos.loadMore}
          sortMode={sortModes['viral-tiktok'] || 'latest'}
          onSortModeChange={(mode) => handleSortModeChange('viral-tiktok', mode)}
          sortMetric={sortMetrics['viral-tiktok'] || 'views'}
          onSortMetricChange={handleSortMetricChange ? (metric) => handleSortMetricChange('viral-tiktok', metric) : undefined}
          onAskAI={onAskAI}
          onShowMoreLikeThis={onShowMoreLikeThis}
        />
      )}

      {/* Viral Right Now Reels - only show when no onboarding prefs and no content style filter */}
      {viralRightNowReels.videos.length > 0 && activeContentStyleFilter.length === 0 && !hasOnboardingPrefs && (
        <CategorySection
          title="Viral Right Now Reels"
          emoji="📱"
          videos={sortVideosByMode(filterCategoryVideos(viralRightNowReels.videos), sortModes['viral-reels'] || 'latest', sortMetrics['viral-reels'] || 'views')}
          photoCarousels={[]}
          isContentSelected={isContentSelected}
          toggleContentSelection={toggleContentSelection}
          handleVideoClick={handleVideoClick}
          handlePhotoCarouselClick={handlePhotoCarouselClick}
          loading={viralRightNowReels.loading}
          hasMore={viralRightNowReels.hasMore}
          onLoadMore={viralRightNowReels.loadMore}
          sortMode={sortModes['viral-reels'] || 'latest'}
          onSortModeChange={(mode) => handleSortModeChange('viral-reels', mode)}
          sortMetric={sortMetrics['viral-reels'] || 'views'}
          onSortMetricChange={handleSortMetricChange ? (metric) => handleSortMetricChange('viral-reels', metric) : undefined}
          onAskAI={onAskAI}
          onShowMoreLikeThis={onShowMoreLikeThis}
        />
      )}

      {/* Dynamically sorted categories (lazy loaded) */}
      {visibleCategories.map((category, index) => {
        const rank = index + 1;
        const currentSortMode = sortModes[category.id] || 'latest';
        
        // Skip content style filter for categories that match the active filter
        const skipStyleFilter = activeContentStyleFilter.some(filter => 
          category.title.toLowerCase() === filter.toLowerCase()
        );

        return (
          <React.Fragment key={category.id}>
            <div id={`category-${category.id}`}>
            <CategorySection
              id={category.id}
              title={category.title}
              emoji={category.emoji}
              videos={sortVideosByMode(filterCategoryVideos(category.data.videos, undefined, skipStyleFilter), currentSortMode, sortMetrics[category.id] || 'views')}
              photoCarousels={[]}
              isContentSelected={isContentSelected}
              toggleContentSelection={toggleContentSelection}
              handleVideoClick={handleVideoClick}
              handlePhotoCarouselClick={handlePhotoCarouselClick}
              loading={category.data.loading}
              hasMore={category.data.hasMore}
              onLoadMore={category.data.loadMore}
              autoExpand={expandedCategoryId === category.id}
              showReplaceMode={showReplaceMode}
              onReplaceInPlan={onReplaceInPlan}
              currentPlanVideos={currentPlanVideos}
              selectedForReplace={selectedForReplace}
              onSelectForReplace={onSelectForReplace}
              videoCount={rank}
              sortMode={currentSortMode}
              onSortModeChange={(mode) => handleSortModeChange(category.id, mode)}
              sortMetric={sortMetrics[category.id] || 'views'}
              onSortMetricChange={handleSortMetricChange ? (metric) => handleSortMetricChange(category.id, metric) : undefined}
              onAskAI={onAskAI}
              onShowMoreLikeThis={onShowMoreLikeThis}
              onAddToPlan={onAddToPlan}
              hasPlan={hasPlan}
            />
            </div>

            {/* Viral Photo Carousels - placed after first two categories */}
            {index === 1 && viralPhotoCarousels.photoCarousels.length > 0 && (
              <CategorySection
                title="Viral Picture Carousels"
                subtitle="These are super efficient to make and usually performs better than videos on avg"
                emoji="🔥📸"
                videos={[]}
                photoCarousels={filterCategoryPhotoCarousels(viralPhotoCarousels.photoCarousels)}
                isContentSelected={isContentSelected}
                toggleContentSelection={toggleContentSelection}
                handleVideoClick={handleVideoClick}
                handlePhotoCarouselClick={handlePhotoCarouselClick}
                sortByViralScore={true}
                loading={viralPhotoCarousels.loading}
                hasMore={viralPhotoCarousels.hasMore}
                onLoadMore={viralPhotoCarousels.loadMore}
                onAskAI={onAskAI}
                onShowMoreLikeThis={onShowMoreLikeThis}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Viral Photo Carousels - if we have < 2 categories, still show it after them */}
      {visibleCategories.length < 2 && viralPhotoCarousels.photoCarousels.length > 0 && (
        <CategorySection
          title="Viral Picture Carousels"
          subtitle="These are super efficient to make and usually performs better than videos on avg"
          emoji="🔥📸"
          videos={[]}
          photoCarousels={filterCategoryPhotoCarousels(viralPhotoCarousels.photoCarousels)}
          isContentSelected={isContentSelected}
          toggleContentSelection={toggleContentSelection}
          handleVideoClick={handleVideoClick}
          handlePhotoCarouselClick={handlePhotoCarouselClick}
          sortByViralScore={true}
          loading={viralPhotoCarousels.loading}
          hasMore={viralPhotoCarousels.hasMore}
          onLoadMore={viralPhotoCarousels.loadMore}
          onAskAI={onAskAI}
          onShowMoreLikeThis={onShowMoreLikeThis}
        />
      )}


      {/* Discover More Content Styles button */}
      {hasMoreCategories && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMoreCategories}
            className="gap-2.5 px-8 h-12 text-base font-medium border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Layers className="w-4.5 h-4.5" />
            Discover More Content Styles
            <span className="text-muted-foreground text-sm font-normal">
              ({remainingCount} more)
            </span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

    </div>
  );
};
