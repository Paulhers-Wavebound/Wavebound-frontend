import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Filter, X, Star, FileText, Music, Video as VideoIcon, Grid3x3 } from 'lucide-react';
import { QuickNavFab } from '../components/QuickNavFab';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import VideoDetailsModal from '../components/VideoDetailsModal';
import PhotoCarouselModal from '../components/PhotoCarouselModal';
import InstagramReelCard from '../components/InstagramReelCard';
import HeaderAuth from '../components/HeaderAuth';
import FooterSection from '../components/FooterSection';
import LoadingStates from '../components/LoadingStates';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBoundary from '../components/ErrorBoundary';
import HeroGuide from '../components/HeroGuide';
import FilterPanel from '../components/FilterPanel';
import { CategorySectionList } from '../components/CategorySectionList';
import SEOHead from '../components/SEOHead';

import { WorkspaceNotesEditor } from '../components/WorkspaceNotesEditor';
import { toast } from '../hooks/use-toast';
import { useFavorites } from '../hooks/useFavorites';
import { getGenreColor, getContentCategoryColor } from '../utils/tagColors';
import { useContentData } from '../hooks/useContentData';
import { useReelsData } from '../hooks/useReelsData';
import { useCategoryData } from '../hooks/useCategoryData';
import { useExploreFilters } from '../hooks/useExploreFilters';
import { Video, PhotoCarousel, ContentItem } from '../types/content';
import { supabase } from '../integrations/supabase/client';

