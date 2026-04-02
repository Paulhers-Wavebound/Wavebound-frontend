# Sound Intelligence Detail — Missing Cover Art

## What changed

- `src/pages/label/SoundIntelligenceDetail.tsx` — after loading the analysis, fetch `cover_url` from `sound_intelligence_jobs` table and merge it into the analysis object

## Why

The `cover_url` is stored on the `sound_intelligence_jobs` table, not inside the analysis JSONB blob in `sound_intelligence_results`. The `get-sound-analysis` edge function returns the analysis blob which has `cover_url: null`, while the `list-sound-analyses` endpoint correctly joins the job-level `cover_url`. This caused the overview to show the cover art but the detail page to always show the fallback Music icon.

## What was tested

- `npx tsc --noEmit` — clean
- Verified RLS allows anon/authenticated reads of `sound_intelligence_jobs.cover_url`
- Confirmed the DB has cover URLs for entries that have them (stored in Supabase storage `sound-covers` bucket)

## What to verify in browser

- Navigate to a Sound Intelligence analysis that has a cover (Debussy or elpapi_music on label e6ea53f3)
- Confirm the cover art now appears in the SoundHeader on the detail page

## While I was in here

- The `get-sound-analysis` edge function should ideally return `cover_url` from the jobs table alongside the analysis — would eliminate the extra client-side query. Backend todo.
- Older analyses (Aperture, As It Was) have no cover_url at all — the backend scraper wasn't saving covers for those runs
- The analysis JSONB has a `cover_url` field that's always null — could be removed from the blob since the canonical source is the jobs table
