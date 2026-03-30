import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CategorySortMode, CategorySortMetric } from '@/components/CategorySection';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useContentData } from '@/hooks/useContentData';
import { useCategoryData } from '@/hooks/useCategoryData';
import { useExploreFilters } from '@/hooks/useExploreFilters';
import { Video, PhotoCarousel, ContentItem } from '@/types/content';
import VideoDetailsModal from '@/components/VideoDetailsModal';
import PhotoCarouselModal from '@/components/PhotoCarouselModal';
import { CategorySectionList } from '@/components/CategorySectionList';
import { DiscoverHeroFilters } from './DiscoverHeroFilters';
import { AudioAnalysisResult, RagMatchResult, MatchedVideo } from './SongUploadDialog';
import { MatchedVideosCarousel } from './MatchedVideosCarousel';
import { useDiscover } from '@/contexts/DiscoverContext';
import { useAISidebar } from '@/contexts/AISidebarContext';

import { toast } from 'sonner';
import { getPrimaryGenre } from '@/utils/genreParser';
import { getUserPreferences } from './DiscoverOnboardingModal';
import { getOrderedCategories, ROLE_SEARCH_BOOSTS } from '@/utils/roleCategoryConfig';

export function DiscoverLibrary({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position when returning to Discover
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    try {
      const saved = sessionStorage.getItem('discover_scroll_top');
      if (saved) {
        const top = parseInt(saved, 10);
        if (!isNaN(top)) {
          el.scrollTo({ top, behavior: 'instant' });
        }
      }
    } catch {
      // ignore
    }

    return () => {
      try {
        sessionStorage.setItem('discover_scroll_top', String(el.scrollTop));
      } catch {
        // ignore
      }
    };
  }, []);
  
  const {
    videos,
    photoCarousels,
    loading,
    loadingMore,
    hasMore,
    loadVideos,
    loadPhotoCarousels,
    loadFilteredVideos,
    setVideos,
    setHasMore
  } = useContentData();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySortModes, setCategorySortModes] = useState<Record<string, CategorySortMode>>({});
  const [categorySortMetrics, setCategorySortMetrics] = useState<Record<string, CategorySortMetric>>({});
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPhotoCarousel, setSelectedPhotoCarousel] = useState<PhotoCarousel | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  
  // Read onboarding preferences for category ordering + default genre
  const userPrefs = useMemo(() => getUserPreferences(userId), [userId]);
  const roleCategoryOrder = useMemo(() => getOrderedCategories(userPrefs?.role), [userPrefs?.role]);

  // --- Multi-select genre state ---
  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    const urlGenre = searchParams.get('genre');
    if (urlGenre) return urlGenre.split(',').filter(Boolean);
    // Default to ALL onboarding genres
    if (userPrefs?.genres?.length) return [...userPrefs.genres];
    return [];
  });

  // Sync genre from user prefs when userId becomes available after mount
  const hasAppliedPrefsRef = useRef(false);
  useEffect(() => {
    if (hasAppliedPrefsRef.current) return;
    if (!userPrefs?.genres?.length) return;
    const urlGenre = searchParams.get('genre');
    if (!urlGenre) {
      setSelectedGenres([...userPrefs.genres]);
      hasAppliedPrefsRef.current = true;
    }
  }, [userPrefs]);

  // Sync content styles from user prefs when available after mount
  useEffect(() => {
    if (hasAppliedPrefsRef.current) return;
    if (!userPrefs?.role) return;
    const urlStyle = searchParams.get('style');
    if (!urlStyle) {
      const boosts = ROLE_SEARCH_BOOSTS[userPrefs.role];
      if (boosts?.styles?.length) {
        setSelectedContentStyles([...boosts.styles]);
      }
    }
  }, [userPrefs]);

  // --- Multi-select sub-genre state ---
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>(() => {
    const urlSub = searchParams.get('sub');
    if (urlSub) return urlSub.split(',').filter(Boolean);
    return [];
  });

  // --- Multi-select content style state ---
  const [selectedContentStyles, setSelectedContentStyles] = useState<string[]>(() => {
    const urlStyle = searchParams.get('style');
    if (urlStyle) return urlStyle.split(',').filter(Boolean);
    if (userPrefs?.role) {
      const boosts = ROLE_SEARCH_BOOSTS[userPrefs.role];
      if (boosts?.styles?.length) return [...boosts.styles];
    }
    return [];
  });

  const [selectedViralScore, setSelectedViralScore] = useState<string>(() => searchParams.get('viral') || 'any');
  const [selectedMinViews, setSelectedMinViews] = useState<string>(() => searchParams.get('views') || 'any');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>(() => searchParams.get('quick') || '');
  const [sortBy, setSortBy] = useState<string>(() => searchParams.get('sort') || 'viral');
  
  // Pending search input (what user types) vs committed search query (what actually filters)
  const [pendingSearchInput, setPendingSearchInput] = useState<string>(() => searchParams.get('q') || '');

  // Audio analysis filter state
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysisResult | null>(null);
  const [ragMatchResult, setRagMatchResult] = useState<RagMatchResult | null>(null);
  const [matchedVideos, setMatchedVideos] = useState<Video[]>([]);

  const { toggleFavorite } = useFavorites();
  
  // Get Discover context for AI integration
  const { sendVideoToAI, showMoreLikeThis, filterFromVideo, clearFilterFromVideo, setActiveGenreFilters } = useDiscover();

  // Sync active genre filters to context for AI welcome screen
  useEffect(() => {
    setActiveGenreFilters(selectedGenres);
  }, [selectedGenres, setActiveGenreFilters]);

  useEffect(() => {
    return () => setActiveGenreFilters([]);
  }, [setActiveGenreFilters]);
  
  // Compute initial genre so the very first fetch uses the correct filter
  const initialGenre = useMemo(() => {
    const urlGenre = searchParams.get('genre');
    if (urlGenre) return urlGenre.split(',').filter(Boolean);
    if (userPrefs?.genres?.length) return [...userPrefs.genres];
    return [];
  }, []); // Empty deps: only need the value at mount time

  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    hasFilterChanges,
    availableGenres,
    availableSubGenres,
    availableContentStyles,
    availableGenders,
    filterCategoryVideos,
    filterCategoryPhotoCarousels
  } = useExploreFilters(videos, initialGenre);

  // Restore persisted search query once on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, []);

  // Persist hero filters + search query to the URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    const setOrDelete = (key: string, value: string, emptyValue: string) => {
      if (!value || value === emptyValue) next.delete(key);
      else next.set(key, value);
    };

    // Multi-select: comma-separated
    const genreParam = selectedGenres.length > 0 ? selectedGenres.join(',') : '';
    setOrDelete('genre', genreParam, '');
    const subParam = selectedSubGenres.length > 0 ? selectedSubGenres.join(',') : '';
    setOrDelete('sub', subParam, '');
    const styleParam = selectedContentStyles.length > 0 ? selectedContentStyles.join(',') : '';
    setOrDelete('style', styleParam, '');

    setOrDelete('viral', selectedViralScore, 'any');
    setOrDelete('views', selectedMinViews, 'any');
    setOrDelete('quick', selectedQuickFilter, '');
    setOrDelete('sort', sortBy, 'viral');

    if (searchQuery && searchQuery.trim()) next.set('q', searchQuery.trim());
    else next.delete('q');

    // Save the most recent Discover URL so nav can return you to the same state
    try {
      const qs = next.toString();
      sessionStorage.setItem('discover_last_href', qs ? `/discover?${qs}` : '/discover');
    } catch {
      // ignore
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [selectedGenres, selectedSubGenres, selectedContentStyles, selectedViralScore, selectedMinViews, selectedQuickFilter, sortBy, searchQuery, searchParams, setSearchParams]);

  // Derive names arrays early for use in callbacks
  const availableGenreNames = availableGenres.map(g => g.genre);
  const availableSubGenreNames = availableSubGenres.map(sg => sg.subGenre);
  const availableContentStyleNames = availableContentStyles.map(s => s.style);

  const {
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
    loading: categoryLoading,
    loadInitialData
  } = useCategoryData(filters.genre, filters.platform || [], filters.contentStyle || [], searchQuery, filters.subGenre || [], categorySortModes, categorySortMetrics);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadVideos(),
        loadPhotoCarousels()
      ]);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    loadAll();
  }, []);

  // Handle category filter changes
  useEffect(() => {
    if (selectedCategory) {
      const styleMap: { [key: string]: string } = {
        'viral': '',
        'hook': 'hook-statement',
        'selfie': 'selfie-performance',
        'trending': ''
      };
      const categoryId = styleMap[selectedCategory];
      if (categoryId) {
        setExpandedCategoryId(categoryId);
      }
    } else {
      setExpandedCategoryId(null);
    }
  }, [selectedCategory]);

  // Sync local multi-select state to pendingFilters (NOT active filters) so toggles don't trigger reloads
  useEffect(() => {
    setPendingFilters(prev => ({
      ...prev,
      genre: selectedGenres,
      subGenre: selectedSubGenres,
      contentStyle: selectedContentStyles,
    }));
  }, [selectedGenres, selectedSubGenres, selectedContentStyles, setPendingFilters]);

  // Apply quick filter to content style
  useEffect(() => {
    if (selectedQuickFilter) {
      const styleMap: { [key: string]: string } = {
        'Trending Now': '',
        'Hook Statements': 'Hook Statement',
        'Selfie Performance': 'Selfie Performance',
        'Covers': 'Cover',
        'Lipsync': 'Lipsync',
        'Live Performance': 'Live Performance',
      };
      const style = styleMap[selectedQuickFilter];
      if (style) {
        setSelectedContentStyles([style]);
      } else {
        setSelectedContentStyles([]);
      }
    }
  }, [selectedQuickFilter]);

  // Handle audio analysis completion - apply genre filter and show matched videos
  const handleAudioAnalysisComplete = useCallback((analysis: AudioAnalysisResult, ragResult?: RagMatchResult) => {
    setAudioAnalysis(analysis);
    
    // Store RAG results for the matched carousel
    if (ragResult) {
      setRagMatchResult(ragResult);
      const matchedVids: Video[] = ragResult.topMatches.map(m => ({
        id: m.id,
        video_url: m.video_url,
        embedded_ulr: m.embedded_ulr,
        video_views: m.video_views,
        video_likes: m.video_likes,
        outliar_score: m.outliar_score,
        viral_score: m.viral_score,
        caption: m.caption,
        date_posted: m.date_posted,
        genre: m.genre,
        sub_genre: m.sub_genre,
        content_style: m.content_style,
        hook: m.hook,
        thumbnail_url: m.thumbnail_url,
        is_reel: m.is_reel,
        comments: '',
        profile_followers: 0,
        matchScore: m.matchScore,
        matchReason: m.matchReason,
      } as Video & { matchScore: number; matchReason: string }));
      setMatchedVideos(matchedVids);
    }
    
    // Try to match the analyzed genre with available genres
    if (analysis.genre) {
      const genreLower = analysis.genre.toLowerCase();
      const matchedGenre = availableGenres.find(g => 
        g.genre.toLowerCase().includes(genreLower) || 
        genreLower.includes(g.genre.toLowerCase())
      );
      
      if (matchedGenre) {
        setSelectedGenres([matchedGenre.genre]);
      } else {
        setSearchQuery(analysis.genre);
        setPendingSearchInput(analysis.genre);
      }
    }
    
    applyFilters();
  }, [availableGenres, setSearchQuery, applyFilters]);

  // Clear audio filter
  const handleClearAudioFilter = useCallback(() => {
    setAudioAnalysis(null);
    setRagMatchResult(null);
    setMatchedVideos([]);
    setSelectedGenres([]);
    setSelectedSubGenres([]);
    setSearchQuery('');
    setPendingSearchInput('');
    applyFilters();
  }, [setSearchQuery, applyFilters]);

  const isContentSelected = useCallback((content: ContentItem) => {
    return selectedContent.some(item => item.id === content.id && 
      ('video_url' in item) === ('video_url' in content));
  }, [selectedContent]);

  const toggleContentSelection = useCallback((content: ContentItem) => {
    setSelectedContent(prev => {
      const isSelected = prev.some(item => item.id === content.id && 
        ('video_url' in item) === ('video_url' in content));
      
      if (isSelected) {
        return prev.filter(item => !(item.id === content.id && 
          ('video_url' in item) === ('video_url' in content)));
      } else {
        if (prev.length >= 7) return prev;
        return [...prev, content];
      }
    });
  }, []);

  const handleVideoClick = useCallback((video: Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  }, []);

  const handlePhotoCarouselClick = useCallback((carousel: PhotoCarousel) => {
    const url = carousel.embedded_url || carousel.photo_url_1;
    const postIdMatch = url?.match(/\/(?:video|photo)\/(\d+)/);
    const postId = postIdMatch?.[1];

    const carouselAsVideo: Video = {
      id: carousel.id,
      video_url: carousel.embedded_url || '',
      embedded_ulr: carousel.embedded_url,
      outliar_score: carousel.outliar_score || 0,
      video_views: carousel.photo_views || 0,
      video_likes: carousel.photo_likes || 0,
      comments: carousel.comments || '',
      profile_followers: carousel.profile_followers || 0,
      caption: carousel.caption,
      hook: carousel.Hook,
      genre: carousel.genre,
      content_style: carousel.content_style,
      gender: carousel.gender,
      date_posted: carousel.date_posted,
      gif_url: carousel.photo_url_1,
      thumbnail_url: carousel.photo_url_1,
      video_file_url: postId ? `https://www.tiktok.com/player/v1/${postId}` : undefined,
      isPhotoCarousel: true,
    };
    
    setSelectedVideo(carouselAsVideo);
    setIsVideoModalOpen(true);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchQuery(pendingSearchInput);
    applyFilters(); // pendingFilters already has genres/styles via the useEffect sync
  }, [applyFilters, pendingSearchInput, setSearchQuery]);

  // Auto-apply when a chip is removed (pendingFilters already updated via useEffect)
  const handleApplyFilters = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const handleReset = useCallback(() => {
    const emptyFilters = {
      genre: [] as string[], subGenre: [] as string[], contentStyle: [] as string[],
      performanceRange: 'all', followerRange: 'all', effort: 'all',
      gender: [] as string[], platform: [] as string[], excludeGenre: [] as string[], excludeContentStyle: [] as string[],
    };
    setPendingSearchInput('');
    setSearchQuery('');
    setSelectedGenres([]);
    setSelectedSubGenres([]);
    setSelectedContentStyles([]);
    setSelectedViralScore('any');
    setSelectedMinViews('any');
    setSelectedQuickFilter('');
    setSortBy('viral');
    setAudioAnalysis(null);
    setRagMatchResult(null);
    setMatchedVideos([]);
    setPendingFilters(emptyFilters);
    setFilters(emptyFilters);
    // Clear URL params to match fresh state
    setSearchParams(new URLSearchParams(), { replace: true });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [setSearchQuery, setFilters, setPendingFilters, setSearchParams]);

  // Handle "Ask AI" action
  const { openSidebar } = useAISidebar();
  const handleAskAI = useCallback((video: Video) => {
    sendVideoToAI(video);
    openSidebar();
  }, [sendVideoToAI, openSidebar]);

  // Handle "Show More Like This" action
  const handleShowMoreLikeThis = useCallback((video: Video) => {
    let appliedGenre = '';
    let appliedStyle = '';
    
    if (video.genre) {
      const primaryGenre = getPrimaryGenre(video.genre);
      if (primaryGenre) {
        const matchedGenre = availableGenreNames.find(
          g => g.toLowerCase() === primaryGenre.toLowerCase()
        );
        if (matchedGenre) {
          setSelectedGenres([matchedGenre]);
          appliedGenre = matchedGenre;
        }
      }
    }
    
    if (video.content_style) {
      let styleToSet = video.content_style;
      try {
        const parsed = JSON.parse(video.content_style);
        if (Array.isArray(parsed) && parsed.length > 0) {
          styleToSet = String(parsed[0]).trim();
        }
      } catch {
        styleToSet = video.content_style.split(',')[0].replace(/[\[\]"]/g, '').trim();
      }
      
      if (styleToSet) {
        const matchedStyle = availableContentStyleNames.find(
          s => s.toLowerCase() === styleToSet.toLowerCase()
        );
        if (matchedStyle) {
          setSelectedContentStyles([matchedStyle]);
          appliedStyle = matchedStyle;
        }
      }
    }
    
    if (appliedGenre || appliedStyle) {
      const description = [appliedGenre, appliedStyle].filter(Boolean).join(' · ');
      toast.success('Filters applied', {
        description: `Showing more ${description} content`,
      });
    } else {
      toast.info('No matching filters', {
        description: 'This video doesn\'t have recognized genre/style attributes',
      });
    }
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [availableGenreNames, availableContentStyleNames]);

  // React to filterFromVideo changes from context
  useEffect(() => {
    if (filterFromVideo) {
      handleShowMoreLikeThis(filterFromVideo);
      clearFilterFromVideo();
    }
  }, [filterFromVideo, handleShowMoreLikeThis, clearFilterFromVideo]);

  // Calculate results count
  const resultsCount = (viralRightNowVideos?.videos?.length || 0) + 
    (hookStatementVideos?.videos?.length || 0) + 
    (selfiePerformanceVideos?.videos?.length || 0) + 
    (coverVideos?.videos?.length || 0) + 
    (livePerformanceVideos?.videos?.length || 0);

  const isInitialLoading = loading || categoryLoading;

  // Full-page loading screen until data is ready
  if (isInitialLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">Loading your feed...</p>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} data-discover-scroll className="h-full flex flex-col overflow-y-auto">
      {/* Hero Filters Section */}
      <DiscoverHeroFilters
        searchQuery={pendingSearchInput}
        onSearchChange={setPendingSearchInput}
        onSearch={handleSearch}
        onReset={handleReset}
        onApply={handleApplyFilters}
        selectedGenres={selectedGenres}
        onGenresChange={setSelectedGenres}
        selectedSubGenres={selectedSubGenres}
        onSubGenresChange={setSelectedSubGenres}
        selectedContentStyles={selectedContentStyles}
        onContentStylesChange={setSelectedContentStyles}
        selectedViralScore={selectedViralScore}
        onViralScoreChange={setSelectedViralScore}
        selectedMinViews={selectedMinViews}
        onMinViewsChange={setSelectedMinViews}
        selectedQuickFilter={selectedQuickFilter}
        onQuickFilterChange={setSelectedQuickFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultsCount={resultsCount}
        availableGenres={availableGenreNames}
        availableSubGenres={availableSubGenreNames}
        availableContentStyles={availableContentStyleNames}
        audioAnalysis={audioAnalysis}
        onAudioAnalysisComplete={handleAudioAnalysisComplete}
        onClearAudioFilter={handleClearAudioFilter}
      />

      {/* Matched Videos Carousel - Shows when song is uploaded */}
      {audioAnalysis && matchedVideos.length > 0 && (
        <MatchedVideosCarousel
          videos={matchedVideos}
          audioAnalysis={audioAnalysis}
          onVideoClick={handleVideoClick}
          isContentSelected={isContentSelected}
          toggleContentSelection={toggleContentSelection}
          onClear={handleClearAudioFilter}
        />
      )}

      {/* Category Sections */}
      <section className="flex-1 px-3 md:px-6 py-6 md:py-10 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto">
          {false ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <CategorySectionList
              viralRightNowVideos={viralRightNowVideos}
              viralRightNowReels={viralRightNowReels}
              viralPhotoCarousels={viralPhotoCarousels}
              hookStatementVideos={hookStatementVideos}
              selfiePerformanceVideos={selfiePerformanceVideos}
              selfieLipsyncVideos={selfieLipsyncVideos}
              fastPaceVideos={fastPaceVideos}
              lyricVideoVideos={lyricVideoVideos}
              proCameraLipsyncVideos={proCameraLipsyncVideos}
              livePerformanceVideos={livePerformanceVideos}
              coverVideos={coverVideos}
              memeVideos={memeVideos}
              transitionVideos={transitionVideos}
              productionVideos={productionVideos}
              compilationVisualsVideos={compilationVisualsVideos}
              cinematicEditVideos={cinematicEditVideos}
              instrumentPerformanceVideos={instrumentPerformanceVideos}
              expandedCategoryId={expandedCategoryId}
              isContentSelected={isContentSelected}
              toggleContentSelection={toggleContentSelection}
              handleVideoClick={handleVideoClick}
              handlePhotoCarouselClick={handlePhotoCarouselClick}
              filterCategoryVideos={filterCategoryVideos}
              filterCategoryPhotoCarousels={filterCategoryPhotoCarousels}
              activeContentStyleFilter={filters.contentStyle}
              categoryOrder={roleCategoryOrder ?? undefined}
              sortModes={categorySortModes}
               onSortModeChange={(categoryId, mode) => setCategorySortModes(prev => ({ ...prev, [categoryId]: mode }))}
               sortMetrics={categorySortMetrics}
               onSortMetricChange={(categoryId, metric) => setCategorySortMetrics(prev => ({ ...prev, [categoryId]: metric }))}
               onAskAI={handleAskAI}
               onShowMoreLikeThis={handleShowMoreLikeThis}
               hasOnboardingPrefs={false}
             />
          )}
        </div>
      </section>

      {/* Video Details Modal */}
      <VideoDetailsModal
        video={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        isSelected={selectedVideo ? isContentSelected(selectedVideo) : false}
        onToggleSelect={selectedVideo ? () => toggleContentSelection(selectedVideo) : undefined}
      />

      <PhotoCarouselModal
        photoCarousel={selectedPhotoCarousel}
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        isSelected={selectedPhotoCarousel ? isContentSelected(selectedPhotoCarousel) : false}
        onToggleSelect={selectedPhotoCarousel ? () => toggleContentSelection(selectedPhotoCarousel) : undefined}
      />

      
    </div>
  );
}
