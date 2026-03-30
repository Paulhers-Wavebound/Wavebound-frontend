import { supabase } from '../integrations/supabase/client';
import { Video, PhotoCarousel } from '../types/content';
import { INITIAL_ITEMS_PER_CATEGORY } from '../utils/categoryConfig';

interface ThumbnailData {
  url?: string | null;
  thumbnail_url?: string | null;
}

export type SortOption = 'views' | 'date_posted' | 'viral_score';
export type DateRange = 'week' | 'year' | null;

const getDateCutoff = (dateRange: DateRange): string | null => {
  if (!dateRange) return null;
  const cutoff = new Date();
  if (dateRange === 'week') cutoff.setDate(cutoff.getDate() - 7);
  else if (dateRange === 'year') cutoff.setFullYear(cutoff.getFullYear() - 1);
  return cutoff.toISOString();
};

// Helper to find video IDs matching a search query across AI + Video tables
const getSearchMatchingIds = async (
  searchQuery: string,
  platform: 'tiktok' | 'reels'
): Promise<number[]> => {
  const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const aiTable = platform === 'tiktok' ? '0.1. Table 5 - Ai - TikTok' : '0.1. Table 5.2 - Ai - Reels';
  const videoTable = platform === 'tiktok' ? '0.1. Table 2 - Video - TikTok' : '0.1. Table 2.2 - Video - Reels';

  const aiColumns = ['context', 'description', 'label_reasons', 'evidence_pointers', 'effort', 'hook'];
  const aiOrParts: string[] = [];
  for (const term of terms) {
    for (const col of aiColumns) {
      aiOrParts.push(`${col}.ilike.%${term}%`);
    }
  }

  const captionOrParts = terms.map(t => `caption.ilike.%${t}%`);

  const soundTable = platform === 'tiktok' 
    ? '0.1. Table 3 - Sound - TikTok' 
    : '0.1. Table 3.2 - Sound - Reels';
  const soundColumns = ['instruments', 'voices', 'mood', 'technical_feedback'];
  const soundOrParts: string[] = [];
  for (const term of terms) {
    for (const col of soundColumns) {
      soundOrParts.push(`${col}.ilike.%${term}%`);
    }
  }

  const [aiResult, videoResult, soundResult] = await Promise.all([
    supabase.from(aiTable).select('video_id').or(aiOrParts.join(',')).limit(2000),
    supabase.from(videoTable).select('id').or(captionOrParts.join(',')).limit(2000),
    supabase.from(soundTable).select('video_id').or(soundOrParts.join(',')).limit(2000),
  ]);

  const ids = new Set<number>();
  (aiResult.data || []).forEach(r => r.video_id && ids.add(r.video_id));
  (videoResult.data || []).forEach(r => r.id && ids.add(r.id));
  (soundResult.data || []).forEach(r => r.video_id && ids.add(r.video_id));

  return [...ids];
};

// Helper to fix Supabase storage URLs that are missing /public/ in the path
export const fixSupabaseStorageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // Check if URL is a Supabase storage URL missing /public/
  if (url.includes('supabase.co/storage/v1/object/') && !url.includes('/object/public/')) {
    // Insert /public/ after /object/
    return url.replace('/storage/v1/object/', '/storage/v1/object/public/');
  }
  return url;
};