const Explore = () => {
  // Component rendering
  const queryClient = useQueryClient();
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

  // Use separate hook for reels to bypass cache
  const { reels, loadReels } = useReelsData();

  // Prefetch workspace data for instant navigation
  useEffect(() => {
    const prefetchWorkspaceData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Prefetch workspace notes
        await queryClient.prefetchQuery({
          queryKey: ['workspace-notes', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('workspace_notes')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            return data;
          },
          staleTime: 10 * 60 * 1000,
        });

        // Prefetch and get favorites
        const cachedFavorites = await queryClient.ensureQueryData({
          queryKey: ['user-favorites'],
          queryFn: async () => {
            const { data } = await supabase
              .from('user_favorites')
              .select('video_id, video_type')
              .eq('user_id', user.id);
            
            const videoIds = data?.filter(fav => fav.video_type === 'tiktok').map(fav => fav.video_id) || [];
            const photoIds = data?.filter(fav => fav.video_type === 'photo_carousel').map(fav => fav.video_id) || [];
            return { videoIds, photoIds };
          },
          staleTime: 10 * 60 * 1000,
        });

        const { videoIds, photoIds } = cachedFavorites;
        
        // Prefetch favorite videos
        if (videoIds && videoIds.length > 0) {
          queryClient.prefetchQuery({
            queryKey: ['favorite-videos', videoIds],
            queryFn: async () => {
              const { data: videos } = await supabase
                .from('tiktok_videos_all')
                .select('*')
                .in('id', videoIds);

              const { data: mediaAssets } = await supabase
                .from('media_assets_gif_thumbnail')
                .select('video_id, url, thumbnail_url')
                .in('video_id', videoIds);

              const mediaMap = new Map(mediaAssets?.map(m => [m.video_id, m]) || []);
              return videos?.map(v => ({
                ...v,
                gif_url: mediaMap.get(v.id)?.url,
                thumbnail_url: mediaMap.get(v.id)?.thumbnail_url
              })) || [];
            },
            staleTime: 10 * 60 * 1000,
          });
        }

        // Prefetch favorite photos
        if (photoIds && photoIds.length > 0) {
          queryClient.prefetchQuery({
            queryKey: ['favorite-photos', photoIds],
            queryFn: async () => {
              const { data: photos } = await supabase
                .from('tiktok_photo_carousel')
                .select('*')
                .in('id', photoIds);
              return photos || [];
            },
            staleTime: 10 * 60 * 1000,
          });
        }
      } catch {
        // Prefetch failed silently
      }
    };

    // Start prefetching immediately
    prefetchWorkspaceData();
  }, [queryClient]);

  
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [generatePlanModalOpen, setGeneratePlanModalOpen] = useState(false);
  
  // Initial loading overlay state - only for first load to avoid flashing
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  // Keyboard shortcut to open quick notes with 'n' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if 'n' is pressed and we're not in an input/textarea
      if (e.key === 'n' && !workspaceModalOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setWorkspaceModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [workspaceModalOpen]);
  
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  // sidebarOpen state removed - now handled by ExploreTopFilters internally
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPhotoCarousel, setSelectedPhotoCarousel] = useState<PhotoCarousel | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use the new filters hook
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
  } = useExploreFilters(videos);

  // Read URL params and apply filters on mount
  useEffect(() => {
    const contentStyleParam = searchParams.get('contentStyle');
    if (contentStyleParam) {
      const decodedStyle = decodeURIComponent(contentStyleParam);
      setFilters(prev => ({
        ...prev,
        contentStyle: [decodedStyle]
      }));
      setPendingFilters(prev => ({
        ...prev,
        contentStyle: [decodedStyle]
      }));
      // Filter panel opens automatically via ExploreTopFilters when URL param is present
      // Clear the URL param after applying
      setSearchParams({});
    }
  }, []);

  // Handle video URL parameter to open specific video modal - fetch directly for shared links
  useEffect(() => {
    const videoIdParam = searchParams.get('video');
    if (!videoIdParam) return;

    const videoId = parseInt(videoIdParam, 10);
    if (isNaN(videoId)) return;

    // First check if video is already in loaded videos
    const existingVideo = videos.find(v => v.id === videoId);
    if (existingVideo) {
      setSelectedVideo(existingVideo);
      setIsVideoModalOpen(true);
      setSearchParams({});
      return;
    }

    // Fetch directly from database for shared link access
    const fetchSharedVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('tiktok_videos_all')
          .select('*')
          .eq('id', videoId)
          .single();

        if (error || !data) {
          // Try reels table as fallback
          const { data: reelData } = await supabase
            .from('reels_all')
            .select('*')
            .eq('id', videoId)
            .single();

          if (reelData) {
            const reelAsVideo: Video = {
              id: reelData.id,
              video_url: reelData.video_file_url || '',
              embedded_ulr: reelData.embedded_url,
              outliar_score: reelData.outliar_score || 0,
              video_views: reelData.video_views || 0,
              video_likes: reelData.video_likes || 0,
              comments: '',
              profile_followers: reelData.profile_followers || 0,
              caption: reelData.caption,
              hook: reelData.hook,
              genre: reelData.genre,
              content_style: reelData.content_style,
              gender: reelData.gender,
              date_posted: reelData.date_posted,
              gif_url: null,
              thumbnail_url: null,
              video_file_url: reelData.video_file_url,
              is_reel: true,
            };
            setSelectedVideo(reelAsVideo);
            setIsVideoModalOpen(true);
          }
        } else {
          setSelectedVideo(data as Video);
          setIsVideoModalOpen(true);
        }
        setSearchParams({});
      } catch (err) {
        console.error('Error fetching shared video:', err);
        setSearchParams({});
      }
    };

    fetchSharedVideo();
  }, [searchParams]);

  const {
    viralRightNowVideos,
    viralRightNowReels,
    viralPhotoCarousels,
    trendingVideos,
    trendingPhotoCarousels,
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
  } = useCategoryData(filters.genre, filters.platform || [], [], '', filters.subGenre || []);
  const { toggleFavorite } = useFavorites();

  const loadMoreVideosRef = useRef<() => void>();
  const lastScrollPositionRef = useRef<number>(0);
  
  // Once both main videos and category content have finished initial loading,
  // hide the global loading overlay to avoid flashing on subsequent fetches.
  useEffect(() => {
    if (!loading && !categoryLoading) {
      setShowInitialLoading(false);
    }
  }, [loading, categoryLoading]);
  
  loadMoreVideosRef.current = () => {
    lastScrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    
    const hasActiveFilters = Object.values(filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : filter !== 'all'
    );
    if (hasActiveFilters) {
      loadFilteredVideos(filters, true);
    } else {
      loadVideos(true);
    }
  };

  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (isScrolling || loading || loadingMore) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.offsetHeight;
        
        if (currentScrollTop + windowHeight >= docHeight - 300) {
          if (hasMore && loadMoreVideosRef.current) {
            isScrolling = true;
            loadMoreVideosRef.current();
            setTimeout(() => { isScrolling = false; }, 1000);
          }
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, loading, loadingMore]);
  
  // Initial load - optimized parallel loading
  useEffect(() => {
    // Load everything in parallel for speed
    const loadAll = async () => {
      await Promise.all([
        loadVideos(),
        loadPhotoCarousels(),
        loadReels(),
        loadInitialData()
      ]);
    };
    
    loadAll();
  }, []); // Empty deps to force single execution

  // Only reload videos for server-side filters (not contentStyle which is client-side)
  useEffect(() => {
    const hasServerFilters = 
      filters.genre.length > 0 || 
      filters.subGenre.length > 0 || 
      filters.gender.length > 0 || 
      filters.performanceRange !== 'all' ||
      filters.excludeGenre.length > 0 ||
      filters.excludeContentStyle.length > 0;
    
    if (hasServerFilters) {
      loadFilteredVideos(filters);
    }
  }, [filters.genre, filters.subGenre, filters.gender, filters.performanceRange, filters.excludeGenre, filters.excludeContentStyle, loadFilteredVideos]);

  useEffect(() => {
    if (filters.contentStyle.length === 1) {
      const styleToId: { [key: string]: string } = {
        'hook statement': 'hook-statement',
        'selfie performance': 'selfie-performance',
        'selfie lipsync': 'selfie-lipsync',
        'fast pace performance': 'fast-pace-performance',
        'lyric video': 'lyric-video',
        'pro camera lipsync': 'pro-camera-lipsync',
        'live performance': 'live-performance',
        'cover': 'cover',
        'meme': 'meme',
        'transition': 'transition',
        'production': 'production',
        'bts': 'production',
        'compilation visuals': 'compilation-visuals',
        'cinematic edit': 'cinematic-edit',
        'instrument performance': 'instrument-performance'
      };
      
      const style = filters.contentStyle[0].toLowerCase().trim();
      const categoryId = styleToId[style];
      
      if (categoryId) {
        setExpandedCategoryId(categoryId);
        setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                const element = document.getElementById(categoryId);
                if (element) {
                  const headerOffset = 120;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
              }, 100);
            });
          });
        }, 1200);
      }
    } else {
      setExpandedCategoryId(null);
    }
  }, [filters.contentStyle]);





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
        if (prev.length >= 7) {
          toast({
            title: "Selection Limit Reached",
            description: "You can only select up to 7 items for your content plan.",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, content];
      }
    });
  }, []);

  const handleVideoClick = useCallback((video: Video) => {
    setSelectedVideo(video);
    setVideos([]); // Clear videos array so modal uses single video mode
    setIsVideoModalOpen(true);
  }, []);

  const handlePhotoCarouselClick = useCallback((carousel: PhotoCarousel) => {
    // Extract post ID from embedded_url for official TikTok player iframe
    const url = carousel.embedded_url || carousel.photo_url_1;
    
    // Extract post ID using regex: /video/ or /photo/ followed by digits
    const postIdMatch = url?.match(/\/(?:video|photo)\/(\d+)/);
    const postId = postIdMatch?.[1];
    
    // Build player URL if we have a post ID
    const playerSrc = postId 
      ? `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&controls=1&volume_control=1`
      : null;

    // Create video object for VideoDetailsModal
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
      who: carousel["who?"],
      genre: carousel.genre,
      sub_genre: carousel.sub_genre,
      content_style: carousel.content_style,
      audience: carousel.Audience,
      gender: carousel.gender,
      date_posted: carousel.date_posted,
      Artist: carousel.artist,
      profile_bio: carousel.profile_bio,
      gif_url: null,
      thumbnail_url: carousel.photo_url_1 || null,
      isPhotoCarousel: true,
      postUrl: playerSrc || url || '', // Use player URL or fallback to original URL
    };

    setSelectedVideo(carouselAsVideo);
    setVideos([carouselAsVideo]);
    setIsVideoModalOpen(true);
  }, []);

  const generatePlanFromSelected = useCallback(() => {
    if (selectedContent.length === 0) {
      toast({
        title: "No Content Selected",
        description: "Please select at least one piece of content to generate a plan.",
        variant: "destructive",
      });
      return;
    }
    
    // Extract video IDs from selected content
    const videoIds = selectedContent
      .filter(item => 'video_url' in item)
      .map(item => item.id);
    
    // Extract genres and content styles from selected videos for filtering
    const selectedGenres = new Set<string>();
    const selectedContentStyles = new Set<string>();
    
    selectedContent.forEach(item => {
      // Extract genres
      if (item.genre) {
        try {
          const genreObj = typeof item.genre === 'string' 
            ? JSON.parse(item.genre.replace(/'/g, '"'))
            : item.genre;
          Object.keys(genreObj || {}).forEach(g => selectedGenres.add(g));
        } catch {
          const genres = item.genre.split(/[,/]/).map(g => g.trim()).filter(g => g);
          genres.forEach(g => selectedGenres.add(g));
        }
      }
      
      // Extract content styles
      if (item.content_style) {
        selectedContentStyles.add(item.content_style);
      }
    });
    
    // Navigate to plan page with video IDs, genres, and content styles as URL params
    const params = new URLSearchParams();
    videoIds.forEach(id => params.append('videos', id.toString()));
    if (selectedGenres.size > 0) {
      params.append('genres', Array.from(selectedGenres).join(','));
    }
    if (selectedContentStyles.size > 0) {
      params.append('content_styles', Array.from(selectedContentStyles).join(','));
    }
    
    navigate(`/plan?${params.toString()}`);
  }, [selectedContent, navigate, toast]);

  const addSelectedToFavorites = useCallback(async () => {
    if (selectedContent.length === 0) return;
    
    for (const item of selectedContent) {
      const videoType = 'video_url' in item ? 'tiktok' : 'photo_carousel';
      await toggleFavorite(item.id, videoType);
    }
    
    toast({
      title: "Added to favorites! ⭐",
      description: `${selectedContent.length} item${selectedContent.length > 1 ? 's' : ''} added to your favorites.`,
    });
  }, [selectedContent, toggleFavorite]);

  const handleLoadMore = useCallback(() => {
    if (loadMoreVideosRef.current) {
      loadMoreVideosRef.current();
    }
  }, []);

  // Calculate active filter count
  const activeFilterCount = 
    filters.genre.length + 
    filters.subGenre.length + 
    filters.contentStyle.length + 
    filters.gender.length + 
    filters.platform.length + 
    filters.excludeGenre.length + 
    filters.excludeContentStyle.length + 
    (filters.performanceRange !== 'all' ? 1 : 0) +
    (filters.followerRange !== 'all' ? 1 : 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <SEOHead 
          title="Explore Viral Music Content"
          description="Discover 15,000+ viral TikTok and Instagram Reels from music creators. Filter by genre, content style, and performance to find what works for your sound."
          canonical="/explore"
        />
        <HeaderAuth variant="light" />

        {/* Initial full-page loading overlay - only during first load to prevent flashing */}
        {showInitialLoading && (
          <LoadingOverlay
            fullPage
            messages={[
              "Analysing trends with AI",
              "Loading viral content",
              "Curating feed"
            ]}
          />
        )}

        {/* New Hero Section with Search & Filters */}
        <div className="pt-16">
          <HeroGuide
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            availableGenres={availableGenres}
            availableContentStyles={availableContentStyles}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalResults={videos.length + photoCarousels.length}
          />
        </div>
        
        {/* Advanced Filter Button + Panel */}
        <div className="relative container mx-auto px-4 md:px-6">
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters & Presets
            </Button>
          </div>
          <FilterPanel
            filters={filters}
            pendingFilters={pendingFilters}
            onFiltersChange={setPendingFilters}
            onApplyFilters={applyFilters}
            availableGenres={availableGenres}
            availableSubGenres={availableSubGenres}
            availableContentStyles={availableContentStyles}
            availableGenders={availableGenders}
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            hasChanges={hasFilterChanges}
          />
        </div>
        
        <div className="flex">
          <div className="flex-1">
            <div className="container mx-auto px-4 md:px-6 py-8">

            {/* Active Filters Display */}
            {(searchQuery ||
              filters.genre.length > 0 || 
              filters.subGenre.length > 0 || 
              filters.contentStyle.length > 0 || 
              filters.gender.length > 0 ||
              filters.platform.length > 0 ||
              filters.excludeGenre.length > 0 ||
              filters.excludeContentStyle.length > 0 ||
              filters.performanceRange !== 'all') && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Active Filters</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({
                        genre: [],
                        subGenre: [],
                        contentStyle: [],
                        performanceRange: 'all',
                        followerRange: 'all',
                        effort: 'all',
                        gender: [],
                        platform: [],
                        excludeGenre: [],
                        excludeContentStyle: []
                      });
                    }}
                    className="ml-auto text-xs h-7 px-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Search query badge */}
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100">
                      Search: "{searchQuery}"
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  {/* Include filters */}
                  {filters.genre.map((genre) => {
                    const colors = getGenreColor(genre);
                    return (
                      <Badge 
                        key={genre} 
                        className="text-xs border"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        {genre}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            genre: prev.genre.filter(g => g !== genre)
                          }))}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    );
                  })}
                  {filters.subGenre.map((subGenre) => {
                    const colors = getGenreColor(subGenre);
                    return (
                      <Badge 
                        key={subGenre} 
                        className="text-xs border"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        {subGenre}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            subGenre: prev.subGenre.filter(sg => sg !== subGenre)
                          }))}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    );
                  })}
                  {filters.contentStyle.map((style) => {
                    const colors = getContentCategoryColor(style);
                    return (
                      <Badge 
                        key={style} 
                        className="text-xs border"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border
                        }}
                      >
                        {style}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            contentStyle: prev.contentStyle.filter(cs => cs !== style)
                          }))}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    );
                  })}
                  {filters.gender.map((gender) => (
                    <Badge key={gender} variant="secondary" className="text-xs">
                      {gender}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          gender: prev.gender.filter(g => g !== gender)
                        }))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                  {filters.platform.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform === 'tiktok' ? 'TikTok' : 'Reels'}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          platform: prev.platform.filter(p => p !== platform)
                        }))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}

                  {/* Exclude filters */}
                  {filters.excludeGenre.map((genre) => (
                    <Badge key={`exclude-${genre}`} variant="destructive" className="text-xs">
                      Exclude: {genre}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          excludeGenre: prev.excludeGenre.filter(g => g !== genre)
                        }))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                  {filters.excludeContentStyle.map((style) => (
                    <Badge key={`exclude-${style}`} variant="destructive" className="text-xs">
                      Exclude: {style}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          excludeContentStyle: prev.excludeContentStyle.filter(cs => cs !== style)
                        }))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}

                  {/* Performance and Date filters */}
                  {filters.performanceRange !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Performance: {filters.performanceRange}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          performanceRange: 'all'
                        }))}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Category Sections */}
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
              sortModes={{}}
              onSortModeChange={() => {}}
            />

            {/* Video Details Modal */}
            <VideoDetailsModal
              video={selectedVideo}
              videos={videos}
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

            {/* Selection Counter and Generate Button */}
            {selectedContent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-xl border border-gray-200 z-40"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-900">{selectedContent.length}</span>
                    <span className="text-gray-500"> of 7 selected</span>
                  </div>
                  <Button 
                    onClick={addSelectedToFavorites}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Star className="w-3.5 h-3.5 mr-1.5" />
                    Add to Favorites
                  </Button>
                  <Button 
                    onClick={() => setGeneratePlanModalOpen(true)} 
                    size="sm" 
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Generate Plan
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Workspace Notes Floating Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed bottom-4 left-60 z-50"
            >
              <Button
                onClick={() => setWorkspaceModalOpen(true)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-xl bg-gray-900 hover:bg-gray-800 text-white"
                title="Quick Notes (press N)"
              >
                <FileText className="h-6 w-6" />
              </Button>
            </motion.div>

            {/* Workspace Notes Modal */}
            <Dialog 
              open={workspaceModalOpen} 
              onOpenChange={(open) => {
                // Save notes when closing the dialog
                if (!open) {
                  const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
                  if (editor) {
                    const saveEvent = new CustomEvent('save-workspace-notes');
                    document.dispatchEvent(saveEvent);
                  }
                }
                setWorkspaceModalOpen(open);
              }}
            >
              <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                  <DialogTitle className="text-2xl">Quick Workspace Notes</DialogTitle>
                  <DialogDescription>
                    Jot down your ideas while exploring. Auto-saves every 2 seconds and syncs with your main workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <WorkspaceNotesEditor compact autoFocus />
                </div>
              </DialogContent>
            </Dialog>

            {/* Generate Plan Options Modal */}
            <Dialog open={generatePlanModalOpen} onOpenChange={setGeneratePlanModalOpen}>
              <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Generate Your Content Plan</DialogTitle>
                  <DialogDescription className="text-gray-500">
                    Choose how you want to generate your viral content plan
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  <Button
                    onClick={() => {
                      setGeneratePlanModalOpen(false);
                      navigate('/analyze-audio');
                    }}
                    variant="outline"
                    className="h-auto py-4 px-5 flex items-start gap-4 bg-purple-50 hover:bg-purple-100 border-purple-200 justify-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base text-gray-900 mb-1">Upload a Song</div>
                      <div className="text-sm text-gray-500">
                        Analyze audio and get content ideas based on the vibe
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => {
                      setGeneratePlanModalOpen(false);
                      navigate('/analyze');
                    }}
                    variant="outline"
                    className="h-auto py-4 px-5 flex items-start gap-4 bg-blue-50 hover:bg-blue-100 border-blue-200 justify-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <VideoIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base text-gray-900 mb-1">Upload a Video</div>
                      <div className="text-sm text-gray-500">
                        Get insights and similar trending content
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => {
                      setGeneratePlanModalOpen(false);
                      generatePlanFromSelected();
                    }}
                    variant="outline"
                    className="h-auto py-4 px-5 flex items-start gap-4 bg-green-50 hover:bg-green-100 border-green-200 justify-start"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Grid3x3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-base text-gray-900 mb-1">Use Selected Videos ({selectedContent.length})</div>
                      <div className="text-sm text-gray-500">
                        Create a plan from your selected content
                      </div>
                    </div>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            
            {/* Quick Navigation FAB */}
            <QuickNavFab />
          </div>
        </div>
        </div>
        <FooterSection />
      </div>
    </ErrorBoundary>
  );
};

export default Explore;