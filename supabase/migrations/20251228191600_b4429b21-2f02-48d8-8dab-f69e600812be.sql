-- Create a comprehensive filtering function for the explore page
-- This replaces client-side filtering with efficient server-side queries

CREATE OR REPLACE FUNCTION public.filter_explore_content(
  p_genres text[] DEFAULT NULL,
  p_sub_genres text[] DEFAULT NULL,
  p_content_styles text[] DEFAULT NULL,
  p_performance_range text DEFAULT NULL,
  p_follower_range text DEFAULT NULL,
  p_genders text[] DEFAULT NULL,
  p_platforms text[] DEFAULT NULL,
  p_effort text DEFAULT NULL,
  p_search_query text DEFAULT NULL,
  p_sort_by text DEFAULT 'latest',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id bigint,
  platform text,
  embedded_url text,
  video_url text,
  caption text,
  handle text,
  avatar_url text,
  profile_followers bigint,
  video_views bigint,
  video_likes bigint,
  video_comments text,
  video_shares bigint,
  viral_score numeric,
  date_posted text,
  genre text,
  sub_genre text,
  content_style text,
  gender text,
  hook text,
  effort text,
  thumbnail_url text,
  gif_url text,
  duration integer,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_min_viral_score numeric := 0;
  v_min_followers bigint := 0;
  v_max_followers bigint := 999999999999;
  v_total bigint;
BEGIN
  -- Parse performance range to viral score threshold
  IF p_performance_range IS NOT NULL THEN
    CASE p_performance_range
      WHEN 'viral' THEN v_min_viral_score := 8;
      WHEN 'high' THEN v_min_viral_score := 5;
      WHEN 'medium' THEN v_min_viral_score := 3;
      WHEN 'low' THEN v_min_viral_score := 0;
      ELSE v_min_viral_score := 0;
    END CASE;
  END IF;

  -- Parse follower range
  IF p_follower_range IS NOT NULL THEN
    CASE p_follower_range
      WHEN 'micro' THEN v_min_followers := 0; v_max_followers := 10000;
      WHEN 'small' THEN v_min_followers := 10000; v_max_followers := 50000;
      WHEN 'medium' THEN v_min_followers := 50000; v_max_followers := 500000;
      WHEN 'large' THEN v_min_followers := 500000; v_max_followers := 999999999999;
      ELSE v_min_followers := 0; v_max_followers := 999999999999;
    END CASE;
  END IF;

  -- Get total count first (for pagination info)
  SELECT COUNT(*) INTO v_total
  FROM (
    -- TikTok Videos
    SELECT v.id
    FROM tiktok_videos_all v
    LEFT JOIN tiktok_videos_ai_analysis ai ON v.id = ai.video_id
    WHERE 
      (p_platforms IS NULL OR 'TikTok' = ANY(p_platforms))
      AND (p_genres IS NULL OR v.genre ILIKE ANY(SELECT '%' || unnest(p_genres) || '%'))
      AND (p_sub_genres IS NULL OR v.sub_genre ILIKE ANY(SELECT '%' || unnest(p_sub_genres) || '%'))
      AND (p_content_styles IS NULL OR ai.content_style ILIKE ANY(SELECT '%' || unnest(p_content_styles) || '%'))
      AND (p_genders IS NULL OR v.gender = ANY(p_genders))
      AND (p_effort IS NULL OR ai.effort = p_effort)
      AND (v.viral_score >= v_min_viral_score OR v.viral_score IS NULL)
      AND (v.profile_followers >= v_min_followers AND v.profile_followers <= v_max_followers OR v.profile_followers IS NULL)
      AND (p_search_query IS NULL OR v.caption ILIKE '%' || p_search_query || '%' OR v.handle ILIKE '%' || p_search_query || '%')
    
    UNION ALL
    
    -- Instagram Reels
    SELECT r.id
    FROM reels_all r
    WHERE 
      (p_platforms IS NULL OR 'Reels' = ANY(p_platforms))
      AND (p_genres IS NULL OR r.genre ILIKE ANY(SELECT '%' || unnest(p_genres) || '%'))
      AND (p_sub_genres IS NULL OR r.sub_genre ILIKE ANY(SELECT '%' || unnest(p_sub_genres) || '%'))
      AND (p_content_styles IS NULL OR r.content_style ILIKE ANY(SELECT '%' || unnest(p_content_styles) || '%'))
      AND (p_genders IS NULL OR r.gender = ANY(p_genders))
      AND (r.outliar_score >= v_min_viral_score OR r.outliar_score IS NULL)
      AND (r.profile_followers >= v_min_followers AND r.profile_followers <= v_max_followers OR r.profile_followers IS NULL)
      AND (p_search_query IS NULL OR r.caption ILIKE '%' || p_search_query || '%' OR r.handle ILIKE '%' || p_search_query || '%')
  ) combined;

  -- Return filtered results
  RETURN QUERY
  SELECT 
    combined.id,
    combined.platform,
    combined.embedded_url,
    combined.video_url,
    combined.caption,
    combined.handle,
    combined.avatar_url,
    combined.profile_followers,
    combined.video_views,
    combined.video_likes,
    combined.video_comments,
    combined.video_shares,
    combined.viral_score,
    combined.date_posted,
    combined.genre,
    combined.sub_genre,
    combined.content_style,
    combined.gender,
    combined.hook,
    combined.effort,
    combined.thumbnail_url,
    combined.gif_url,
    combined.duration,
    v_total as total_count
  FROM (
    -- TikTok Videos
    SELECT 
      v.id,
      'TikTok'::text as platform,
      v.embedded_url,
      v.video_url,
      v.caption,
      v.handle,
      v.avatar_url,
      v.profile_followers,
      v.video_views,
      v.video_likes,
      v.video_comments::text,
      v.video_shares,
      v.viral_score,
      v.date_posted,
      v.genre,
      v.sub_genre,
      ai.content_style,
      v.gender,
      ai.hook,
      ai.effort,
      g.thumbnail_url,
      g.url as gif_url,
      v.duration
    FROM tiktok_videos_all v
    LEFT JOIN tiktok_videos_ai_analysis ai ON v.id = ai.video_id
    LEFT JOIN media_assets_gif_thumbnail g ON v.id = g.video_id
    WHERE 
      (p_platforms IS NULL OR 'TikTok' = ANY(p_platforms))
      AND (p_genres IS NULL OR v.genre ILIKE ANY(SELECT '%' || unnest(p_genres) || '%'))
      AND (p_sub_genres IS NULL OR v.sub_genre ILIKE ANY(SELECT '%' || unnest(p_sub_genres) || '%'))
      AND (p_content_styles IS NULL OR ai.content_style ILIKE ANY(SELECT '%' || unnest(p_content_styles) || '%'))
      AND (p_genders IS NULL OR v.gender = ANY(p_genders))
      AND (p_effort IS NULL OR ai.effort = p_effort)
      AND (v.viral_score >= v_min_viral_score OR v.viral_score IS NULL)
      AND (v.profile_followers >= v_min_followers AND v.profile_followers <= v_max_followers OR v.profile_followers IS NULL)
      AND (p_search_query IS NULL OR v.caption ILIKE '%' || p_search_query || '%' OR v.handle ILIKE '%' || p_search_query || '%')
    
    UNION ALL
    
    -- Instagram Reels
    SELECT 
      r.id,
      'Reels'::text as platform,
      r.embedded_url,
      r.video_url,
      r.caption,
      r.handle,
      r.avatar_url,
      r.profile_followers,
      r.video_views,
      r.video_likes,
      r.comments as video_comments,
      r.video_shares,
      r.outliar_score as viral_score,
      r.date_posted,
      r.genre,
      r.sub_genre,
      r.content_style,
      r.gender,
      r.hook,
      NULL::text as effort,
      gr.thumbnail_url,
      gr.url as gif_url,
      r.duration
    FROM reels_all r
    LEFT JOIN media_assets_gif_thumbnail_Reels gr ON r.id = gr.video_id
    WHERE 
      (p_platforms IS NULL OR 'Reels' = ANY(p_platforms))
      AND (p_genres IS NULL OR r.genre ILIKE ANY(SELECT '%' || unnest(p_genres) || '%'))
      AND (p_sub_genres IS NULL OR r.sub_genre ILIKE ANY(SELECT '%' || unnest(p_sub_genres) || '%'))
      AND (p_content_styles IS NULL OR r.content_style ILIKE ANY(SELECT '%' || unnest(p_content_styles) || '%'))
      AND (p_genders IS NULL OR r.gender = ANY(p_genders))
      AND (r.outliar_score >= v_min_viral_score OR r.outliar_score IS NULL)
      AND (r.profile_followers >= v_min_followers AND r.profile_followers <= v_max_followers OR r.profile_followers IS NULL)
      AND (p_search_query IS NULL OR r.caption ILIKE '%' || p_search_query || '%' OR r.handle ILIKE '%' || p_search_query || '%')
  ) combined
  ORDER BY
    CASE WHEN p_sort_by = 'latest' THEN combined.date_posted END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'popular' THEN combined.video_views END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'viral' THEN combined.viral_score END DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;