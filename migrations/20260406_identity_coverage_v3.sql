-- v3: Pre-filter artist entity_ids, then single-pass aggregation.
-- Avoids repeated JOINs to wb_entities (1.2M → 302K rows).

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
  -- Step 1: Get all artist IDs into a temp table (fast, indexed on entity_type)
  CREATE TEMP TABLE IF NOT EXISTS _artist_ids (id uuid PRIMARY KEY) ON COMMIT DROP;
  TRUNCATE _artist_ids;
  INSERT INTO _artist_ids SELECT id FROM wb_entities WHERE entity_type = 'artist';
  SELECT COUNT(*)::int INTO v_total FROM _artist_ids;

  -- Step 2: Filter platform_ids to artists only (302K vs 1.2M)
  CREATE TEMP TABLE IF NOT EXISTS _artist_pids (
    entity_id uuid, platform text, id_type text
  ) ON COMMIT DROP;
  TRUNCATE _artist_pids;
  INSERT INTO _artist_pids
    SELECT p.entity_id, p.platform, COALESCE(p.id_type, 'unknown')
    FROM wb_platform_ids p
    WHERE EXISTS (SELECT 1 FROM _artist_ids a WHERE a.id = p.entity_id);

  -- Step 3: Platform counts (single pass each)
  CREATE TEMP TABLE IF NOT EXISTS _artist_plat_count (entity_id uuid, cnt int) ON COMMIT DROP;
  TRUNCATE _artist_plat_count;
  INSERT INTO _artist_plat_count
    SELECT entity_id, COUNT(DISTINCT platform)::int FROM _artist_pids GROUP BY entity_id;

  SELECT jsonb_build_object(
    'total_artists', v_total,

    'by_platform_summary', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform,
        'artists_with', t.cnt,
        'coverage_pct', CASE WHEN v_total > 0 THEN ROUND(100.0 * t.cnt / v_total, 1)::float ELSE 0 END
      ) ORDER BY t.cnt DESC)
      FROM (
        SELECT platform, COUNT(DISTINCT entity_id)::int as cnt
        FROM _artist_pids GROUP BY platform
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
        SELECT platform, id_type, COUNT(DISTINCT entity_id)::int as cnt
        FROM _artist_pids GROUP BY platform, id_type
      ) t
    ), '[]'::jsonb),

    'distribution', jsonb_build_object(
      'zero_ids', v_total - (SELECT COUNT(*)::int FROM _artist_plat_count),
      'one_id', (SELECT COUNT(*)::int FROM _artist_plat_count WHERE cnt = 1),
      'two_to_four', (SELECT COUNT(*)::int FROM _artist_plat_count WHERE cnt BETWEEN 2 AND 4),
      'five_plus', (SELECT COUNT(*)::int FROM _artist_plat_count WHERE cnt >= 5)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_identity_coverage() TO service_role;
