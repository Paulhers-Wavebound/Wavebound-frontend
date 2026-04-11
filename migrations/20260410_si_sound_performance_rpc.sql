-- RPC: lightweight sound performance stats from Sound Intelligence
-- Used by Content & Social Dashboard to show SI-analyzed sounds
-- alongside catalog_tiktok_performance data (which requires catalog entity linkage)

CREATE OR REPLACE FUNCTION get_si_sound_performance(p_label_id uuid)
RETURNS TABLE (
  sound_id text,
  track_name text,
  artist_name text,
  total_views bigint,
  videos_count int,
  unique_creators bigint,
  si_status text,
  weekly_new_videos int,
  completed_at timestamptz,
  job_id uuid
) AS $$
  SELECT
    r.sound_id,
    r.track_name,
    r.artist_name,
    COALESCE((r.analysis->>'total_views')::bigint, 0) AS total_views,
    COALESCE((r.analysis->>'videos_analyzed')::int, j.videos_analyzed, 0) AS videos_count,
    (SELECT COUNT(DISTINCT v.author_handle) FROM sound_intelligence_videos v WHERE v.job_id = j.id) AS unique_creators,
    COALESCE(r.analysis->>'status', 'active') AS si_status,
    COALESCE((r.analysis->>'weekly_delta_videos')::int, 0) AS weekly_new_videos,
    j.completed_at,
    j.id AS job_id
  FROM sound_intelligence_results r
  JOIN sound_intelligence_jobs j ON j.id = r.job_id
  WHERE r.label_id = p_label_id
    AND j.status = 'completed'
  ORDER BY j.completed_at DESC NULLS LAST
  LIMIT 30;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION get_si_sound_performance(uuid) TO authenticated;
