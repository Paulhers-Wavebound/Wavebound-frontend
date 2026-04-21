-- 20260416_orphan_cleanup.sql
--
-- Removes orphan rows whose artist_handle is not present in
-- artist_intelligence. These accumulated because the delete-artist edge
-- function only covered 16 of ~36 artist_handle-carrying tables and
-- silently reported success on partial failures.
--
-- Dry-run audit on 2026-04-16 found 1,482 orphan rows across 21 tables,
-- attributable to 10 ghost handles:
--   dagnymusic (582), belize.kazi (398), kilusmind (239), harrystyles (189),
--   itsgonnabemayyyyy (15), alexsucks (13), rachelchinouriri (6),
--   annemarie (6), wiffygriffy (5), chancepena (4).
--
-- =======
-- HOW TO RUN
-- =======
--
-- DRY-RUN (safe — auto-rolls back on disconnect because there is no
-- COMMIT at the end of this file):
--
--   psql "$DATABASE_URL" -f migrations/20260416_orphan_cleanup.sql
--
-- REAL RUN (persists the deletes):
--
--   psql "$DATABASE_URL"
--   \i migrations/20260416_orphan_cleanup.sql
--   -- Review the NOTICE output. If counts match the audit above:
--   COMMIT;
--   -- Otherwise:
--   ROLLBACK;
--   \q
--
-- Do NOT add a COMMIT to the bottom of this file. Keeping it
-- dry-run-by-default is the safety feature.

BEGIN;

DO $$
DECLARE
  r RECORD;
  orphan_count bigint;
  total bigint := 0;
BEGIN
  FOR r IN
    SELECT unnest(ARRAY[
      -- FK-sensitive first: fan_briefs.segment_id → content_segments,
      -- content_segments.catalog_id → content_catalog (CASCADE).
      'fan_briefs',
      'content_segments',
      'content_catalog',
      -- Everything else (order doesn't matter):
      'artist_rag_content',
      'artist_sound_daily',
      'artist_videos_tiktok',
      'artist_sound_video_stats',
      'artist_format_performance',
      'deliverable_versions',
      'artist_content_evolution',
      'artist_content_dna',
      'deep_research_jobs',
      'onboarding_snapshots',
      'content_anomalies',
      'roster_dashboard_metrics',
      'artist_comment_pulse',
      'artist_audience_footprint',
      'artist_streaming_pulse',
      'artist_playlist_intelligence',
      'artist_catalog_pulse',
      'artist_touring_signal'
    ]) AS tbl
  LOOP
    EXECUTE format(
      'DELETE FROM %I WHERE artist_handle IS NOT NULL AND artist_handle NOT IN (SELECT artist_handle FROM artist_intelligence WHERE artist_handle IS NOT NULL)',
      r.tbl
    );
    GET DIAGNOSTICS orphan_count = ROW_COUNT;
    total := total + orphan_count;
    RAISE NOTICE '% : deleted % orphan rows', r.tbl, orphan_count;
  END LOOP;
  RAISE NOTICE '---';
  RAISE NOTICE 'TOTAL orphan rows deleted: %', total;
END $$;

-- See HOW TO RUN at top of file for commit instructions.
