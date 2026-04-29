# Sound ID Merge Follow-Ups

## What changed

- Added group-aware Sound Intelligence RPCs in `supabase/migrations/20260429185209_sound_group_rpc.sql` for canonical group lists, bundled group detail data, aggregated group monitoring history, and duplicate merge suggestions.
- Updated `src/utils/soundGroupApi.ts` with RPC-backed group loading, group monitoring history, duplicate candidate helpers, and an API for adding an existing job to a merged sound.
- Updated `src/pages/label/SoundGroupDetail.tsx` and `src/components/sound-intelligence/MonitoringTrendChart.tsx` so the All IDs view uses real group-level monitoring history while per-ID filters still use raw job history.
- Added Suggested Merges to `src/pages/label/SoundIntelligenceOverview.tsx` using ISRC, Spotify ID, and title/artist candidate matches.
- Added a merge dialog to `src/pages/label/SoundIntelligenceDetail.tsx` so a raw analysis can be attached to an existing merged sound or used to create a new merged sound.
- Updated `docs/features/sound-id-merge.md` with the completed follow-up behavior.

## Why

One song can exist under several TikTok browser `sound_id`s even when TikTok mobile consolidates them. The first pass let users manually create canonical sound groups; this follow-up makes the workflow operational by reducing detail-page fan-out, surfacing likely duplicates, showing true group monitoring, and letting users merge from raw detail pages.

## What was tested

- Verified live Supabase access and columns before adding RPC queries.
- Applied `20260429185209_sound_group_rpc.sql` to the Supabase project with `psql`.
- Smoke-tested authenticated RPC access for label `8cd63eb7-7837-4530-9291-482ea25ef365`: `can_access_label = true`, duplicate candidate count returned `6`, and group list returned a JSON array.
- Ran `npx tsc --noEmit` successfully.
- Ran `npm run build` successfully. Build retained existing Browserslist/Tailwind ambiguity/chunk-size warnings.

## What to verify in browser

- In Sound Intelligence overview, Suggested Merges render for likely duplicate sounds and the Merge suggestion button creates a canonical group.
- On a merged sound detail page, All IDs shows aggregate monitoring when enough group snapshots exist, and selecting an individual sound ID still switches to that raw ID.
- On a raw sound detail page, the Merge button opens the dialog, existing groups can accept the current sound ID, and pasted links create a new merged sound.

## While I was in here recommendations

- Show a small "already merged" badge on raw sound detail pages when the current job already belongs to a canonical group.
- Add a dismiss/snooze state for Suggested Merges so rejected low-confidence title/artist matches do not keep coming back.
- Add a background job to auto-create high-confidence ISRC/Spotify merges for roster sounds once the team is comfortable with the UX.
