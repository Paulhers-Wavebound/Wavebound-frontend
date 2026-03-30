import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import { useCategoryState } from './useCategoryState';
import { CATEGORY_CONFIGS, INITIAL_ITEMS_PER_CATEGORY, LOAD_MORE_ITEMS, CategoryKey } from '../utils/categoryConfig';
import {
  fetchTikTokVideosWithJoins,
  fetchReelsWithJoins,
  fetchPhotoCarouselsWithJoins,
  loadContentByStyle,
  DateRange,
  SortOption
} from '../services/contentDataService';
import { CategorySortMode } from '../components/CategorySection';

// Maps UI category IDs (kebab-case) to internal CategoryKey (camelCase)
const UI_ID_TO_CATEGORY_KEY: Record<string, CategoryKey> = {
  'hook-statement': 'hookStatementVideos',
  'selfie-performance': 'selfiePerformanceVideos',
  'selfie-lipsync': 'selfieLipsyncVideos',
  'fast-pace': 'fastPaceVideos',
  'lyric-video': 'lyricVideoVideos',
  'pro-camera-lipsync': 'proCameraLipsyncVideos',
  'live-performance': 'livePerformanceVideos',
  'cover': 'coverVideos',
  'meme': 'memeVideos',
  'transition': 'transitionVideos',
  'production': 'productionVideos',
  'compilation-visuals': 'compilationVisualsVideos',
  'cinematic-edit': 'cinematicEditVideos',
  'instrument-performance': 'instrumentPerformanceVideos',
  'viral-tiktok': 'viralRightNowVideos',
  'viral-reels': 'viralRightNowReels',
  'trending': 'trendingVideos',
  'trending-photo-carousels': 'trendingPhotoCarousels',
  'viral-photo-carousels': 'viralPhotoCarousels',
};

const sortModeToDateRange = (mode: CategorySortMode): DateRange => {
  if (mode === 'viral') return 'week';
  if (mode === 'viral-year') return 'year';
  return null;
};

export type SortMetric = 'views' | 'viral-score';

