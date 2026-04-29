# Sound Merge Suggestion Controls

## What changed

- Added `supabase/migrations/20260429193212_sound_duplicate_decisions_auto_merge.sql` with `sound_duplicate_candidate_decisions`, RLS policies, a decision upsert RPC, a filtered duplicate suggestion RPC, and a controlled high-confidence roster auto-merge RPC.
- Updated `src/utils/soundGroupApi.ts` with APIs for candidate decisions, roster auto-merge, and finding the canonical group for a raw job.
- Updated `src/pages/label/SoundIntelligenceOverview.tsx` so Suggested Merges can be snoozed, dismissed, or auto-merged when the candidate is roster-only and matched by ISRC/Spotify.
- Updated `src/pages/label/SoundIntelligenceDetail.tsx` so raw sound pages show an already-merged badge and route the merge button to the canonical group when applicable.
- Updated `src/types/soundIntelligence.ts` and `docs/features/sound-id-merge.md` for the new candidate metadata and behavior.

## Why

The first suggestion pass made duplicates visible, but it needed operational controls: hide bad matches, temporarily defer uncertain matches, safely auto-merge strong roster-only matches, and make raw detail pages explain when a sound ID is already part of a canonical monitored sound.

## What was tested

- Verified live Supabase column names for sound group/member/job/result tables before adding queries.
- Applied the new migration to Supabase with `psql`.
- Smoke-tested authenticated RPC access in a rollback transaction: duplicate candidates returned, snooze upsert returned `snoozed`, and auto-merge RPC returned a valid result without persisting test changes.
- Ran `npx eslint src/utils/soundGroupApi.ts src/pages/label/SoundIntelligenceOverview.tsx src/pages/label/SoundIntelligenceDetail.tsx src/types/soundIntelligence.ts` successfully.
- Ran `npx tsc --noEmit` successfully after implementation.
- Ran `npm run build` successfully. Build retained existing Browserslist/Tailwind ambiguity/chunk-size warnings.
- `npm run lint` still fails repo-wide on pre-existing legacy lint errors outside this feature slice.

## What to verify in browser

- Suggested Merges cards remove themselves after Snooze or Dismiss and stay hidden after refresh.
- Auto-merge roster appears only when high-confidence roster-only candidates exist, then refreshes the overview after grouping.
- Raw sound detail pages with grouped jobs show the merged badge and **View Merge** button.

## While I was in here recommendations

- Add an admin-only "restore dismissed suggestion" panel for accidental dismissals.
- Add candidate provenance detail on hover so users can see exactly which ISRC/Spotify ID caused a match.
- Add audit events for auto-merge actions once the audit log pattern is standardized.
