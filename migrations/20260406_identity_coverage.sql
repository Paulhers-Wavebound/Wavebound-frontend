-- Identity coverage stats: per-platform artist handle/ID coverage
-- Returns total_artists + per-platform counts for the identity coverage page

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

  SELECT jsonb_build_object(
    'total_artists', v_total,
    'platforms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform,
        'id_type', t.id_type,
        'artists_with', t.cnt,
        'coverage_pct', CASE WHEN v_total > 0 THEN ROUND(100.0 * t.cnt / v_total, 1)::float ELSE 0 END
      ) ORDER BY t.cnt DESC)
      FROM (
        SELECT p.platform,
               COALESCE(p.id_type, 'unknown') as id_type,
               COUNT(DISTINCT p.entity_id)::int as cnt
        FROM wb_platform_ids p
        JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
        GROUP BY p.platform, p.id_type
      ) t
    ), '[]'::jsonb),
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
    'distribution', jsonb_build_object(
      'zero_ids', (
        SELECT COUNT(*)::int FROM wb_entities e
        WHERE e.entity_type = 'artist'
        AND NOT EXISTS (SELECT 1 FROM wb_platform_ids pid WHERE pid.entity_id = e.id)
      ),
      'one_id', (
        SELECT COUNT(*)::int FROM (
          SELECT entity_id FROM wb_platform_ids p
          JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
          GROUP BY entity_id HAVING COUNT(DISTINCT platform) = 1
        ) sub
      ),
      'two_to_four', (
        SELECT COUNT(*)::int FROM (
          SELECT entity_id FROM wb_platform_ids p
          JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
          GROUP BY entity_id HAVING COUNT(DISTINCT platform) BETWEEN 2 AND 4
        ) sub
      ),
      'five_plus', (
        SELECT COUNT(*)::int FROM (
          SELECT entity_id FROM wb_platform_ids p
          JOIN wb_entities e ON e.id = p.entity_id AND e.entity_type = 'artist'
          GROUP BY entity_id HAVING COUNT(DISTINCT platform) >= 5
        ) sub
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_identity_coverage() TO service_role;