export const useCategoryData = (activeGenres: string[] = [], activePlatforms: string[] = [], activeContentStyles: string[] = [], searchQuery: string = '', activeSubGenres: string[] = [], sortModes: Record<string, CategorySortMode> = {}, sortMetrics: Record<string, SortMetric> = {}) => {
  const queryClient = useQueryClient();
  const { categories, loading, setLoading, updateCategory } = useCategoryState();
  const loadMoreInFlight = useRef<Set<string>>(new Set());

  const normalizeSearch = (q: string) =>
    q
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const matchesSearch = (haystack: string, q: string) => {
    const terms = normalizeSearch(q);
    if (terms.length === 0) return true;
    const h = haystack.toLowerCase();
    return terms.every(t => h.includes(t));
  };

  const stringify = (val: any) =>
    val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);

  const videoSearchText = (v: any) => {
    const parts = [
      v?.caption,
      v?.hook,
      v?.description,
      v?.context,
      v?.hashtags,
      v?.content_style,
      v?.sub_style,
      v?.handle,
      // AI enrichment
      v?.label_reasons,
      v?.evidence_pointers,
      v?.social_context_mood,
      v?.ai_effort,
      // Sound / audio analysis
      stringify(v?.instruments),
      stringify(v?.voices),
      stringify(v?.mood),
      stringify(v?.technical_feedback),
      stringify(v?.lyric_analysis),
    ];
    return parts.filter(Boolean).join(' · ');
  };

  const photoCarouselSearchText = (p: any) => {
    const parts = [p?.caption, p?.Hook, p?.hashtags, p?.handle];
    return parts.filter(Boolean).join(' · ');
  };

  // Helper to load a single category.
  // Goal: always DISPLAY at most `limit` (12), but when searching we may need to page a bit
  // to find up to 12 matches.
  const loadCategory = async (config: typeof CATEGORY_CONFIGS[0], limit: number, dateRange: DateRange = null, metric: SortMetric = 'views') => {
    const q = searchQuery.trim();
    const isSearching = q.length > 0;
    const hasGenreFilter = activeGenres.length > 0;

    // Page through multiple batches when searching OR filtering by genre,
    // because genre filtering is client-side and a single page may not yield enough matches.
    const needsPaging = isSearching || hasGenreFilter;
    const pageSize = needsPaging ? limit * 3 : limit;
    const maxPages = needsPaging ? 8 : 1; // increased cap for sparse genre matches

    try {
      if (config.type === 'viral-tiktok') {
        const resolvedSort: SortOption = dateRange ? (metric === 'viral-score' ? 'viral_score' : 'views') : 'date_posted';
        const collected: any[] = [];
        const seen = new Set<number>();

        for (let page = 0; page < maxPages && collected.length < limit; page++) {
          const offset = page * pageSize;
          const data = await fetchTikTokVideosWithJoins(pageSize, offset, activeGenres, [], resolvedSort, activeSubGenres, searchQuery, dateRange);
          if (!data.length) break;

          const filtered = data;

          for (const item of filtered) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              collected.push(item);
              if (collected.length >= limit) break;
            }
          }
        }

        return { key: config.key, videos: collected.slice(0, limit) };
      }

      if (config.type === 'viral-reels') {
        const resolvedSort: SortOption = dateRange ? (metric === 'viral-score' ? 'viral_score' : 'views') : 'date_posted';
        const collected: any[] = [];
        const seen = new Set<number>();

        for (let page = 0; page < maxPages && collected.length < limit; page++) {
          const offset = page * pageSize;
          const data = await fetchReelsWithJoins(pageSize, offset, activeGenres, [], resolvedSort, activeSubGenres, searchQuery, dateRange);
          if (!data.length) break;

          const filtered = data;

          for (const item of filtered) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              collected.push(item);
              if (collected.length >= limit) break;
            }
          }
        }

        return { key: config.key, videos: collected.slice(0, limit) };
      }

      if (config.type === 'trending') {
        const resolvedSort: SortOption = dateRange ? (metric === 'viral-score' ? 'viral_score' : 'views') : 'views';
        const collected: any[] = [];
        const seen = new Set<number>();

        for (let page = 0; page < maxPages && collected.length < limit; page++) {
          const offset = page * pageSize;
          let data = await fetchTikTokVideosWithJoins(pageSize, offset, activeGenres, [], resolvedSort, activeSubGenres, searchQuery, dateRange);

          if (config.scoreRange) {
            data = data.filter(v =>
              (v.outliar_score || 0) >= config.scoreRange!.min &&
              (v.outliar_score || 0) < config.scoreRange!.max
            );
          }

          if (!data.length) break;

          const filtered = data;

          for (const item of filtered) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              collected.push(item);
              if (collected.length >= limit) break;
            }
          }
        }

        return { key: config.key, videos: collected.slice(0, limit) };
      }

      if (config.type === 'photo-carousel') {
        const collected: any[] = [];
        const seen = new Set<number>();

        for (let page = 0; page < maxPages && collected.length < limit; page++) {
          const offset = page * pageSize;
          const data = await fetchPhotoCarouselsWithJoins(pageSize, offset, activeGenres, activeSubGenres, searchQuery, dateRange);
          if (!data.length) break;

          const filtered = data;

          for (const item of filtered) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              collected.push(item);
              if (collected.length >= limit) break;
            }
          }
        }

        return { key: config.key, photoCarousels: collected.slice(0, limit) };
      }

      if (config.type === 'content-style' && config.contentStyle) {
        const resolvedSort: SortOption = dateRange ? (metric === 'viral-score' ? 'viral_score' : 'views') : 'date_posted';
        const collected: any[] = [];
        const seen = new Set<number>();

        for (let page = 0; page < maxPages && collected.length < limit; page++) {
          const offset = page * pageSize;
          const data = await loadContentByStyle(config.contentStyle, pageSize, offset, activeGenres, activePlatforms, activeSubGenres, searchQuery, dateRange, resolvedSort);
          if (!data.length) break;

          const filtered = data;

          for (const item of filtered) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              collected.push(item);
              if (collected.length >= limit) break;
            }
          }
        }

        return { key: config.key, videos: collected.slice(0, limit) };
      }

      return null;
    } catch (error) {
      console.error(`Error loading ${config.key}:`, error);
      return null;
    }
  };
  // Process results and update state
  const processResults = (results: PromiseSettledResult<any>[]) => {
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { key, videos, photoCarousels } = result.value as any;
        const itemCount = videos?.length || photoCarousels?.length || 0;
        const hasMore = itemCount >= 5;
        updateCategory(key, {
          videos: videos || [],
          photoCarousels: photoCarousels || [],
          hasMore
        });
      }
    });
  };

  // Load initial data with staggered loading for faster perceived performance
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const limit = INITIAL_ITEMS_PER_CATEGORY; // Always 12

      // Load ALL categories in parallel so everything appears at once
      const allResults = await Promise.allSettled(
        CATEGORY_CONFIGS.map(config => loadCategory(config, limit, sortModeToDateRange(sortModes[config.key] || 'latest'), sortMetrics[config.key] || 'views'))
      );
      processResults(allResults);
      setLoading(false);

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error loading content",
        description: "Failed to load some content categories",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [activeGenres, activePlatforms, searchQuery, updateCategory, setLoading, activeSubGenres, sortModes, sortMetrics]);

  // Auto-reload when genres/platforms/search change (NOT sort modes)
  useEffect(() => {
    loadInitialData();
  }, [activeGenres.join(','), activePlatforms.join(','), activeContentStyles.join(','), searchQuery, activeSubGenres.join(',')]);

  // Track previous sort modes and metrics to detect per-category changes
  const prevSortModesRef = useRef<Record<string, CategorySortMode>>({});
  const prevSortMetricsRef = useRef<Record<string, string>>({});

  // When a single category's sort mode or metric changes, reload ONLY that category
  useEffect(() => {
    const prevModes = prevSortModesRef.current;
    const prevMetrics = prevSortMetricsRef.current;
    const changedKeys = new Set<string>();

    for (const key of Object.keys(sortModes)) {
      if (sortModes[key] !== prevModes[key]) changedKeys.add(key);
    }
    for (const key of Object.keys(sortMetrics)) {
      if (sortMetrics[key] !== prevMetrics[key]) changedKeys.add(key);
    }

    prevSortModesRef.current = { ...sortModes };
    prevSortMetricsRef.current = { ...sortMetrics };

    // Skip on first mount (handled by loadInitialData)
    if (Object.keys(prevModes).length === 0 && Object.keys(prevMetrics).length === 0) return;
    if (changedKeys.size === 0) return;

    // Reload only the changed categories
    Array.from(changedKeys).forEach(async (uiKey) => {
      const resolvedKey = UI_ID_TO_CATEGORY_KEY[uiKey] || uiKey as CategoryKey;
      const config = CATEGORY_CONFIGS.find(c => c.key === resolvedKey);
      if (!config) {
        console.warn(`[Sort] No config found for UI key "${uiKey}" (resolved: "${resolvedKey}")`);
        return;
      }

      updateCategory(resolvedKey, { loading: true, videos: [], photoCarousels: [] });

      try {
        const dateRange = sortModeToDateRange(sortModes[uiKey] || 'latest');
        console.log(`[Sort] ${uiKey} -> ${resolvedKey}: mode=${sortModes[uiKey]}, dateRange=${dateRange}`);
        const result = await loadCategory(config, INITIAL_ITEMS_PER_CATEGORY, dateRange, sortMetrics[uiKey] || 'views');
        if (result) {
          const { videos, photoCarousels } = result as any;
          const itemCount = videos?.length || photoCarousels?.length || 0;
          console.log(`[Sort] ${resolvedKey}: fetched ${itemCount} items, topViews=${videos?.[0]?.video_views}`);
          updateCategory(resolvedKey, {
            videos: videos || [],
            photoCarousels: photoCarousels || [],
            hasMore: itemCount >= 5,
            loading: false,
          });
        } else {
          updateCategory(resolvedKey, { loading: false });
        }
      } catch (error) {
        console.error(`Error reloading ${resolvedKey}:`, error);
        updateCategory(resolvedKey, { loading: false });
      }
    });
  }, [JSON.stringify(sortModes), JSON.stringify(sortMetrics)]);

  // Create loadMore functions dynamically
  const createLoadMore = (configKey: string) => async () => {
    // Hard guard against double-triggering (e.g. rapid clicks / re-renders)
    if (loadMoreInFlight.current.has(configKey)) return;

    const config = CATEGORY_CONFIGS.find(c => c.key === configKey);
    if (!config) return;

    const category = categories[configKey];
    if (!category || !category.hasMore) {
      return;
    }

    const dateRange = sortModeToDateRange(sortModes[configKey] || 'latest');

    loadMoreInFlight.current.add(configKey);
    updateCategory(config.key, { loading: true });

    try {
      const currentLength = config.type === 'photo-carousel'
        ? category.photoCarousels.length
        : category.videos.length;

      let newData: any[] = [];

      if (config.type === 'viral-tiktok') {
        newData = await fetchTikTokVideosWithJoins(LOAD_MORE_ITEMS, currentLength, activeGenres, [], 'date_posted', activeSubGenres, searchQuery, dateRange);
      } else if (config.type === 'viral-reels') {
        newData = await fetchReelsWithJoins(LOAD_MORE_ITEMS, currentLength, activeGenres, [], 'date_posted', activeSubGenres, searchQuery, dateRange);
      } else if (config.type === 'trending') {
        let data = await fetchTikTokVideosWithJoins(LOAD_MORE_ITEMS * 2, currentLength, activeGenres, [], 'views', activeSubGenres, searchQuery, dateRange);
        if (config.scoreRange) {
          data = data.filter(v =>
            (v.outliar_score || 0) >= config.scoreRange!.min &&
            (v.outliar_score || 0) < config.scoreRange!.max
          );
        }
        newData = data.slice(0, LOAD_MORE_ITEMS);
      } else if (config.type === 'photo-carousel') {
        newData = await fetchPhotoCarouselsWithJoins(LOAD_MORE_ITEMS, currentLength, activeGenres, activeSubGenres, searchQuery, dateRange);
      } else if (config.type === 'content-style' && config.contentStyle) {
        const targetTotal = currentLength + LOAD_MORE_ITEMS;
        const data = await loadContentByStyle(config.contentStyle, targetTotal, 0, activeGenres, activePlatforms, activeSubGenres, searchQuery, dateRange);

        updateCategory(config.key, (prev) => ({
          videos: data,
          loading: false,
          hasMore: data.length >= targetTotal
        }));
        return;
      }

      if (config.type === 'photo-carousel') {
        updateCategory(config.key, (prev) => {
          const existingIds = new Set(prev.photoCarousels.map(p => p.id));
          const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id));
          return {
            photoCarousels: [...prev.photoCarousels, ...uniqueNewData],
            loading: false,
            hasMore: uniqueNewData.length >= 2
          };
        });
      } else {
        updateCategory(config.key, (prev) => {
          const existingIds = new Set(prev.videos.map(v => v.id));
          const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id));
          return {
            videos: [...prev.videos, ...uniqueNewData],
            loading: false,
            hasMore: uniqueNewData.length >= 2
          };
        });
      }
    } catch (error) {
      console.error(`Error loading more for ${config.key}:`, error);
      updateCategory(config.key, { loading: false });
    } finally {
      loadMoreInFlight.current.delete(configKey);
    }
  };

  // Attach loadMore functions to categories
  const categoriesWithLoadMore = { ...categories };
  CATEGORY_CONFIGS.forEach(config => {
    categoriesWithLoadMore[config.key] = {
      ...categoriesWithLoadMore[config.key],
      loadMore: createLoadMore(config.key)
    };
  });

  return {
    ...categoriesWithLoadMore,
    loading,
    loadInitialData
  };
};
