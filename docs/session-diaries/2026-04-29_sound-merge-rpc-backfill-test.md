# Sound Merge RPC Backfill And Parser Test

## What changed

- Added `supabase/migrations/20260429213000_sound_duplicate_distinct_ids_and_url_backfill.sql`.
- Backfilled `sound_intelligence_jobs.sound_url` to canonical `https://www.tiktok.com/music/<sound_id>` values in production; 185 job rows were updated and group members already needed 0 updates.
- Replaced `get_sound_duplicate_candidates` so candidate rows are collapsed to one representative job per distinct `sound_id`, and candidates require at least two distinct IDs before being returned.
- Extracted the sound ID parser into `src/utils/soundIdParser.ts` and re-exported it from `src/utils/soundIntelligenceApi.ts`.
- Added `scripts/run-sound-id-parser-regression.mjs` with regression cases for `/music/Track-123`, `/music/123`, `/music/-123`, and non-sound video URLs.

## Why

The UI-side fallback fixed the immediate merge error, but the source data and RPC still needed to be made clean so every caller gets canonical URLs and true cross-ID duplicate candidates.

## What was tested

- Verified relevant live Supabase columns before writing queries.
- Counted pending URL backfill rows before migration: 185 job rows and 0 group member rows.
- Applied the migration to Supabase with `psql`.
- Verified non-canonical URL count after migration: 0 job rows and 0 member rows.
- Smoke-tested authenticated duplicate suggestions in a rollback transaction: 5 candidates returned, minimum candidate ID count was 2, and every candidate had at least two IDs.
- Ran `node scripts/run-sound-id-parser-regression.mjs` successfully.
- Ran `npx eslint src/utils/soundIdParser.ts src/utils/soundIntelligenceApi.ts src/utils/soundGroupApi.ts` successfully.
- Ran `npx tsc --noEmit` successfully.
- Ran `npm run build` successfully; existing Browserslist, Tailwind ambiguity, and chunk-size warnings remain.

## What to verify in browser

- Suggested Merges should no longer show duplicate-only cards such as three copies of the same `sound_id`.
- Merge suggestion should work for valid cards without the sound ID extraction toast.

## While I was in here recommendations

- Add this parser regression script to the package scripts once the current `package.json` changes are settled.
- Add the same distinct-ID summary fields to the card UI if users need to understand why a suggestion qualifies.
- Add a periodic data-health check for malformed TikTok sound URLs.
