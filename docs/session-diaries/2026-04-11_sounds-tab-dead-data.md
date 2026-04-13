# Session Diary — Sounds Tab Dead Data Fix

**Date:** 2026-04-11
**Task:** Investigate and fix the Sounds tab on artist profiles showing almost no data despite having extensive per-sound data in the database.

## What changed

### `/src/hooks/useContentIntelligence.ts`
- Added a **Phase 2a** pre-query that looks up the artist's song entity IDs from `wb_entities` (type=song, `metadata->>'artist_entity_id'`)
- Modified the `catalog_tiktok_performance` query to use a **two-step strategy**: first try `artist_entity_id` (fast path for the 3% of rows where it's populated), then fall back to `song_entity_id.in()` using the IDs from Phase 2a
- This unblocks the "Sound Performance on TikTok" section for all artists

### `/src/components/label/artist-tabs/SoundsTab.tsx`
- Fixed "Catalog Streams: 0" showing with "0.0% 7d" — now hidden when value is 0
- Relaxed Playlist Intelligence guard from `songsInPlaylists > 0` to also show when `totalPlaylistPlacements > 0`

### `/docs/handoffs/backend-todo.md`
- Added item #5: Backfill `artist_entity_id` on `catalog_tiktok_performance` with SQL migration and pipeline fix

## Why

The Sounds tab was showing only Streaming Pulse because:
1. `catalog_tiktok_performance.artist_entity_id` is NULL on 97% of rows (9,254/9,515) — the pipeline writes `song_entity_id` but never backfills the artist FK
2. Sections used `{array.length > 0 && ...}` guards that silently hid empty sections instead of showing useful empty states
3. "Catalog Streams: 0" rendered as a real metric instead of being hidden

## What was tested

- `tsc --noEmit` — clean, zero errors
- Verified PostgREST JSON arrow query `metadata->>artist_entity_id` works against `wb_entities` (returns 346 songs for BTS test artist)
- Verified `song_entity_id` is populated on 9,346/9,515 rows in `catalog_tiktok_performance`
- Verified `song_velocity` is well-linked (628K rows, 99.9% have `artist_entity_id`)

## What to verify in browser

1. Open any artist profile → Sounds tab
2. "Sound Performance on TikTok" section should now appear if the artist has TikTok catalog data
3. "Catalog Streams" should no longer show "0" with "0.0% 7d"
4. Check that no performance regression on page load (the extra `wb_entities` query adds ~100ms)

## Recommendations

1. **Run the backend backfill migration** (see `docs/handoffs/backend-todo.md` #5) — this eliminates the frontend workaround and makes all per-artist catalog queries instant
2. **Add loading skeletons to the Sounds tab** — currently shows nothing during fetch, then pops in. Should shimmer.
3. **Clean up `song_name` in `catalog_tiktok_performance`** — values include artist name embedded (e.g. `"Let Go" by Johnny Orlando`) which will look weird when rendered under an artist profile where the artist name is already shown
4. **Catalog Velocity may still be empty for some artists** — `song_velocity` has data but the specific artist may not match. Worth checking if the entity_id linkage is correct for all roster artists.
5. **Consider showing "No playlist data yet" instead of hiding Playlist Intelligence entirely** — labels want to know when an artist has zero playlist placements, that's actionable info
