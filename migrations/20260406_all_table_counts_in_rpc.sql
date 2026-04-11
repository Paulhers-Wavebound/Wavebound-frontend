-- Add all 5 table counts to the RPC so we don't depend on PostgREST count queries at all.
-- PostgREST count: exact returns 0 for partitioned tables and sometimes null for regular ones.

-- This is a targeted ALTER — only modifying the first section to add 3 more counts.
-- We replace the entire function to ensure consistency.

CREATE OR REPLACE FUNCTION get_admin_health_extended()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_section jsonb;
BEGIN

  CREATE TEMP TABLE IF NOT EXISTS _health_ep (entity_id uuid, platform text) ON COMMIT DROP;
  TRUNCATE _health_ep;
  INSERT INTO _health_ep SELECT DISTINCT entity_id, platform FROM wb_observations;

  CREATE TEMP TABLE IF NOT EXISTS _health_plat_stats (
    platform text, total_obs bigint, uniq_ent int, last_obs timestamptz
  ) ON COMMIT DROP;
  TRUNCATE _health_plat_stats;
  INSERT INTO _health_plat_stats
    SELECT platform, COUNT(*)::bigint, COUNT(DISTINCT entity_id)::int, MAX(observed_at)
    FROM wb_observations GROUP BY platform;

  CREATE TEMP TABLE IF NOT EXISTS _health_plat_metrics (platform text, metric text) ON COMMIT DROP;
  TRUNCATE _health_plat_metrics;
  INSERT INTO _health_plat_metrics SELECT DISTINCT platform, metric FROM wb_observations;

  -- ═══ ALL TABLE COUNTS (replaces PostgREST count queries) ═══
  SELECT jsonb_build_object(
    'total_entities', (SELECT COUNT(*)::bigint FROM wb_entities),
    'total_observations', (SELECT COALESCE(SUM(total_obs), 0)::bigint FROM _health_plat_stats),
    'total_observations_geo', (SELECT COUNT(*)::bigint FROM wb_observations_geo),
    'total_platform_ids', (SELECT COUNT(*)::bigint FROM wb_platform_ids),
    'total_relationships', (SELECT COUNT(*)::bigint FROM wb_entity_relationships)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ DATA FRESHNESS ═══
  SELECT jsonb_build_object(
    'obs_freshness', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform, 'last_observation_at', t.last_obs, 'observation_count', t.total_obs
      ) ORDER BY t.last_obs DESC) FROM _health_plat_stats t
    ), '[]'::jsonb),
    'geo_freshness', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform, 'last_observation_at', t.last_obs,
        'observation_count', t.cnt, 'unique_countries', t.countries
      ) ORDER BY t.last_obs DESC)
      FROM (
        SELECT platform, MAX(observed_at) as last_obs, COUNT(*)::bigint as cnt,
               COUNT(DISTINCT country_code)::int as countries
        FROM wb_observations_geo GROUP BY platform
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ VELOCITY COUNTDOWN ═══
  SELECT jsonb_build_object(
    'first_observation_date', (SELECT MIN(last_obs)::date FROM _health_plat_stats)::text
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ DAILY ACCUMULATION ═══
  SELECT jsonb_build_object(
    'obs_today', (SELECT COUNT(*)::bigint FROM wb_observations WHERE observed_at >= CURRENT_DATE),
    'obs_yesterday', (SELECT COUNT(*)::bigint FROM wb_observations WHERE observed_at >= CURRENT_DATE - 1 AND observed_at < CURRENT_DATE),
    'geo_today', (SELECT COUNT(*)::bigint FROM wb_observations_geo WHERE observed_at >= CURRENT_DATE),
    'geo_yesterday', (SELECT COUNT(*)::bigint FROM wb_observations_geo WHERE observed_at >= CURRENT_DATE - 1 AND observed_at < CURRENT_DATE),
    'entities_created_today', (SELECT COUNT(*)::bigint FROM wb_entities WHERE created_at >= CURRENT_DATE),
    'entities_created_yesterday', (SELECT COUNT(*)::bigint FROM wb_entities WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ COVERAGE ANALYSIS ═══
  SELECT jsonb_build_object(
    'artists_total', (SELECT COUNT(*)::bigint FROM wb_entities WHERE entity_type = 'artist'),
    'artists_with_geo', (
      SELECT COUNT(*)::bigint FROM wb_entities e WHERE e.entity_type = 'artist'
      AND EXISTS (SELECT 1 FROM wb_observations_geo og WHERE og.entity_id = e.id)
    ),
    'artists_with_multi_platform', (
      SELECT COUNT(*)::bigint FROM (
        SELECT ep.entity_id FROM _health_ep ep
        JOIN wb_entities e ON e.id = ep.entity_id WHERE e.entity_type = 'artist'
        GROUP BY ep.entity_id HAVING COUNT(*) >= 3
      ) sub
    ),
    'songs_total', (SELECT COUNT(*)::bigint FROM wb_entities WHERE entity_type = 'sound'),
    'songs_with_observations', (
      SELECT COUNT(*)::bigint FROM wb_entities e WHERE e.entity_type = 'sound'
      AND EXISTS (SELECT 1 FROM _health_ep ep WHERE ep.entity_id = e.id)
    ),
    'markets_total', (SELECT COUNT(*)::bigint FROM wb_entities WHERE entity_type = 'market'),
    'avg_platforms_per_artist', COALESCE((
      SELECT ROUND(AVG(pc)::numeric, 1)::float FROM (
        SELECT COUNT(*) as pc FROM _health_ep ep
        JOIN wb_entities e ON e.id = ep.entity_id WHERE e.entity_type = 'artist'
        GROUP BY ep.entity_id
      ) sub
    ), 0)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ PLATFORM BREAKDOWN ═══
  SELECT jsonb_build_object(
    'platform_breakdown', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', ps.platform, 'total_observations', ps.total_obs, 'unique_entities', ps.uniq_ent,
        'distinct_metrics', COALESCE((
          SELECT array_agg(pm.metric ORDER BY pm.metric)
          FROM _health_plat_metrics pm WHERE pm.platform = ps.platform
        ), ARRAY[]::text[])
      ) ORDER BY ps.total_obs DESC) FROM _health_plat_stats ps
    ), '[]'::jsonb),
    'platform_geo_breakdown', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'platform', t.platform, 'total_geo_observations', t.total_geo, 'unique_countries', t.countries
      ) ORDER BY t.total_geo DESC)
      FROM (
        SELECT platform, COUNT(*)::bigint as total_geo, COUNT(DISTINCT country_code)::int as countries
        FROM wb_observations_geo GROUP BY platform
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ dbt MODEL HEALTH ═══
  BEGIN
    SELECT jsonb_build_object(
      'dbt_available', true,
      'entity_health_rows', (SELECT COUNT(*)::int FROM entity_health),
      'entity_health_avg_score', COALESCE((SELECT ROUND(AVG(health_score)::numeric, 1)::float FROM entity_health), 0),
      'entity_health_distribution', (
        SELECT jsonb_build_object(
          'below_30', COUNT(*) FILTER (WHERE health_score < 30)::int,
          'between_30_50', COUNT(*) FILTER (WHERE health_score >= 30 AND health_score < 50)::int,
          'between_50_70', COUNT(*) FILTER (WHERE health_score >= 50 AND health_score < 70)::int,
          'above_70', COUNT(*) FILTER (WHERE health_score >= 70)::int
        ) FROM entity_health
      ),
      'discovery_momentum_active', (SELECT COUNT(*)::int FROM entity_health WHERE discovery_momentum > 50),
      'streaming_momentum_active', (SELECT COUNT(*)::int FROM entity_health WHERE streaming_momentum > 50),
      'social_momentum_active', (SELECT COUNT(*)::int FROM entity_health WHERE social_momentum > 50),
      'geographic_momentum_active', (SELECT COUNT(*)::int FROM entity_health WHERE geographic_reach > 50),
      'song_health_rows', (SELECT COUNT(*)::int FROM song_health),
      'song_health_avg_score', COALESCE((SELECT ROUND(AVG(health_score)::numeric, 1)::float FROM song_health), 0),
      'song_health_has_radio', (SELECT COUNT(*)::int FROM song_health WHERE COALESCE(radio_audience, 0) > 0),
      'song_health_has_apple', (SELECT COUNT(*)::int FROM song_health WHERE apple_best_position IS NOT NULL AND apple_best_position > 0),
      'song_health_has_youtube', (SELECT COUNT(*)::int FROM song_health WHERE COALESCE(youtube_total_views, 0) > 0),
      'market_health_rows', (SELECT COUNT(*)::int FROM market_health),
      'market_health_avg_score', COALESCE((SELECT ROUND(AVG(health_score)::numeric, 1)::float FROM market_health), 0),
      'daily_summaries_rows', (SELECT COUNT(*)::int FROM daily_summaries),
      'daily_summaries_distinct_dates', (SELECT COUNT(DISTINCT date)::int FROM daily_summaries),
      'daily_summaries_metric_combos', (SELECT COUNT(*)::int FROM (SELECT DISTINCT platform, metric FROM daily_summaries) s)
    ) INTO v_section;
    v_result := v_result || v_section;
  EXCEPTION WHEN undefined_table THEN
    v_result := v_result || '{"dbt_available": false}'::jsonb;
  END;

  -- ═══ TOP ENTITIES ═══
  SELECT jsonb_build_object(
    'top_listeners', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', t.nm, 'value', t.val))
      FROM (
        SELECT e.canonical_name as nm, ds.latest_value::bigint as val
        FROM daily_summaries ds JOIN wb_entities e ON e.id = ds.entity_id
        WHERE ds.metric = 'monthly_listeners'
          AND ds.date = (SELECT MAX(date) FROM daily_summaries WHERE metric = 'monthly_listeners')
        ORDER BY ds.latest_value DESC NULLS LAST LIMIT 5
      ) t
    ), '[]'::jsonb),
    'top_countries', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', t.nm, 'countries', t.cnt))
      FROM (
        SELECT e.canonical_name as nm, COUNT(DISTINCT og.country_code)::int as cnt
        FROM wb_observations_geo og JOIN wb_entities e ON e.id = og.entity_id AND e.entity_type = 'artist'
        GROUP BY e.id, e.canonical_name ORDER BY cnt DESC LIMIT 5
      ) t
    ), '[]'::jsonb),
    'top_platforms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', t.nm, 'platforms', t.cnt))
      FROM (
        SELECT e.canonical_name as nm, COUNT(*)::int as cnt
        FROM _health_ep ep JOIN wb_entities e ON e.id = ep.entity_id AND e.entity_type = 'artist'
        GROUP BY e.id, e.canonical_name ORDER BY cnt DESC LIMIT 5
      ) t
    ), '[]'::jsonb),
    'newest_entities', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name', t.canonical_name, 'entity_type', t.entity_type, 'created_at', t.created_at
      ))
      FROM (SELECT canonical_name, entity_type, created_at FROM wb_entities ORDER BY created_at DESC LIMIT 10) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ DATA QUALITY ═══
  SELECT jsonb_build_object(
    'null_value_observations', (SELECT COUNT(*)::bigint FROM wb_observations WHERE value IS NULL),
    'orphan_entities', (
      SELECT COUNT(*)::bigint FROM wb_entities e
      WHERE NOT EXISTS (SELECT 1 FROM _health_ep ep WHERE ep.entity_id = e.id)
    ),
    'zero_heavy_metrics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('platform', t.platform, 'metric', t.metric, 'zero_pct', t.zpct))
      FROM (
        SELECT platform, metric,
               ROUND(100.0 * COUNT(*) FILTER (WHERE value = 0) / NULLIF(COUNT(*), 0), 1)::float as zpct
        FROM wb_observations GROUP BY platform, metric
        HAVING COUNT(*) FILTER (WHERE value = 0) * 2 > COUNT(*)
        ORDER BY zpct DESC
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ OPS: SC CREDIT + YOUTUBE QUOTA ═══
  SELECT jsonb_build_object(
    'sc_credit_history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'scraper_name', t.scraper_name, 'completed_at', t.completed_at,
        'credits_remaining', (t.metadata->>'credits_remaining')::int,
        'api_calls', COALESCE((t.metadata->>'api_calls')::int, t.rows_inserted)
      ) ORDER BY t.completed_at DESC)
      FROM (
        SELECT scraper_name, completed_at, metadata, rows_inserted FROM scraper_runs
        WHERE status = 'success' AND metadata->>'credits_remaining' IS NOT NULL
          AND completed_at >= NOW() - INTERVAL '7 days'
        ORDER BY completed_at DESC LIMIT 50
      ) t
    ), '[]'::jsonb),
    'yt_quota_history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'completed_at', t.completed_at, 'quota_units_used', (t.metadata->>'quota_units_used')::int
      ) ORDER BY t.completed_at DESC)
      FROM (
        SELECT completed_at, metadata FROM scraper_runs
        WHERE scraper_name = 'free_youtube_api' AND status = 'success'
          AND completed_at >= NOW() - INTERVAL '7 days'
        ORDER BY completed_at DESC LIMIT 7
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ OPS: PLATFORM ID TREND ═══
  SELECT jsonb_build_object(
    'platform_id_trend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('platform', t.platform, 'total', t.total, 'added_7d', t.added_7d))
      FROM (
        SELECT platform, COUNT(*)::int as total,
               COUNT(*) FILTER (WHERE linked_at >= NOW() - INTERVAL '7 days')::int as added_7d
        FROM wb_platform_ids GROUP BY platform ORDER BY total DESC
      ) t
    ), '[]'::jsonb),
    'platform_id_daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('platform', t.platform, 'day', t.day, 'count', t.cnt))
      FROM (
        SELECT platform, linked_at::date as day, COUNT(*)::int as cnt
        FROM wb_platform_ids WHERE linked_at >= NOW() - INTERVAL '7 days'
        GROUP BY platform, linked_at::date ORDER BY platform, day
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ OPS: UNRESOLVED ARTISTS ═══
  SELECT jsonb_build_object(
    'unresolved_artists', (
      SELECT COUNT(*)::int FROM wb_entities e WHERE e.entity_type = 'artist'
      AND NOT EXISTS (SELECT 1 FROM wb_platform_ids pid WHERE pid.entity_id = e.id)
    ),
    'unresolved_sample', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', t.canonical_name, 'created_at', t.created_at))
      FROM (
        SELECT e.canonical_name, e.created_at FROM wb_entities e
        WHERE e.entity_type = 'artist'
        AND NOT EXISTS (SELECT 1 FROM wb_platform_ids pid WHERE pid.entity_id = e.id)
        ORDER BY e.created_at DESC LIMIT 10
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  -- ═══ OPS: SCRAPER RUN HISTORY ═══
  SELECT jsonb_build_object(
    'scraper_run_history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'scraper_name', t.scraper_name, 'scraper_group', t.scraper_group,
        'started_at', t.started_at, 'status', t.status
      ) ORDER BY t.started_at DESC)
      FROM (
        SELECT scraper_name, scraper_group, started_at, status FROM scraper_runs
        WHERE started_at >= NOW() - INTERVAL '48 hours'
        ORDER BY started_at DESC LIMIT 200
      ) t
    ), '[]'::jsonb)
  ) INTO v_section;
  v_result := v_result || v_section;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_health_extended() TO service_role;
