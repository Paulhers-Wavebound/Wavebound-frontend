# 2026-04-29 — Sound ID Merge

## What changed

- Added `supabase/migrations/20260429183722_sound_canonical_groups.sql` and applied it to the linked Supabase project:
  - `sound_canonical_groups`
  - `sound_canonical_group_members`
  - indexes, RLS policies, and group `updated_at` trigger
- Added `src/utils/soundGroupApi.ts` for listing/creating groups and resolving pasted TikTok sound links into existing or newly triggered Sound Intelligence jobs.
- Added `src/utils/soundGroupAggregation.ts` to aggregate multiple member analyses into one canonical `SoundAnalysis` read.
- Added `src/pages/label/SoundGroupDetail.tsx` with:
  - All-ID aggregate view
  - per-`sound_id` filters
  - member table with raw analysis links
  - add-more-IDs dialog
- Updated `src/pages/label/SoundIntelligenceOverview.tsx` so the Track Sound panel accepts multiple `/music/` links and renders merged sound cards.
- Added route/breadcrumb support in `src/App.tsx` and `src/pages/label/LabelLayout.tsx`.
- Added feature documentation in `docs/features/sound-id-merge.md` and cross-linked it from `docs/features/auto-sound-intelligence.md`.

## Why

TikTok mobile consolidates multiple sound IDs into one song-level view, but the browser scrape pipeline sees each ID separately. Paul needs Sound Intelligence to support a canonical monitored sound made from multiple TikTok sound URLs, while still letting users isolate individual sound IDs as filters.

## What was tested

- Verified live Supabase columns via `information_schema.columns` before adding direct Supabase queries.
- Applied the additive migration to the linked Supabase project with `psql`.
- Verified new table columns and RLS policies via `information_schema.columns` and `pg_policies`.
- Ran a rollback-wrapped SQL smoke test to insert and delete a group member, verifying the `updated_at` trigger handles delete events.
- Ran `npx tsc --noEmit` successfully.
- Ran `npm run build` successfully.

## What to verify in browser

- Paste two full TikTok `/music/` links in Sound Intelligence's Track Sound panel and confirm a merged sound opens at `/label/sound-intelligence/groups/:groupId`.
- Confirm the group detail defaults to **All IDs** and per-ID filter buttons switch the detail modules.
- Add another sound ID from the group detail dialog and confirm it appears in the member table.
- Confirm raw analysis links in the member table open the original per-job detail page.

## While I was in here

- The aggregate monitoring chart is intentionally not faked; selecting a single ID shows that ID's real monitoring history. Backend should eventually create group-level monitoring snapshots.
- `list-sound-analyses` still returns raw jobs only. A backend-owned group-aware endpoint would reduce client fetch fan-out as merged groups grow.
- Duplicate prevention is enforced at the job level per label; if the same song needs a label-wide canonical registry later, add Spotify ISRC/track ID matching to the group model.
