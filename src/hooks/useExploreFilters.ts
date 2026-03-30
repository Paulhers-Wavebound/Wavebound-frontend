import { useState, useMemo, useCallback } from 'react';
import { FilterState, Video, PhotoCarousel, ContentItem } from '../types/content';
import { parseGenreJson, parseSubGenreJson } from '../utils/genreParser';

export const useExploreFilters = (videos: Video[], initialGenre: string[] = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    genre: initialGenre,
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

  const [pendingFilters, setPendingFilters] = useState<FilterState>({
    genre: initialGenre,
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

  // Genre normalization function
  const normalizeGenre = useCallback((genre: string): string => {
    const normalized = genre
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const genreMap: { [key: string]: string } = {
      'pop': 'Pop', 'rock': 'Rock', 'hiphop': 'Hip-Hop', 'hip hop': 'Hip-Hop',
      'rap': 'Rap', 'country': 'Country', 'rb': 'R&B', 'randb': 'R&B',
      'r b': 'R&B', 'rnb': 'R&B', 'electronic': 'Electronic', 'dance': 'Dance',
      'edm': 'EDM', 'jazz': 'Jazz', 'blues': 'Blues', 'classical': 'Classical',
      'reggae': 'Reggae', 'metal': 'Metal', 'punk': 'Punk', 'folk': 'Folk',
      'soul': 'Soul', 'funk': 'Funk', 'disco': 'Disco', 'house': 'House',
      'techno': 'Techno', 'trance': 'Trance', 'dubstep': 'Dubstep',
      'indie': 'Indie', 'alternative': 'Alternative', 'grunge': 'Grunge',
      'emo': 'Emo', 'hardcore': 'Hardcore', 'ska': 'Ska', 'reggaeton': 'Reggaeton',
      'latin': 'Latin', 'salsa': 'Salsa', 'bachata': 'Bachata', 'merengue': 'Merengue',
      'cumbia': 'Cumbia', 'bossa nova': 'Bossa Nova', 'samba': 'Samba',
      'gospel': 'Gospel', 'christian': 'Christian', 'indie pop': 'Indie-Pop',
      'indiepop': 'Indie-Pop', 'indie rock': 'Indie-Rock', 'indierock': 'Indie-Rock',
      'indie folk': 'Indie-Folk', 'indiefolk': 'Indie-Folk',
      'singer songwriter': 'Singer-Songwriter', 'singersongwriter': 'Singer-Songwriter',
      'synth pop': 'Synth-Pop', 'synthpop': 'Synth-Pop', 'dream pop': 'Dream-Pop',
      'dreampop': 'Dream-Pop', 'bedroom pop': 'Bedroom-Pop', 'bedroompop': 'Bedroom-Pop',
      'art pop': 'Art-Pop', 'artpop': 'Art-Pop', 'k pop': 'K-Pop', 'kpop': 'K-Pop',
      'j pop': 'J-Pop', 'jpop': 'J-Pop', 'afrobeat': 'Afrobeat', 'afrobeats': 'Afrobeat',
      'amapiano': 'Amapiano', 'grime': 'Grime', 'drill': 'Drill', 'trap': 'Trap',
      'lo fi': 'Lo-Fi', 'lofi': 'Lo-Fi', 'instrumental': 'Instrumental'
    };

    if (genreMap[normalized]) return genreMap[normalized];
    
    for (const [key, value] of Object.entries(genreMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, []);

  // Sub-genre normalization
  const normalizeSubGenre = useCallback((subGenre: string): string => {
    const normalized = subGenre
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, []);

  // Clean content style string - remove quotes, brackets, and extra whitespace
  const cleanContentStyle = useCallback((style: string): string => {
    return style
      .replace(/[\[\]"']/g, '') // Remove brackets and quotes
      .trim();
  }, []);

  // Get content styles with counts
  const getContentStylesWithCounts = useCallback(() => {
    const styleCount = new Map<string, number>();
    const totalVideos = videos.length;
    
    videos.forEach(video => {
      if (video.content_style) {
        // Clean the entire string first, then split
        const cleanedStyle = cleanContentStyle(video.content_style);
        const styles = cleanedStyle.includes(',') 
          ? cleanedStyle.split(',').map(s => s.trim())
          : [cleanedStyle];
        
        styles.forEach(style => {
          if (style && style !== '') {
            styleCount.set(style, (styleCount.get(style) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(styleCount.entries())
      .map(([style, count]) => ({ 
        style, 
        count, 
        percentage: totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count);
  }, [videos, cleanContentStyle]);

  // Get unique values with counts - handles comma-separated values
  const getUniqueValues = useCallback((field: keyof Video) => {
    const valueCount = new Map<string, number>();
    const totalVideos = videos.length;
    
    videos.forEach(video => {
      const value = video[field];
      if (value && typeof value === 'string') {
        const values = value.includes(',') 
          ? value.split(',').map(v => v.trim())
          : [value];
        
        values.forEach(val => {
          if (val && val !== '') {
            // Normalize gender values
            const normalizedVal = field === 'gender' 
              ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() 
              : val;
            valueCount.set(normalizedVal, (valueCount.get(normalizedVal) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(valueCount.entries())
      .map(([value, count]) => ({ 
        value, 
        count, 
        percentage: totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count);
  }, [videos]);

  // Get genres with counts
  const getGenresWithCounts = useCallback(() => {
    const genreCount = new Map<string, number>();
    const totalVideos = videos.length;
    
    videos.forEach(video => {
      if (video.genre) {
        // Use JSON parser to extract genre names without confidence scores
        const genres = parseGenreJson(video.genre);
        
        genres.forEach(genre => {
          if (genre && genre !== '') {
            genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(genreCount.entries())
      .map(([genre, count]) => ({ 
        genre, 
        count, 
        percentage: totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count);
  }, [videos]);

  // Get sub-genres with counts
  const getSubGenresWithCounts = useCallback(() => {
    const subGenreCount = new Map<string, number>();
    const totalVideos = videos.length;
    
    videos.forEach(video => {
      if (video.sub_genre) {
        // Use JSON parser to extract sub-genre names without confidence scores
        const subGenres = parseSubGenreJson(video.sub_genre);
        
        subGenres.forEach(subGenre => {
          if (subGenre && subGenre !== '') {
            subGenreCount.set(subGenre, (subGenreCount.get(subGenre) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(subGenreCount.entries())
      .map(([subGenre, count]) => ({ 
        subGenre, 
        count, 
        percentage: totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0 
      }))
      .sort((a, b) => b.count - a.count);
  }, [videos]);

  const availableGenres = useMemo(() => getGenresWithCounts(), [getGenresWithCounts]);
  const availableSubGenres = useMemo(() => getSubGenresWithCounts(), [getSubGenresWithCounts]);
  const availableContentStyles = useMemo(() => getContentStylesWithCounts(), [getContentStylesWithCounts]);
  const availableGenders = useMemo(() => getUniqueValues('gender'), [getUniqueValues]);

  // Filter matching function
  const matchesGenreFilters = useCallback((content: ContentItem) => {
    if (filters.genre.length === 0) return true;
    
    const contentGenre = content.genre || '';
    
    // Handle photo carousel JSON format or regular string format
    let contentGenres: string[];
    if (contentGenre.includes('{') && contentGenre.includes(':')) {
      // JSON format for photo carousels
      contentGenres = parseGenreJson(contentGenre);
    } else {
      // Regular string format for videos
      contentGenres = contentGenre
        .split(/[,/]/)
        .map(g => g.trim().replace(/['"]/g, '').replace(/\s+/g, ' ').trim())
        .filter(g => g && g.length > 0);
    }
    
    return filters.genre.some(selectedGenre => 
      contentGenres.some(contentG => 
        contentG.toLowerCase() === selectedGenre.toLowerCase()
      )
    );
  }, [filters.genre]);

  // Filter matching for sub-genres
  const matchesSubGenreFilters = useCallback((content: ContentItem) => {
    if (filters.subGenre.length === 0) return true;
    
    const contentSubGenre = content.sub_genre || '';
    
    // Handle photo carousel JSON format or regular string format
    let contentSubGenres: string[];
    if (contentSubGenre.includes('{') && contentSubGenre.includes(':')) {
      // JSON format for photo carousels
      contentSubGenres = parseSubGenreJson(contentSubGenre);
    } else {
      // Regular string format for videos
      contentSubGenres = contentSubGenre
        .split(/[,/]/)
        .map(sg => sg.trim().replace(/['"]/g, '').replace(/\s+/g, ' ').trim())
        .filter(sg => sg && sg.length > 0);
    }
    
    return filters.subGenre.some(selectedSubGenre => 
      contentSubGenres.some(contentSG => 
        contentSG.toLowerCase() === selectedSubGenre.toLowerCase()
      )
    );
  }, [filters.subGenre]);

  // Get minimum viral score for performance range
  const getMinViralScore = useCallback((range: string): number => {
    switch (range) {
      case 'viral': return 0.8;
      case 'trending': return 0.6;
      case 'popular': return 0.4;
      case 'growing': return 0.0;
      default: return -1; // 'all' - no filter
    }
  }, []);

  // Get follower range bounds
  const getFollowerBounds = useCallback((range: string): { min: number; max: number } => {
    switch (range) {
      case 'micro': return { min: 0, max: 10000 };
      case 'small': return { min: 10000, max: 100000 };
      case 'medium': return { min: 100000, max: 500000 };
      case 'large': return { min: 500000, max: 1000000 };
      case 'mega': return { min: 1000000, max: Infinity };
      default: return { min: -1, max: -1 }; // 'all' - no filter
    }
  }, []);

  // Search filter function - matches against genre, artist, caption, handle, content_style
  const matchesSearch = useCallback((content: ContentItem, query: string): boolean => {
    if (!query || query.trim() === '') return true;
    
    const searchLower = query.toLowerCase().trim();
    
    // Check genre
    if (content.genre?.toLowerCase().includes(searchLower)) return true;
    
    // Check sub_genre
    if (content.sub_genre?.toLowerCase().includes(searchLower)) return true;
    
    // Check artist
    if ('Artist' in content && content.Artist?.toLowerCase().includes(searchLower)) return true;
    
    // Check caption
    if (content.caption?.toLowerCase().includes(searchLower)) return true;
    
    // Check handle
    if ('handle' in content && content.handle?.toLowerCase().includes(searchLower)) return true;
    
    // Check content_style
    if (content.content_style?.toLowerCase().includes(searchLower)) return true;
    
    // Check hook
    if ('hook' in content && content.hook?.toLowerCase().includes(searchLower)) return true;
    
    return false;
  }, []);

  // Apply filters to category content
  // skipContentStyleFilter: when true, skip content style filtering (useful for content-style categories)
  const filterCategoryVideos = useCallback((items: Video[], query?: string, skipContentStyleFilter?: boolean) => {
    let filtered = items;
    
    // Search filtering is handled at the database level (getSearchMatchingIds)
    // so we skip client-side search here to avoid discarding valid results
    
    // Apply platform filter
    if (filters.platform.length > 0) {
      filtered = filtered.filter(item => {
        const isReel = item.is_reel === true;
        if (filters.platform.includes('tiktok') && !isReel) return true;
        if (filters.platform.includes('reels') && isReel) return true;
        return false;
      });
    }
    
    // Apply genre filter
    if (filters.genre.length > 0) {
      filtered = filtered.filter(matchesGenreFilters);
    }
    
    // Apply sub-genre filter
    if (filters.subGenre.length > 0) {
      filtered = filtered.filter(matchesSubGenreFilters);
    }
    
    // Apply content style filter (skip if requested - for content-style categories)
    if (!skipContentStyleFilter && filters.contentStyle.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.content_style) return false;
        const cleanedStyle = cleanContentStyle(item.content_style);
        const itemStyles = cleanedStyle.includes(',') 
          ? cleanedStyle.split(',').map(s => s.trim().toLowerCase())
          : [cleanedStyle.toLowerCase()];
        
        return filters.contentStyle.some(selectedStyle => 
          itemStyles.some(itemStyle => 
            itemStyle === selectedStyle.toLowerCase() ||
            itemStyle.includes(selectedStyle.toLowerCase()) ||
            selectedStyle.toLowerCase().includes(itemStyle)
          )
        );
      });
    }
    
    // Apply performance filter and sort by outliar_score
    if (filters.performanceRange !== 'all') {
      const minScore = getMinViralScore(filters.performanceRange);
      filtered = filtered.filter(item => {
        const viralScore = item.outliar_score ?? 0;
        return viralScore >= minScore;
      });
      // Sort by outliar_score descending
      filtered = [...filtered].sort((a, b) => (b.outliar_score ?? 0) - (a.outliar_score ?? 0));
    }
    
    // Apply follower filter
    if (filters.followerRange !== 'all') {
      const { min, max } = getFollowerBounds(filters.followerRange);
      filtered = filtered.filter(item => {
        const followers = item.profile_followers ?? 0;
        return followers >= min && followers < max;
      });
    }
    
    // Apply effort filter
    if (filters.effort !== 'all') {
      filtered = filtered.filter(item => {
        const effort = (item.ai_effort || '').toLowerCase();
        return effort === filters.effort;
      });
    }
    
    // Apply gender filter
    if (filters.gender.length > 0) {
      filtered = filtered.filter(item => {
        const itemGender = (item.gender || '').toLowerCase().trim();
        return filters.gender.some(g => itemGender === g.toLowerCase().trim());
      });
    }
    
    return filtered;
  }, [searchQuery, filters.genre, filters.subGenre, filters.contentStyle, filters.platform, filters.performanceRange, filters.followerRange, filters.effort, filters.gender, matchesSearch, matchesGenreFilters, matchesSubGenreFilters, getMinViralScore, getFollowerBounds, cleanContentStyle]);

  const applyFilters = () => {
    setFilters({ ...pendingFilters });
  };

  const hasFilterChanges = useMemo(() => {
    return JSON.stringify(filters) !== JSON.stringify(pendingFilters);
  }, [filters, pendingFilters]);

  const filterCategoryPhotoCarouselsWithSearch = useCallback((items: PhotoCarousel[], query?: string) => {
    let filtered = items;
    
    // Search filtering is handled at the database level (getSearchMatchingIds)
    // so we skip client-side search here to avoid discarding valid results
    
    // Photo carousels are only from TikTok, so filter them out if only reels is selected
    if (filters.platform.length > 0 && !filters.platform.includes('tiktok')) {
      return [];
    }
    
    // Apply genre filter
    if (filters.genre.length > 0) {
      filtered = filtered.filter(matchesGenreFilters);
    }
    
    // Apply sub-genre filter
    if (filters.subGenre.length > 0) {
      filtered = filtered.filter(matchesSubGenreFilters);
    }
    
    // Apply performance filter and sort by outliar_score for photo carousels
    if (filters.performanceRange !== 'all') {
      const minScore = getMinViralScore(filters.performanceRange);
      filtered = filtered.filter(item => {
        const viralScore = item.outliar_score ?? 0;
        return viralScore >= minScore;
      });
      // Sort by outliar_score descending
      filtered = [...filtered].sort((a, b) => ((b.outliar_score ?? 0) - (a.outliar_score ?? 0)));
    }
    
    // Apply follower filter
    if (filters.followerRange !== 'all') {
      const { min, max } = getFollowerBounds(filters.followerRange);
      filtered = filtered.filter(item => {
        const followers = item.profile_followers ?? 0;
        return followers >= min && followers < max;
      });
    }
    
    // Apply gender filter
    if (filters.gender.length > 0) {
      filtered = filtered.filter(item => {
        const itemGender = (item.gender || '').toLowerCase().trim();
        return filters.gender.some(g => itemGender === g.toLowerCase().trim());
      });
    }
    
    return filtered;
  }, [searchQuery, filters.genre, filters.subGenre, filters.platform, filters.performanceRange, filters.followerRange, filters.effort, filters.gender, matchesSearch, matchesGenreFilters, matchesSubGenreFilters, getMinViralScore, getFollowerBounds]);

  return {
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
    filterCategoryPhotoCarousels: filterCategoryPhotoCarouselsWithSearch,
    matchesSearch
  };
};
