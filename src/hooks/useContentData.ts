import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { toast } from './use-toast';
import { Video, PhotoCarousel, FilterState } from '../types/content';
import {
  fetchTikTokVideosWithJoins,
  fetchReelsWithJoins,
  fetchPhotoCarouselsWithJoins
} from '../services/contentDataService';

const VIDEOS_PER_PAGE = 20;
const CACHE_VERSION = 'v10-NEW-TABLES';

export const useContentData = () => {
  const queryClient = useQueryClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [photoCarousels, setPhotoCarousels] = useState<PhotoCarousel[]>([]);
  const [reels, setReels] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const videosRef = useRef<Video[]>([]);

  videosRef.current = videos;

  const loadVideos = useCallback(async (loadMore = false) => {
    const currentLength = videosRef.current.length;

    // Check cache first if not loading more
    if (!loadMore) {
      const cachedData = queryClient.getQueryData([`explore-videos-${CACHE_VERSION}`, 0]);
      if (cachedData) {
        setVideos(cachedData as Video[]);
        setLoading(false);
        return;
      }
    }

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const offset = loadMore ? currentLength : 0;

      // Use new normalized tables
      const videosWithMedia = await fetchTikTokVideosWithJoins(VIDEOS_PER_PAGE, offset);

      if (loadMore) {
        setVideos(prev => [...prev, ...videosWithMedia]);
        setHasMore(videosWithMedia.length === VIDEOS_PER_PAGE);
      } else {
        setVideos(videosWithMedia);
        setHasMore(videosWithMedia.length === VIDEOS_PER_PAGE);
        queryClient.setQueryData([`explore-videos-${CACHE_VERSION}`, 0], videosWithMedia);
      }

    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error loading videos",
        description: "Failed to load video data. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [queryClient]);

  const loadPhotoCarousels = useCallback(async () => {
    // Check cache first
    const cachedData = queryClient.getQueryData([`explore-photo-carousels-${CACHE_VERSION}`]);
    if (cachedData) {
      setPhotoCarousels(cachedData as PhotoCarousel[]);
      return;
    }

    try {
      // Use new normalized tables
      const mappedCarousels = await fetchPhotoCarouselsWithJoins(100);
      setPhotoCarousels(mappedCarousels);
      queryClient.setQueryData([`explore-photo-carousels-${CACHE_VERSION}`], mappedCarousels);
    } catch (error) {
      console.error('Error loading photo carousels:', error);
    }
  }, [queryClient]);

  const loadFilteredVideos = useCallback(async (filters: FilterState, loadMore = false) => {
    const currentLength = videosRef.current.length;
    
    try {
      if (!loadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = loadMore ? currentLength : 0;

      // Use new normalized tables with filters
      const videosWithMedia = await fetchTikTokVideosWithJoins(
        VIDEOS_PER_PAGE,
        currentOffset,
        filters.genre,
        filters.contentStyle
      );

      // Apply additional filters not handled by the fetch function
      let filteredVideos = videosWithMedia;

      // Apply performance filter
      if (filters.performanceRange && filters.performanceRange !== 'all') {
        filteredVideos = filteredVideos.filter(v => {
          const score = v.outliar_score || 0;
          switch (filters.performanceRange) {
            case 'viral': return score >= 0.8;
            case 'trending': return score >= 0.6;
            case 'popular': return score >= 0.4;
            case 'growing': return score >= 0.0;
            default: return true;
          }
        });
      }

      // Apply gender filter
      if (filters.gender.length > 0) {
        filteredVideos = filteredVideos.filter(v => {
          const videoGender = v.gender?.toLowerCase() || '';
          return filters.gender.some(g => videoGender.includes(g.toLowerCase()));
        });
      }

      // Apply exclusion filters
      if (filters.excludeGenre.length > 0) {
        filteredVideos = filteredVideos.filter(v => {
          const videoGenre = v.genre?.toLowerCase() || '';
          return !filters.excludeGenre.some(g => videoGenre.includes(g.toLowerCase()));
        });
      }

      if (filters.excludeContentStyle.length > 0) {
        filteredVideos = filteredVideos.filter(v => {
          const style = v.content_style?.toLowerCase() || '';
          return !filters.excludeContentStyle.some(s => style.includes(s.toLowerCase()));
        });
      }

      if (loadMore) {
        setVideos(prev => [...prev, ...filteredVideos]);
      } else {
        setVideos(filteredVideos);
      }

      setHasMore(filteredVideos.length === VIDEOS_PER_PAGE);

    } catch (error) {
      console.error('Error loading filtered videos:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading filtered videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadReels = useCallback(async () => {
    try {
      // Use new normalized tables
      const mappedReels = await fetchReelsWithJoins(100);
      setReels(mappedReels);
    } catch (error) {
      console.error('Error loading reels:', error);
    }
  }, []);

  const clearVideos = useCallback(() => {
    setVideos([]);
    setHasMore(true);
    queryClient.removeQueries({ queryKey: [`explore-videos-${CACHE_VERSION}`] });
  }, [queryClient]);

  return {
    videos,
    photoCarousels,
    reels,
    loading,
    loadingMore,
    hasMore,
    loadVideos,
    loadPhotoCarousels,
    loadFilteredVideos,
    loadReels,
    clearVideos,
    setVideos,
    setHasMore
  };
};
