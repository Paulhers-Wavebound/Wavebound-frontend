-- Create a function to get sound analysis with sound_id as text
CREATE OR REPLACE FUNCTION get_sound_analysis_with_text_ids(p_job_id bigint)
RETURNS TABLE (
  id bigint,
  sound_id text,
  sound_name text,
  sound_author text,
  sound_coverImage_url text,
  audio_analysis text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.sound_id::text as sound_id,
    sa.sound_name,
    sa.sound_author,
    sa."sound_coverImage_url",
    sa.audio_analysis
  FROM "Analysis Profile 5 - sound_analysis" sa
  WHERE sa.job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get video analysis with sound_id as text
CREATE OR REPLACE FUNCTION get_video_analysis_with_text_ids(p_job_id bigint)
RETURNS TABLE (
  id bigint,
  sound_id text,
  content_url text,
  post_views bigint,
  post_likes bigint,
  post_comments text,
  post_shares bigint,
  caption text,
  viral_score numeric,
  visual_analysis text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    va.id,
    va.sound_id::text as sound_id,
    va.content_url,
    va.post_views,
    va.post_likes,
    va.post_comments,
    va.post_shares,
    va.caption,
    va.viral_score,
    va.visual_analysis
  FROM "Analysis Profile 3 - video_analysis" va
  WHERE va.job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;