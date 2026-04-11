-- v2: Rewritten for performance. Single pass over wb_platform_ids + wb_entities
-- instead of 4 separate GROUP BY + HAVING queries for the distribution.

CREATE OR REPLACE FUNCTION get_identity_coverage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_result jsonb;
BEGIN
  SELECT COUNT(*)::int INTO v_total FROM wb_entities WHERE entity_type = 'artist';

  -- Materialize artist platform counts in one pass
  CREATE TEMP TABLE IF NOT EXISTS _id_cov_counts (entity_id uuid, platform_count int) ON COMMIT DROP;
  TRUNCATE _id_cov_counts;
  INSERT INTO _id_cov_counts
    SELECT p.entity_id, COUNT(DISTINCT p.platform)::int
    FROM wb_platform_ids p
    JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
    GROUP BY p.entity_id;

  SELECT jsonb_build_object(
    'total_artists', v_total,

    'by_platform_summary', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform,
        'artists_with', t.cnt,
        'coverage_pct', CASE WHEN v_total > 0 THEN ROUND(100.0 * t.cnt / v_total, 1)::float ELSE 0 END
      ) ORDER BY t.cnt DESC)
      FROM (
        SELECT p.platform, COUNT(DISTINCT p.entity_id)::int as cnt
        FROM wb_platform_ids p
        JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
        GROUP BY p.platform
      ) t
    ), '[]'::jsonb),

    'platforms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform,
        'id_type', t.id_type,
        'artists_with', t.cnt,
        'coverage_pct', CASE WHEN v_total > 0 THEN ROUND(100.0 * t.cnt / v_total, 1)::float ELSE 0 END
      ) ORDER BY t.cnt DESC)
      FROM (
        SELECT p.platform, COALESCE(p.id_type, 'unknown') as id_type,
               COUNT(DISTINCT p.entity_id)::int as cnt
        FROM wb_platform_ids p
        JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
        GROUP BY p.platform, p.id_type
      ) t
    ), '[]'::jsonb),

    'distribution', jsonb_build_object(
      'zero_ids', v_total - (SELECT COUNT(*)::int FROM _id_cov_counts),
      'one_id', (SELECT COUNT(*)::int FROM _id_cov_counts WHERE platform_count = 1),
      'two_to_four', (SELECT COUNT(*)::int FROM _id_cov_counts WHERE platform_count BETWEEN 2 AND 4),
      'five_plus', (SELECT COUNT(*)::int FROM _id_cov_counts WHERE platform_count >= 5)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_identity_coverage() TO service_role;
