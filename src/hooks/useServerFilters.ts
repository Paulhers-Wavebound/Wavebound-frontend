import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Video } from '@/types/content';

export interface ServerFilterState {
  genre: string[];
  subGenre: string[];
  contentStyle: string[];
  performanceRange: string;
  followerRange: string;
  gender: string[];
  platform: string[];
  effort: string;
}

export const initialServerFilters: ServerFilterState = {
  genre: [],
  subGenre: [],
  contentStyle: [],
  performanceRange: '',
  followerRange: '',
  gender: [],
  platform: [],
  effort: '',
};

interface FilteredContent {
  id: number;
  platform: string;
  embedded_url: string;
  video_url: string;
  caption: string;
  handle: string;
  avatar_url: string;
  profile_followers: number;
  video_views: number;
  video_likes: number;
  video_comments: string;
  video_shares: number;
  viral_score: number;
  date_posted: string;
  genre: string;
  sub_genre: string;
  content_style: string;
  gender: string;
  hook: string;
  effort: string;
  thumbnail_url: string;
  gif_url: string;
  duration: number;
  total_count: number;
}

export const useServerFilters = () => {
  const [filters, setFilters] = useState<ServerFilterState>(initialServerFilters);
  const [pendingFilters, setPendingFilters] = useState<ServerFilterState>(initialServerFilters);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Video[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const transformToVideo = (item: FilteredContent): Video => ({
    id: item.id,
    video_url: item.video_url || '',
    outliar_score: item.viral_score || 0,
    video_views: item.video_views || 0,
    video_likes: item.video_likes || 0,
    comments: item.video_comments || '',
    profile_followers: item.profile_followers || 0,
    caption: item.caption,
    hook: item.hook,
    genre: item.genre,
    sub_genre: item.sub_genre,
    content_style: item.content_style,
    gender: item.gender,
    date_posted: item.date_posted,
    embedded_ulr: item.embedded_url,
    thumbnail_url: item.thumbnail_url,
    gif_url: item.gif_url,
    viral_score: item.viral_score,
    is_reel: item.platform === 'Reels',
  });

  const fetchFilteredContent = useCallback(async (
    filterState: ServerFilterState,
    searchQuery: string = '',
    sortBy: string = 'latest',
    limit: number = 50,
    offset: number = 0,
    append: boolean = false
  ) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('filter_explore_content', {
        p_genres: filterState.genre.length > 0 ? filterState.genre : null,
        p_sub_genres: filterState.subGenre.length > 0 ? filterState.subGenre : null,
        p_content_styles: filterState.contentStyle.length > 0 ? filterState.contentStyle : null,
        p_performance_range: filterState.performanceRange || null,
        p_follower_range: filterState.followerRange || null,
        p_genders: filterState.gender.length > 0 ? filterState.gender : null,
        p_platforms: filterState.platform.length > 0 ? filterState.platform : null,
        p_effort: filterState.effort || null,
        p_search_query: searchQuery || null,
        p_sort_by: sortBy,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error('Error fetching filtered content:', error);
        return;
      }

      const videos = (data as FilteredContent[] || []).map(transformToVideo);
      const total = data && data.length > 0 ? (data[0] as FilteredContent).total_count : 0;

      if (append) {
        setResults(prev => [...prev, ...videos]);
      } else {
        setResults(videos);
      }
      
      setTotalCount(Number(total));
      setHasMore(offset + videos.length < Number(total));
    } catch (err) {
      console.error('Error in fetchFilteredContent:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(pendingFilters);
  }, [pendingFilters]);

  const clearFilters = useCallback(() => {
    setPendingFilters(initialServerFilters);
    setFilters(initialServerFilters);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.genre.length > 0 ||
      filters.subGenre.length > 0 ||
      filters.contentStyle.length > 0 ||
      filters.performanceRange !== '' ||
      filters.followerRange !== '' ||
      filters.gender.length > 0 ||
      filters.platform.length > 0 ||
      filters.effort !== ''
    );
  }, [filters]);

  const hasFilterChanges = 
    JSON.stringify(filters) !== JSON.stringify(pendingFilters);

  return {
    filters,
    setFilters,
    pendingFilters,
    setPendingFilters,
    loading,
    results,
    totalCount,
    hasMore,
    fetchFilteredContent,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    hasFilterChanges,
    setResults,
  };
};