// Helper to fetch and map TikTok videos from new normalized tables
export const fetchTikTokVideosWithJoins = async (
  limit: number = INITIAL_ITEMS_PER_CATEGORY,
  offset: number = 0,
  genres: string[] = [],
  contentStyles: string[] = [],
  sortBy: SortOption = 'views',
  subGenres: string[] = [],
  searchQuery: string = '',
  dateRange: DateRange = null
): Promise<Video[]> => {
  const effectiveSortBy: SortOption = dateRange ? sortBy : sortBy;
  const cutoff = getDateCutoff(dateRange);
  // We dedupe client-side (by embed URL), so we need to overfetch to reliably return `limit` items.
  const fetchMultiplier = 3;
  const fetchLimit = limit * fetchMultiplier;

  let videoIds: number[] = [];
  let videosData: any[] = [];

  // Pre-filter by genre at the DB level: query Sound table first for matching video IDs
  let genreFilteredIds: number[] | null = null;
  if (genres.length > 0 || subGenres.length > 0) {
    let soundQuery = supabase
      .from('0.1. Table 3 - Sound - TikTok')
      .select('video_id, genre, sub_genre');

    const orFilters: string[] = [];
    genres.forEach(g => orFilters.push(`genre.ilike.%${g}%`));
    subGenres.forEach(sg => orFilters.push(`sub_genre.ilike.%${sg}%`));
    if (orFilters.length > 0) {
      soundQuery = soundQuery.or(orFilters.join(','));
    }

    const { data: soundResults, error: soundError } = await soundQuery.limit(2000);
    if (soundError) throw soundError;
    genreFilteredIds = [...new Set((soundResults || []).map(r => r.video_id).filter(Boolean))] as number[];
    if (genreFilteredIds.length === 0) return [];
  }

  // Pre-filter by search query at DB level
  let searchFilteredIds: number[] | null = null;
  if (searchQuery.trim()) {
    searchFilteredIds = await getSearchMatchingIds(searchQuery, 'tiktok');
    if (searchFilteredIds.length === 0) return [];
  }

  // Combine genre + search pre-filters
  let preFilteredIds: number[] | null = null;
  if (genreFilteredIds && searchFilteredIds) {
    const genreSet = new Set(genreFilteredIds);
    preFilteredIds = searchFilteredIds.filter(id => genreSet.has(id));
    if (preFilteredIds.length === 0) return [];
  } else {
    preFilteredIds = genreFilteredIds || searchFilteredIds;
  }

  // If filtering by content style, query AI table first to get matching video IDs
  if (contentStyles.length > 0) {
    // Build OR filter for content styles using ilike
    let aiQuery = supabase
      .from('0.1. Table 5 - Ai - TikTok')
      .select('video_id, content_style');

    // Use or filter with ilike for each content style
    const styleFilters = contentStyles.map(s => `content_style.ilike.%${s}%`).join(',');
    aiQuery = aiQuery.or(styleFilters);

    // If genre/search pre-filter is active, restrict AI query to those IDs
    if (preFilteredIds) {
      aiQuery = aiQuery.in('video_id', preFilteredIds);
    }

    const { data: aiResults, error: aiError } = await aiQuery.limit(fetchLimit * 5);

    if (aiError) throw aiError;
    if (!aiResults || aiResults.length === 0) return [];

    // Get unique video IDs that match content style
    videoIds = [...new Set(aiResults.map(r => r.video_id).filter(Boolean))] as number[];

    if (videoIds.length === 0) return [];

    // Now fetch videos for these IDs
    let videoQuery = supabase
      .from('0.1. Table 2 - Video - TikTok')
      .select('*')
      .in('id', videoIds);

    if (cutoff) videoQuery = videoQuery.gte('date_posted', cutoff);

    if (effectiveSortBy === 'date_posted') {
      videoQuery = videoQuery
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else if (effectiveSortBy === 'viral_score') {
      videoQuery = videoQuery
        .order('viral_score', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else {
      videoQuery = videoQuery
        .order('video_views', { ascending: false })
        .order('id', { ascending: false });
    }

    // Overfetch because we dedupe later
    const { data: vData, error: vError } = await videoQuery.limit(fetchLimit);
    if (vError) throw vError;
    videosData = vData || [];
    videoIds = videosData.map(v => v.id);
  } else if (preFilteredIds) {
    // Genre filter only (no content style) - fetch videos by pre-filtered IDs
    let videoQuery = supabase
      .from('0.1. Table 2 - Video - TikTok')
      .select('*')
      .in('id', preFilteredIds);

    if (cutoff) videoQuery = videoQuery.gte('date_posted', cutoff);

    if (effectiveSortBy === 'date_posted') {
      videoQuery = videoQuery
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else if (effectiveSortBy === 'viral_score') {
      videoQuery = videoQuery
        .order('viral_score', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else {
      videoQuery = videoQuery
        .order('video_views', { ascending: false })
        .order('id', { ascending: false });
    }

    const { data: vData, error: vError } = await videoQuery.range(offset, offset + fetchLimit - 1);
    if (vError) throw vError;
    if (!vData || vData.length === 0) return [];
    videosData = vData;
    videoIds = videosData.map(v => v.id);
  } else {
    // No content style filter - fetch videos directly
    let query = supabase
      .from('0.1. Table 2 - Video - TikTok')
      .select('*');

    if (cutoff) query = query.gte('date_posted', cutoff);

    if (effectiveSortBy === 'date_posted') {
      query = query
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else if (effectiveSortBy === 'viral_score') {
      query = query
        .order('viral_score', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else {
      query = query
        .order('video_views', { ascending: false })
        .order('id', { ascending: false });
    }

    // Overfetch because we dedupe later
    const { data: vData, error: videoError } = await query.range(offset, offset + fetchLimit - 1);

    if (videoError) throw videoError;
    if (!vData || vData.length === 0) return [];

    videosData = vData;
    videoIds = videosData.map(v => v.id);
  }

  if (videoIds.length === 0) return [];

  // Fetch related data in parallel
  const [aiData, soundData, profileData, assetsData] = await Promise.all([
    supabase
      .from('0.1. Table 5 - Ai - TikTok')
      .select('video_id, content_style, sub_style, hook, context, description, effort, label_reasons, evidence_pointers')
      .in('video_id', videoIds),
    supabase
      .from('0.1. Table 3 - Sound - TikTok')
      .select('video_id, genre, sub_genre, instruments, voices, mood, technical_feedback, lyric_analysis')
      .in('video_id', videoIds),
    supabase
      .from('0.1. Table 1 - Profile - TikTok')
      .select('video_id, handle, profile_url, profile_followers, avatar_url, gender, median_views')
      .in('video_id', videoIds),
    supabase
      .from('0.1. Table 4 - Assets - TikTok')
      .select('video_id, thumbnail_url')
      .in('video_id', videoIds)
  ]);

  // Create lookup maps
  const aiMap = new Map<number, any>();
  (aiData.data || []).forEach((item: any) => {
    if (item.video_id) aiMap.set(item.video_id, item);
  });

  const soundMap = new Map<number, any>();
  (soundData.data || []).forEach((item: any) => {
    if (item.video_id) soundMap.set(item.video_id, item);
  });

  const profileMap = new Map<number, any>();
  (profileData.data || []).forEach((item: any) => {
    if (item.video_id) profileMap.set(item.video_id, item);
  });

  const thumbnailMap = new Map<number, string | null>();
  (assetsData.data || []).forEach((item: any) => {
    if (item.video_id && item.thumbnail_url && !thumbnailMap.has(item.video_id)) {
      // Validate thumbnail_url - accept Supabase storage URLs and common image extensions
      const url = item.thumbnail_url;
      if (url && (
        url.includes('supabase.co/storage/') || 
        url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif')
      )) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });

  // Combine all data and deduplicate by embedded URL
  const seenUrls = new Set<string>();
  let videos: Video[] = videosData.map((video: any) => {
    const ai = aiMap.get(video.id) || {};
    const sound = soundMap.get(video.id) || {};
    const profile = profileMap.get(video.id) || {};

    return {
      id: video.id,
      video_url: video.video_url,
      embedded_ulr: video.video_embedded_url,
      video_views: video.video_views || 0,
      video_likes: video.video_likes || 0,
      video_shares: video.video_shares || 0,
      video_saves: video.video_saves || 0,
      comments: video.video_comments,
      caption: video.caption,
      date_posted: video.date_posted,
      duration: video.duration,
      hashtags: video.hashtags,
      outliar_score: video.viral_score || 0,
      viral_score: video.viral_score,
      performance_multiplier: video.performance_multiplier,
      // From AI table
      content_style: ai.content_style,
      sub_style: ai.sub_style,
      hook: ai.hook,
      context: ai.context,
      description: ai.description,
      ai_effort: ai.effort,
      label_reasons: ai.label_reasons,
      evidence_pointers: ai.evidence_pointers,
      // From Sound table
      genre: sound.genre,
      sub_genre: sound.sub_genre,
      instruments: sound.instruments,
      voices: sound.voices,
      mood: sound.mood,
      technical_feedback: sound.technical_feedback,
      lyric_analysis: sound.lyric_analysis,
      // From Profile table
      handle: profile.handle,
      profile_url: profile.profile_url,
      profile_followers: profile.profile_followers || 0,
      avatar_url: profile.avatar_url,
      gender: profile.gender,
      median_views: profile.median_views,
      // Thumbnail
      thumbnail_url: thumbnailMap.get(video.id) || null,
      gif_url: null,
      is_reel: false,
    };
  }).filter(video => {
    const url = video.embedded_ulr || video.video_url || String(video.id);
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });

  // Apply STRICT genre/sub-genre filter - match by genre OR sub-genre
  if (genres.length > 0 || subGenres.length > 0) {
    videos = videos.filter(v => {
      // Check main genre match
      let hasGenreMatch = false;
      if (genres.length > 0 && v.genre) {
        try {
          const genreObj = typeof v.genre === 'string' 
            ? JSON.parse(v.genre.replace(/'/g, '"'))
            : v.genre;
          const videoGenres = Object.keys(genreObj || {}).map(g => g.toLowerCase().trim());
          hasGenreMatch = genres.some(filterGenre => 
            videoGenres.some(videoGenre => videoGenre === filterGenre.toLowerCase().trim())
          );
        } catch (e) {
          const videoGenres = (v.genre || '')
            .split(/[,/]/)
            .map((g: string) => g.trim().toLowerCase().replace(/['"{}]/g, '').split(':')[0].trim())
            .filter((g: string) => g);
          hasGenreMatch = genres.some(g => videoGenres.includes(g.toLowerCase().trim()));
        }
      }
      
      // Check sub-genre match
      let hasSubGenreMatch = false;
      if (subGenres.length > 0 && v.sub_genre) {
        try {
          const subGenreObj = typeof v.sub_genre === 'string' 
            ? JSON.parse(v.sub_genre.replace(/'/g, '"'))
            : v.sub_genre;
          const videoSubGenres = Object.keys(subGenreObj || {}).map(sg => sg.toLowerCase().trim());
          hasSubGenreMatch = subGenres.some(filterSubGenre => 
            videoSubGenres.some(videoSubGenre => videoSubGenre === filterSubGenre.toLowerCase().trim())
          );
        } catch (e) {
          const videoSubGenres = (v.sub_genre || '')
            .split(/[,/]/)
            .map((sg: string) => sg.trim().toLowerCase().replace(/['"{}]/g, '').split(':')[0].trim())
            .filter((sg: string) => sg);
          hasSubGenreMatch = subGenres.some(sg => videoSubGenres.includes(sg.toLowerCase().trim()));
        }
      }
      
      // Match if EITHER genre OR sub-genre matches
      return hasGenreMatch || hasSubGenreMatch;
    });
  }

  // Cap to the requested page size (we overfetch for dedupe)
  return videos.slice(0, limit);
};

// Helper to fetch and map Instagram Reels from new normalized tables
export const fetchReelsWithJoins = async (
  limit: number = INITIAL_ITEMS_PER_CATEGORY,
  offset: number = 0,
  genres: string[] = [],
  contentStyles: string[] = [],
  sortBy: SortOption = 'views',
  subGenres: string[] = [],
  searchQuery: string = '',
  dateRange: DateRange = null
): Promise<Video[]> => {
  const effectiveSortBy: SortOption = dateRange ? sortBy : sortBy;
  const cutoff = getDateCutoff(dateRange);
  // We dedupe client-side (by embed URL), so we need to overfetch to reliably return `limit` items.
  const fetchMultiplier = 3;
  const fetchLimit = limit * fetchMultiplier;

  let reelIds: number[] = [];
  let reelsData: any[] = [];

  // Pre-filter by genre at the DB level: query Sound table first for matching reel IDs
  let genreFilteredIds: number[] | null = null;
  if (genres.length > 0 || subGenres.length > 0) {
    let soundQuery = supabase
      .from('0.1. Table 3.2 - Sound - Reels')
      .select('video_id, genre, sub_genre');

    const orFilters: string[] = [];
    genres.forEach(g => orFilters.push(`genre.ilike.%${g}%`));
    subGenres.forEach(sg => orFilters.push(`sub_genre.ilike.%${sg}%`));
    if (orFilters.length > 0) {
      soundQuery = soundQuery.or(orFilters.join(','));
    }

    const { data: soundResults, error: soundError } = await soundQuery.limit(2000);
    if (soundError) throw soundError;
    genreFilteredIds = [...new Set((soundResults || []).map(r => r.video_id).filter(Boolean))] as number[];
    if (genreFilteredIds.length === 0) return [];
  }

  // Pre-filter by search query at DB level
  let searchFilteredIds: number[] | null = null;
  if (searchQuery.trim()) {
    searchFilteredIds = await getSearchMatchingIds(searchQuery, 'reels');
    if (searchFilteredIds.length === 0) return [];
  }

  // Combine genre + search pre-filters
  let preFilteredIds: number[] | null = null;
  if (genreFilteredIds && searchFilteredIds) {
    const genreSet = new Set(genreFilteredIds);
    preFilteredIds = searchFilteredIds.filter(id => genreSet.has(id));
    if (preFilteredIds.length === 0) return [];
  } else {
    preFilteredIds = genreFilteredIds || searchFilteredIds;
  }

  // If filtering by content style, query AI table first to get matching reel IDs
  if (contentStyles.length > 0) {
    let aiQuery = supabase
      .from('0.1. Table 5.2 - Ai - Reels')
      .select('video_id, content_style');

    const styleFilters = contentStyles.map(s => `content_style.ilike.%${s}%`).join(',');
    aiQuery = aiQuery.or(styleFilters);

    if (preFilteredIds) {
      aiQuery = aiQuery.in('video_id', genreFilteredIds);
    }

    const { data: aiResults, error: aiError } = await aiQuery.limit(fetchLimit * 5);

    if (aiError) throw aiError;
    if (!aiResults || aiResults.length === 0) return [];

    reelIds = [...new Set(aiResults.map(r => r.video_id).filter(Boolean))] as number[];

    if (reelIds.length === 0) return [];

    let reelQuery = supabase
      .from('0.1. Table 2.2 - Video - Reels')
      .select('*')
      .in('id', reelIds);

    if (cutoff) reelQuery = reelQuery.gte('date_posted', cutoff);

    if (effectiveSortBy === 'date_posted') {
      reelQuery = reelQuery
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else if (effectiveSortBy === 'viral_score') {
      reelQuery = reelQuery
        .order('viral_score', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else {
      reelQuery = reelQuery
        .order('video_views', { ascending: false })
        .order('id', { ascending: false });
    }

    // Overfetch because we dedupe later
    const { data: rData, error: rError } = await reelQuery.limit(fetchLimit);
    if (rError) throw rError;
    reelsData = rData || [];
    reelIds = reelsData.map(r => r.id);
  } else if (preFilteredIds) {
    // Genre filter only (no content style) - fetch reels by pre-filtered IDs
    let reelQuery = supabase
      .from('0.1. Table 2.2 - Video - Reels')
      .select('*')
      .in('id', preFilteredIds);

    if (cutoff) reelQuery = reelQuery.gte('date_posted', cutoff);

    if (effectiveSortBy === 'date_posted') {
      reelQuery = reelQuery
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else if (effectiveSortBy === 'viral_score') {
      reelQuery = reelQuery
        .order('viral_score', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else {
      reelQuery = reelQuery
        .order('video_views', { ascending: false })
        .order('id', { ascending: false });
    }

    const { data: rData, error: rError } = await reelQuery.range(offset, offset + fetchLimit - 1);
    if (rError) throw rError;
    if (!rData || rData.length === 0) return [];
    reelsData = rData;
    reelIds = reelsData.map(r => r.id);
  } else {
    // No content style filter - fetch reels directly
    let query = supabase
      .from('0.1. Table 2.2 - Video - Reels')
      .select('*');

    if (cutoff) query = query.gte('date_posted', cutoff);

    if (effectiveSortBy === 'date_posted') {
      query = query
        .order('date_posted', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else if (effectiveSortBy === 'viral_score') {
      query = query
        .order('viral_score', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });
    } else {
      query = query
        .order('video_views', { ascending: false })
        .order('id', { ascending: false });
    }

    // Overfetch because we dedupe later
    const { data: rData, error: reelError } = await query.range(offset, offset + fetchLimit - 1);

    if (reelError) throw reelError;
    if (!rData || rData.length === 0) return [];

    reelsData = rData;
    reelIds = reelsData.map(r => r.id);
  }

  if (reelIds.length === 0) return [];

  // Fetch related data in parallel
  const [aiData, soundData, profileData, assetsData, gifAssetsData] = await Promise.all([
    supabase
      .from('0.1. Table 5.2 - Ai - Reels')
      .select('video_id, content_style, sub_style, hook, context, description, effort, label_reasons, evidence_pointers, social_context_&_mood')
      .in('video_id', reelIds),
    supabase
      .from('0.1. Table 3.2 - Sound - Reels')
      .select('video_id, genre, sub_genre, instruments, voices, mood, technical_feedback, lyric_analysis')
      .in('video_id', reelIds),
    supabase
      .from('0.1. Table 1.2 - Profile - Instagram')
      .select('video_id, handle, profile_url, profile_followers, avatar_url, gender, median_views')
      .in('video_id', reelIds),
    supabase
      .from('0.1. Table 4.2 - Assets - Reels')
      .select('video_id, thumbnail_url')
      .in('video_id', reelIds),
    supabase
      .from('media_assets_gif_thumbnail_Reels')
      .select('video_id, url, thumbnail_url')
      .in('video_id', reelIds)
  ]);

  // Create lookup maps
  const aiMap = new Map<number, any>();
  (aiData.data || []).forEach((item: any) => {
    if (item.video_id) aiMap.set(item.video_id, item);
  });

  const soundMap = new Map<number, any>();
  (soundData.data || []).forEach((item: any) => {
    if (item.video_id) soundMap.set(item.video_id, item);
  });

  const profileMap = new Map<number, any>();
  (profileData.data || []).forEach((item: any) => {
    if (item.video_id) profileMap.set(item.video_id, item);
  });

  // Build thumbnail map - prioritize 0.1. Table 4.2 - Assets - Reels, then fallback to media_assets_gif_thumbnail_Reels
  const thumbnailMap = new Map<number, string | null>();
  
  // First, add thumbnails from 0.1. Table 4.2 - Assets - Reels (primary source)
  (assetsData.data || []).forEach((item: any) => {
    if (item.video_id && item.thumbnail_url && !thumbnailMap.has(item.video_id)) {
      const url = item.thumbnail_url;
      if (url && (
        url.includes('supabase.co/storage/') || 
        url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif')
      )) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });
  
  // Then add from gif assets table for any missing thumbnails (fallback)
  (gifAssetsData.data || []).forEach((item: any) => {
    if (item.video_id && !thumbnailMap.has(item.video_id)) {
      const url = item.thumbnail_url || item.url;
      if (url && (
        url.includes('supabase.co/storage/') || 
        url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif')
      )) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });

  // Combine all data and deduplicate by embedded URL
  const seenUrls = new Set<string>();
  let reels: Video[] = reelsData.map((reel: any) => {
    const ai = aiMap.get(reel.id) || {};
    const sound = soundMap.get(reel.id) || {};
    const profile = profileMap.get(reel.id) || {};

    return {
      id: reel.id,
      video_url: reel.video_url,
      video_file_url: undefined,
      embedded_ulr: reel.video_embedded_url,
      video_views: reel.video_views || 0,
      video_likes: reel.video_likes || 0,
      video_shares: reel.video_shares || 0,
      video_saves: reel.video_saves || 0,
      comments: reel.video_comments,
      caption: reel.caption,
      date_posted: reel.date_posted,
      duration: reel.duration,
      hashtags: reel.hashtags,
      outliar_score: reel.viral_score || 0,
      viral_score: reel.viral_score,
      performance_multiplier: reel.performance_multiplier,
      // From AI table
      content_style: ai.content_style,
      sub_style: ai.sub_style,
      hook: ai.hook,
      context: ai.context,
      description: ai.description,
      ai_effort: ai.effort,
      label_reasons: ai.label_reasons,
      evidence_pointers: ai.evidence_pointers,
      social_context_mood: ai['social_context_&_mood'],
      // From Sound table
      genre: sound.genre,
      sub_genre: sound.sub_genre,
      instruments: sound.instruments,
      voices: sound.voices,
      mood: sound.mood,
      technical_feedback: sound.technical_feedback,
      lyric_analysis: sound.lyric_analysis,
      // From Profile table
      handle: profile.handle,
      profile_url: profile.profile_url,
      profile_followers: profile.profile_followers || 0,
      avatar_url: profile.avatar_url,
      gender: profile.gender,
      median_views: profile.median_views,
      // Thumbnail
      thumbnail_url: thumbnailMap.get(reel.id) || null,
      gif_url: null,
      is_reel: true,
    };
  }).filter(reel => {
    const url = reel.embedded_ulr || reel.video_url || String(reel.id);
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });

  // Apply STRICT genre/sub-genre filter - match by genre OR sub-genre
  if (genres.length > 0 || subGenres.length > 0) {
    reels = reels.filter(r => {
      // Check main genre match
      let hasGenreMatch = false;
      if (genres.length > 0 && r.genre) {
        try {
          const genreObj = typeof r.genre === 'string' 
            ? JSON.parse(r.genre.replace(/'/g, '"'))
            : r.genre;
          const reelGenres = Object.keys(genreObj || {}).map(g => g.toLowerCase().trim());
          hasGenreMatch = genres.some(filterGenre => 
            reelGenres.some(reelGenre => reelGenre === filterGenre.toLowerCase().trim())
          );
        } catch (e) {
          const reelGenres = (r.genre || '')
            .split(/[,/]/)
            .map((g: string) => g.trim().toLowerCase().replace(/['"{}]/g, '').split(':')[0].trim())
            .filter((g: string) => g);
          hasGenreMatch = genres.some(g => reelGenres.includes(g.toLowerCase().trim()));
        }
      }
      
      // Check sub-genre match
      let hasSubGenreMatch = false;
      if (subGenres.length > 0 && r.sub_genre) {
        try {
          const subGenreObj = typeof r.sub_genre === 'string' 
            ? JSON.parse(r.sub_genre.replace(/'/g, '"'))
            : r.sub_genre;
          const reelSubGenres = Object.keys(subGenreObj || {}).map(sg => sg.toLowerCase().trim());
          hasSubGenreMatch = subGenres.some(filterSubGenre => 
            reelSubGenres.some(reelSubGenre => reelSubGenre === filterSubGenre.toLowerCase().trim())
          );
        } catch (e) {
          const reelSubGenres = (r.sub_genre || '')
            .split(/[,/]/)
            .map((sg: string) => sg.trim().toLowerCase().replace(/['"{}]/g, '').split(':')[0].trim())
            .filter((sg: string) => sg);
          hasSubGenreMatch = subGenres.some(sg => reelSubGenres.includes(sg.toLowerCase().trim()));
        }
      }
      
      // Match if EITHER genre OR sub-genre matches
      return hasGenreMatch || hasSubGenreMatch;
    });
  }

  // Cap to the requested page size (we overfetch for dedupe)
  return reels.slice(0, limit);
};

// Helper to fetch and map Photo Carousels from new normalized tables
export const fetchPhotoCarouselsWithJoins = async (
  limit: number = INITIAL_ITEMS_PER_CATEGORY,
  offset: number = 0,
  genres: string[] = [],
  subGenres: string[] = [],
  searchQuery: string = '',
  dateRange: DateRange = null
): Promise<PhotoCarousel[]> => {
  const cutoff = getDateCutoff(dateRange);
  // Pre-filter by genre/sub-genre at the DB level if provided
  let genreFilteredIds: number[] | null = null;
  if (genres.length > 0 || subGenres.length > 0) {
    let soundQuery = supabase
      .from('0.1. Table 3.1 - Sound - PC - TikTok')
      .select('video_id, genre, sub_genre');

    const orFilters: string[] = [];
    genres.forEach(g => orFilters.push(`genre.ilike.%${g}%`));
    subGenres.forEach(sg => orFilters.push(`sub_genre.ilike.%${sg}%`));
    if (orFilters.length > 0) {
      soundQuery = soundQuery.or(orFilters.join(','));
    }

    const { data: soundResults, error: soundError } = await soundQuery.limit(2000);
    if (soundError) throw soundError;
    genreFilteredIds = [...new Set((soundResults || []).map(r => r.video_id).filter(Boolean))] as number[];
    if (genreFilteredIds.length === 0) return [];
  }

  // Pre-filter by search query at DB level
  let searchFilteredIds: number[] | null = null;
  if (searchQuery.trim()) {
    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const captionOrParts = terms.map(t => `caption.ilike.%${t}%`);
    const hookOrParts = terms.map(t => `hook.ilike.%${t}%`);

    const [captionResult, aiResult] = await Promise.all([
      supabase.from('0.1. Table 2.1 - PC - TikTok').select('id').or(captionOrParts.join(',')).limit(500),
      supabase.from('0.1. Table 5.1 - Ai - PC - TikTok').select('photo_c_id').or(hookOrParts.join(',')).limit(500),
    ]);

    const ids = new Set<number>();
    (captionResult.data || []).forEach(r => r.id && ids.add(r.id));
    (aiResult.data || []).forEach(r => r.photo_c_id && ids.add(r.photo_c_id));
    searchFilteredIds = [...ids];
    if (searchFilteredIds.length === 0) return [];
  }

  // Combine genre + search pre-filters
  let preFilteredIds: number[] | null = null;
  if (genreFilteredIds && searchFilteredIds) {
    const genreSet = new Set(genreFilteredIds);
    preFilteredIds = searchFilteredIds.filter(id => genreSet.has(id));
    if (preFilteredIds.length === 0) return [];
  } else {
    preFilteredIds = genreFilteredIds || searchFilteredIds;
  }

  // Fetch from photo carousel table
  let carouselQuery = supabase
    .from('0.1. Table 2.1 - PC - TikTok')
    .select('*');

  if (cutoff) carouselQuery = carouselQuery.gte('date_posted', cutoff);
  carouselQuery = carouselQuery.order('photo_views', { ascending: false });

  if (preFilteredIds) {
    carouselQuery = carouselQuery.in('id', preFilteredIds);
  }

  const { data: carouselData, error: carouselError } = await carouselQuery.range(offset, offset + limit - 1);

  if (carouselError) throw carouselError;
  if (!carouselData || carouselData.length === 0) return [];

  const carouselIds = carouselData.map(c => c.id);

  // Fetch related data in parallel
  const [aiData, soundData, profileData, assetsData] = await Promise.all([
    supabase
      .from('0.1. Table 5.1 - Ai - PC - TikTok')
      .select('photo_c_id, hook, hook_text, gender, language')
      .in('photo_c_id', carouselIds),
    supabase
      .from('0.1. Table 3.1 - Sound - PC - TikTok')
      .select('video_id, genre, sub_genre, sound_url')
      .in('video_id', carouselIds),
    supabase
      .from('0.1. Table 1.1 - Profile - PC - TikTok')
      .select('video_id, handle, profile_url, profile_followers, avatar_url, profile_bio, median_views')
      .in('video_id', carouselIds),
    supabase
      .from('0.1. Table 4.1 - Assets - PC - TikTok')
      .select('video_id, thumbnail_url')
      .in('video_id', carouselIds)
  ]);

  // Create lookup maps
  const aiMap = new Map<number, any>();
  (aiData.data || []).forEach((item: any) => {
    if (item.photo_c_id) aiMap.set(item.photo_c_id, item);
  });

  const soundMap = new Map<number, any>();
  (soundData.data || []).forEach((item: any) => {
    if (item.video_id) soundMap.set(item.video_id, item);
  });

  const profileMap = new Map<number, any>();
  (profileData.data || []).forEach((item: any) => {
    if (item.video_id) profileMap.set(item.video_id, item);
  });

  const thumbnailMap = new Map<number, string | null>();
  (assetsData.data || []).forEach((item: any) => {
    if (item.video_id && item.thumbnail_url && !thumbnailMap.has(item.video_id)) {
      // Validate thumbnail_url - accept Supabase storage URLs and common image extensions
      const url = item.thumbnail_url;
      if (url && (
        url.includes('supabase.co/storage/') || 
        url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif')
      )) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });

  // Combine all data
  let carousels: PhotoCarousel[] = carouselData.map((carousel: any) => {
    const ai = aiMap.get(carousel.id) || {};
    const sound = soundMap.get(carousel.id) || {};
    const profile = profileMap.get(carousel.id) || {};

    return {
      id: carousel.id,
      embedded_url: carousel.post_url || '',
      photo_views: carousel.photo_views || 0,
      photo_likes: carousel.photo_likes || 0,
      photo_saves: carousel.photo_saves || 0,
      comments: carousel.photo_comments,
      caption: carousel.caption,
      date_posted: carousel.date_posted,
      hashtags: carousel.hashtags,
      outliar_score: carousel.viral_score || 0,
      performance_multiplier: carousel.performance_multiplier,
      // From AI table
      Hook: ai.hook,
      gender: ai.gender,
      // From Sound table
      genre: sound.genre,
      sub_genre: sound.sub_genre,
      sound_url: sound.sound_url,
      // From Profile table
      handle: profile.handle,
      profile_url: profile.profile_url,
      profile_followers: profile.profile_followers || 0,
      avatar_url: profile.avatar_url,
      profile_bio: profile.profile_bio,
      median_views: profile.median_views,
      // Thumbnail (use as photo_url_1)
      photo_url_1: thumbnailMap.get(carousel.id) || null,
      posts: 0,
      created_at: carousel.created_at,
    };
  });

  // Apply genre filter if provided
  if (genres.length > 0) {
    carousels = carousels.filter(c => {
      const carouselGenre = c.genre?.toLowerCase() || '';
      return genres.some(g => carouselGenre.includes(g.toLowerCase()));
    });
  }

  return carousels;
};

// Legacy functions for backwards compatibility - now use new tables

// Load videos with thumbnails from TikTok table
export const loadVideosWithThumbnails = async (
  query: any,
  limit: number = INITIAL_ITEMS_PER_CATEGORY
): Promise<Video[]> => {
  // Use new fetch function
  return fetchTikTokVideosWithJoins(limit);
};

// Load reels with thumbnails
export const loadReelsWithThumbnails = async (
  query: any,
  limit: number = INITIAL_ITEMS_PER_CATEGORY
): Promise<Video[]> => {
  // Use new fetch function
  return fetchReelsWithJoins(limit);
};

// Load photo carousels
export const loadPhotoCarousels = async (
  scoreRange?: { min: number; max: number },
  genres: string[] = [],
  limit: number = INITIAL_ITEMS_PER_CATEGORY,
  offset: number = 0
): Promise<PhotoCarousel[]> => {
  return fetchPhotoCarouselsWithJoins(limit, offset, genres);
};

// Load content by style (videos + reels)
// Fetches all matching content for the style to populate category fully
export const loadContentByStyle = async (
  contentStyle: string,
  limit: number = INITIAL_ITEMS_PER_CATEGORY,
  offset: number = 0,
  genres: string[] = [],
  platforms: string[] = [],
  subGenres: string[] = [],
  searchQuery: string = '',
  dateRange: DateRange = null,
  sortBy: SortOption = 'views'
): Promise<Video[]> => {
  const shouldFetchTikTok = platforms.length === 0 || platforms.includes('tiktok');
  const shouldFetchReels = platforms.length === 0 || platforms.includes('reels');
  const effectiveSortBy: SortOption = dateRange ? sortBy : 'date_posted';

  // When genre filtering is active, fetch much more because genre filtering
  // happens client-side and may discard most results.
  const hasGenreFilter = genres.length > 0;
  const fetchLimit = dateRange
    ? Math.max(limit, 1000)
    : hasGenreFilter ? Math.max(limit, 500) : Math.max(limit, 100);

  const promises: Promise<Video[]>[] = [];

  if (shouldFetchTikTok) {
    promises.push(fetchTikTokVideosWithJoins(fetchLimit, offset, genres, [contentStyle], effectiveSortBy, subGenres, searchQuery, dateRange));
  }

  if (shouldFetchReels) {
    promises.push(fetchReelsWithJoins(fetchLimit, offset, genres, [contentStyle], effectiveSortBy, subGenres, searchQuery, dateRange));
  }

  const results = await Promise.all(promises);
  const combined = results.flat();

  // Deduplicate by embedded URL
  const seen = new Set<string>();
  const deduped = combined.filter(v => {
    const key = v.embedded_ulr || v.video_url || String(v.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort based on effective sort option
  if (effectiveSortBy === 'viral_score') {
    return deduped
      .sort((a, b) => (b.outliar_score || 0) - (a.outliar_score || 0))
      .slice(0, limit);
  }
  if (effectiveSortBy === 'views' || dateRange) {
    return deduped
      .sort((a, b) => (b.video_views || 0) - (a.video_views || 0))
      .slice(0, limit);
  }
  return deduped
    .sort((a, b) => {
      const dateA = a.date_posted ? new Date(a.date_posted).getTime() : 0;
      const dateB = b.date_posted ? new Date(b.date_posted).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
};

// Fetch TikTok videos by specific IDs from new normalized tables
export const fetchTikTokVideosByIds = async (videoIds: number[]): Promise<Video[]> => {
  if (videoIds.length === 0) return [];

  const { data: videosData, error: videoError } = await supabase
    .from('0.1. Table 2 - Video - TikTok')
    .select('*')
    .in('id', videoIds);

  if (videoError) throw videoError;
  if (!videosData || videosData.length === 0) return [];

  const fetchedIds = videosData.map(v => v.id);

  const [aiData, soundData, profileData, assetsData] = await Promise.all([
    supabase.from('0.1. Table 5 - Ai - TikTok').select('video_id, content_style, sub_style, hook, context, description, effort').in('video_id', fetchedIds),
    supabase.from('0.1. Table 3 - Sound - TikTok').select('video_id, genre, sub_genre').in('video_id', fetchedIds),
    supabase.from('0.1. Table 1 - Profile - TikTok').select('video_id, handle, profile_url, profile_followers, avatar_url, gender, median_views').in('video_id', fetchedIds),
    supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', fetchedIds)
  ]);

  const aiMap = new Map<number, any>();
  (aiData.data || []).forEach((item: any) => { if (item.video_id) aiMap.set(item.video_id, item); });

  const soundMap = new Map<number, any>();
  (soundData.data || []).forEach((item: any) => { if (item.video_id) soundMap.set(item.video_id, item); });

  const profileMap = new Map<number, any>();
  (profileData.data || []).forEach((item: any) => { if (item.video_id) profileMap.set(item.video_id, item); });

  const thumbnailMap = new Map<number, string | null>();
  (assetsData.data || []).forEach((item: any) => {
    if (item.video_id && item.thumbnail_url && !thumbnailMap.has(item.video_id)) {
      const url = item.thumbnail_url;
      if (url && url.length > 60 && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif'))) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });

  return videosData.map((video: any) => {
    const ai = aiMap.get(video.id) || {};
    const sound = soundMap.get(video.id) || {};
    const profile = profileMap.get(video.id) || {};

    return {
      id: video.id,
      video_url: video.video_url,
      embedded_ulr: video.video_embedded_url,
      video_views: video.video_views || 0,
      video_likes: video.video_likes || 0,
      video_shares: video.video_shares || 0,
      video_saves: video.video_saves || 0,
      comments: video.video_comments,
      caption: video.caption,
      date_posted: video.date_posted,
      duration: video.duration,
      hashtags: video.hashtags,
      outliar_score: video.viral_score || 0,
      viral_score: video.viral_score,
      performance_multiplier: video.performance_multiplier,
      content_style: ai.content_style,
      sub_style: ai.sub_style,
      hook: ai.hook,
      context: ai.context,
      description: ai.description,
      ai_effort: ai.effort,
      genre: sound.genre,
      sub_genre: sound.sub_genre,
      handle: profile.handle,
      profile_url: profile.profile_url,
      profile_followers: profile.profile_followers || 0,
      avatar_url: profile.avatar_url,
      gender: profile.gender,
      median_views: profile.median_views,
      thumbnail_url: thumbnailMap.get(video.id) || null,
      gif_url: null,
      is_reel: false,
    };
  });
};

// Fetch Reels by specific IDs from new normalized tables
export const fetchReelsByIds = async (reelIds: number[]): Promise<Video[]> => {
  if (reelIds.length === 0) return [];

  const { data: reelsData, error: reelError } = await supabase
    .from('0.1. Table 2.2 - Video - Reels')
    .select('*')
    .in('id', reelIds);

  if (reelError) throw reelError;
  if (!reelsData || reelsData.length === 0) return [];

  const fetchedIds = reelsData.map(r => r.id);

  const [aiData, soundData, profileData, assetsData] = await Promise.all([
    supabase.from('0.1. Table 5.2 - Ai - Reels').select('video_id, content_style, sub_style, hook, context, description, effort').in('video_id', fetchedIds),
    supabase.from('0.1. Table 3.2 - Sound - Reels').select('video_id, genre, sub_genre').in('video_id', fetchedIds),
    supabase.from('0.1. Table 1.2 - Profile - Instagram').select('video_id, handle, profile_url, profile_followers, avatar_url, gender, median_views').in('video_id', fetchedIds),
    supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', fetchedIds)
  ]);

  const aiMap = new Map<number, any>();
  (aiData.data || []).forEach((item: any) => { if (item.video_id) aiMap.set(item.video_id, item); });

  const soundMap = new Map<number, any>();
  (soundData.data || []).forEach((item: any) => { if (item.video_id) soundMap.set(item.video_id, item); });

  const profileMap = new Map<number, any>();
  (profileData.data || []).forEach((item: any) => { if (item.video_id) profileMap.set(item.video_id, item); });

  const thumbnailMap = new Map<number, string | null>();
  (assetsData.data || []).forEach((item: any) => {
    if (item.video_id && item.thumbnail_url && !thumbnailMap.has(item.video_id)) {
      const url = item.thumbnail_url;
      if (url && url.length > 60 && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif'))) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });

  return reelsData.map((reel: any) => {
    const ai = aiMap.get(reel.id) || {};
    const sound = soundMap.get(reel.id) || {};
    const profile = profileMap.get(reel.id) || {};

    return {
      id: reel.id,
      video_url: reel.video_url,
      video_file_url: reel.video_url,
      embedded_ulr: reel.video_embedded_url,
      video_views: reel.video_views || 0,
      video_likes: reel.video_likes || 0,
      video_shares: reel.video_shares || 0,
      video_saves: reel.video_saves || 0,
      comments: reel.video_comments,
      caption: reel.caption,
      date_posted: reel.date_posted,
      duration: reel.duration,
      hashtags: reel.hashtags,
      outliar_score: reel.viral_score || 0,
      viral_score: reel.viral_score,
      performance_multiplier: reel.performance_multiplier,
      content_style: ai.content_style,
      sub_style: ai.sub_style,
      hook: ai.hook,
      context: ai.context,
      description: ai.description,
      ai_effort: ai.effort,
      genre: sound.genre,
      sub_genre: sound.sub_genre,
      handle: profile.handle,
      profile_url: profile.profile_url,
      profile_followers: profile.profile_followers || 0,
      avatar_url: profile.avatar_url,
      gender: profile.gender,
      median_views: profile.median_views,
      thumbnail_url: thumbnailMap.get(reel.id) || null,
      gif_url: null,
      is_reel: true,
    };
  });
};

// Fetch content by IDs - tries TikTok videos first, then Reels for any IDs not found
export const fetchContentByIds = async (contentIds: number[]): Promise<Video[]> => {
  if (contentIds.length === 0) return [];

  // First, try to fetch all as TikTok videos
  const tiktokVideos = await fetchTikTokVideosByIds(contentIds);
  const foundTikTokIds = new Set(tiktokVideos.map(v => v.id));
  
  // Find IDs that weren't found in TikTok table
  const missingIds = contentIds.filter(id => !foundTikTokIds.has(id));
  
  if (missingIds.length === 0) {
    // All found in TikTok
    return tiktokVideos;
  }

  console.log(`📺 ${missingIds.length} IDs not found in TikTok, trying Reels:`, missingIds);
  
  // Try to fetch missing IDs as Reels
  const reels = await fetchReelsByIds(missingIds);
  
  console.log(`📺 Found ${reels.length} Reels for missing IDs`);
  
  // Combine both results
  return [...tiktokVideos, ...reels];
};

// Platform-aware content fetch: respects the platform specified for each ID
export interface ContentIdWithPlatform {
  id: number;
  platform: 'tiktok' | 'instagram' | 'unknown';
}

export const fetchContentByIdsWithPlatform = async (items: ContentIdWithPlatform[]): Promise<Video[]> => {
  if (items.length === 0) return [];

  // Separate IDs by platform
  const tiktokIds = items.filter(i => i.platform === 'tiktok').map(i => i.id);
  const instagramIds = items.filter(i => i.platform === 'instagram').map(i => i.id);
  const unknownIds = items.filter(i => i.platform === 'unknown').map(i => i.id);

  console.log(`🎯 Platform-aware fetch: TikTok=${tiktokIds.length}, Instagram=${instagramIds.length}, Unknown=${unknownIds.length}`);

  // Fetch requested platforms first
  const [tiktokPrimary, instagramPrimary] = await Promise.all([
    tiktokIds.length > 0 ? fetchTikTokVideosByIds(tiktokIds) : Promise.resolve([]),
    instagramIds.length > 0 ? fetchReelsByIds(instagramIds) : Promise.resolve([]),
  ]);

  // If any IDs were mis-labeled, fall back to the other platform
  const foundTikTokIds = new Set(tiktokPrimary.map(v => v.id));
  const foundInstagramIds = new Set(instagramPrimary.map(v => v.id));

  const tiktokMissing = tiktokIds.filter(id => !foundTikTokIds.has(id));
  const instagramMissing = instagramIds.filter(id => !foundInstagramIds.has(id));

  const [tiktokFallbackFromInstagram, instagramFallbackFromTikTok] = await Promise.all([
    // These were requested as TikTok but not found there → try Reels
    tiktokMissing.length > 0 ? fetchReelsByIds(tiktokMissing) : Promise.resolve([]),
    // These were requested as Instagram but not found there → try TikTok
    instagramMissing.length > 0 ? fetchTikTokVideosByIds(instagramMissing) : Promise.resolve([]),
  ]);

  if (tiktokMissing.length > 0 || instagramMissing.length > 0) {
    console.warn('⚠️ Corrected platform mismatches while fetching content plan IDs', {
      requested_tiktok_missing: tiktokMissing,
      requested_instagram_missing: instagramMissing,
      resolved_as_reels: tiktokFallbackFromInstagram.map(v => v.id),
      resolved_as_tiktok: instagramFallbackFromTikTok.map(v => v.id),
    });
  }

  // For unknown platform, try TikTok first then Reels
  let unknownVideos: Video[] = [];
  if (unknownIds.length > 0) {
    const foundTikTok = await fetchTikTokVideosByIds(unknownIds);
    const foundTikTokIds2 = new Set(foundTikTok.map(v => v.id));
    const stillMissing = unknownIds.filter(id => !foundTikTokIds2.has(id));

    if (stillMissing.length > 0) {
      const foundReels = await fetchReelsByIds(stillMissing);
      unknownVideos = [...foundTikTok, ...foundReels];
    } else {
      unknownVideos = foundTikTok;
    }
  }

  // Collect all found so far
  const allBeforeCarousels = [
    ...tiktokPrimary,
    ...instagramPrimary,
    ...tiktokFallbackFromInstagram,
    ...instagramFallbackFromTikTok,
    ...unknownVideos,
  ];

  const foundIds = new Set(allBeforeCarousels.map(v => v.id));
  const allRequestedIds = items.map(i => i.id);
  const stillMissingIds = allRequestedIds.filter(id => !foundIds.has(id));

  // Final fallback: check photo carousels table for any still-missing IDs
  let carouselVideos: Video[] = [];
  if (stillMissingIds.length > 0) {
    console.log(`🖼️ Checking photo carousels for ${stillMissingIds.length} missing IDs:`, stillMissingIds);
    try {
      const carousels = await fetchPhotoCarouselsByIds(stillMissingIds);
      // Convert PhotoCarousel to Video format for unified display
      carouselVideos = carousels.map(c => ({
        id: c.id,
        video_url: c.embedded_url || '',
        embedded_ulr: c.embedded_url || '',
        outliar_score: c.outliar_score || 0,
        video_views: c.photo_views || 0,
        video_likes: c.photo_likes || 0,
        comments: c.comments || '',
        profile_followers: c.profile_followers || 0,
        caption: c.caption,
        hook: c.Hook,
        genre: c.genre,
        sub_genre: c.sub_genre,
        gender: c.gender,
        date_posted: c.date_posted,
        thumbnail_url: c.photo_url_1 || null,
        isPhotoCarousel: true,
        postUrl: c.embedded_url || '',
        Artist: c.handle || c.artist || '',
        profile_bio: c.profile_bio,
        performance_multiplier: c.performance_multiplier,
        video_file_url: c.video_file_url,
      }));
      console.log(`🖼️ Found ${carouselVideos.length} photo carousels as fallback`);
    } catch (e) {
      console.warn('⚠️ Failed to fetch photo carousels fallback:', e);
    }
  }

  // Dedupe (in case an ID exists in both sources, or fallbacks overlap)
  const all = [...allBeforeCarousels, ...carouselVideos];

  const seen = new Set<number>();
  return all.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
};

// Fetch Photo Carousels by specific IDs from new normalized tables  
export const fetchPhotoCarouselsByIds = async (carouselIds: number[]): Promise<PhotoCarousel[]> => {
  if (carouselIds.length === 0) return [];

  const { data: carouselData, error: carouselError } = await supabase
    .from('0.1. Table 2.1 - PC - TikTok')
    .select('*')
    .in('id', carouselIds);

  if (carouselError) throw carouselError;
  if (!carouselData || carouselData.length === 0) return [];

  const fetchedIds = carouselData.map(c => c.id);

  const [aiData, soundData, profileData, assetsData] = await Promise.all([
    supabase.from('0.1. Table 5.1 - Ai - PC - TikTok').select('photo_c_id, hook, hook_text, gender, language').in('photo_c_id', fetchedIds),
    supabase.from('0.1. Table 3.1 - Sound - PC - TikTok').select('video_id, genre, sub_genre, sound_url').in('video_id', fetchedIds),
    supabase.from('0.1. Table 1.1 - Profile - PC - TikTok').select('video_id, handle, profile_url, profile_followers, avatar_url, profile_bio, median_views').in('video_id', fetchedIds),
    supabase.from('0.1. Table 4.1 - Assets - PC - TikTok').select('video_id, thumbnail_url').in('video_id', fetchedIds)
  ]);

  const aiMap = new Map<number, any>();
  (aiData.data || []).forEach((item: any) => { if (item.photo_c_id) aiMap.set(item.photo_c_id, item); });

  const soundMap = new Map<number, any>();
  (soundData.data || []).forEach((item: any) => { if (item.video_id) soundMap.set(item.video_id, item); });

  const profileMap = new Map<number, any>();
  (profileData.data || []).forEach((item: any) => { if (item.video_id) profileMap.set(item.video_id, item); });

  const thumbnailMap = new Map<number, string | null>();
  (assetsData.data || []).forEach((item: any) => {
    if (item.video_id && item.thumbnail_url && !thumbnailMap.has(item.video_id)) {
      const url = item.thumbnail_url;
      if (url && url.length > 60 && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif'))) {
        thumbnailMap.set(item.video_id, url);
      }
    }
  });

  return carouselData.map((carousel: any) => {
    const ai = aiMap.get(carousel.id) || {};
    const sound = soundMap.get(carousel.id) || {};
    const profile = profileMap.get(carousel.id) || {};

    return {
      id: carousel.id,
      embedded_url: carousel.post_url || '',
      photo_views: carousel.photo_views || 0,
      photo_likes: carousel.photo_likes || 0,
      photo_saves: carousel.photo_saves || 0,
      comments: carousel.photo_comments,
      caption: carousel.caption,
      date_posted: carousel.date_posted,
      hashtags: carousel.hashtags,
      outliar_score: carousel.viral_score || 0,
      performance_multiplier: carousel.performance_multiplier,
      Hook: ai.hook,
      gender: ai.gender,
      genre: sound.genre,
      sub_genre: sound.sub_genre,
      sound_url: sound.sound_url,
      handle: profile.handle,
      profile_url: profile.profile_url,
      profile_followers: profile.profile_followers || 0,
      avatar_url: profile.avatar_url,
      profile_bio: profile.profile_bio,
      median_views: profile.median_views,
      photo_url_1: thumbnailMap.get(carousel.id) || null,
      posts: 0,
      created_at: carousel.created_at,
    };
  });
};
