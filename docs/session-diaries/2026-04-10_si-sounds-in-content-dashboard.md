# SI Sounds in Content & Social Dashboard

**Date:** 2026-04-10

## What changed

- **New RPC:** `get_si_sound_performance(p_label_id)` — lightweight extraction from `sound_intelligence_results` + `sound_intelligence_videos` returning sound_id, track_name, artist_name, total_views, videos_count, unique_creators, si_status, weekly_new_videos, completed_at, job_id
- **Migration:** `migrations/20260410_si_sound_performance_rpc.sql` — deployed to production
- **`src/hooks/useContentDashboardData.ts`** — Added parallel RPC call for SI sounds, merged into `songUGC` with deduplication by sound_id/tiktok_music_id, sorted by total plays
- **`docs/features/content-social-dashboard.md`** — Updated with new data source

## Why

Sound Performance on TikTok only showed songs from `catalog_tiktok_performance`, which requires entity linkage through `wb_platform_ids` + `wb_entity_relationships`. Sounds analyzed via Sound Intelligence (manual or auto-discovery) were invisible in this section because they lack catalog entity linkage.

## What was tested

- `tsc --noEmit`: clean compile, zero errors
- RPC tested against Columbia label (`8cd63eb7-7837-4530-9291-482ea25ef365`): returns 5+ sounds with real data (e.g., "Something Just Like This" at 982M views, "Paris" at 122M views)
- Verified deduplication: "Earrings" exists in both catalog and SI — only catalog version kept
- SI status mapping: accelerating -> trending, active -> active, declining -> established

## What to verify in browser

- Navigate to Content & Social dashboard — Sound Performance section should now show many more sounds than before
- Clicking an SI-sourced sound should navigate to its Sound Intelligence detail page
- Verify sort order makes sense (highest plays first)
- Check that catalog-sourced songs (e.g., "As It Was") still appear and work correctly

## While I was in here, I also noticed/recommend

1. **Sound Performance shows max 10 rows** — with SI sounds now populating the list, consider adding a "Show all" expander or pagination since there could be 20+ sounds
2. **No "source" indicator** — users can't tell if a sound came from catalog vs SI. A subtle badge ("SI analyzed" or a small icon) would help them understand data richness differences
3. **`fan_videos` and `fan_to_artist_ratio` always 0 for SI sounds** — these metrics require the catalog pipeline. Could approximate from `sound_intelligence_videos` intent_breakdown (organic vs artist_official) in a future RPC enhancement
4. **Missing `videos_last_30d` for SI sounds** — only `weekly_delta_videos` is available. Could compute 30d from velocity data in the analysis JSON
5. **The RPC uses a correlated subquery for `unique_creators`** — fine for 30 rows but if SI grows to hundreds of sounds per label, should switch to a lateral join or materialized column
