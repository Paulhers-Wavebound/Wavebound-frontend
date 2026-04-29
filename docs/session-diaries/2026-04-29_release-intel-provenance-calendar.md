# Release intel provenance + calendar

## What changed

**Structured release intelligence**

- `edge-functions/generate-artist-focus.ts`
  - Extended the AI output from only `next_release_date` to a full `next_release` object:
    `date`, `title`, `source_url`, `source_type`, `evidence`, `confidence`, `checked_at`.
  - Keeps top-level `next_release_date` and `next_release_confidence` for backwards-compatible dashboard reads.
  - Added a `release_scan_only` mode so the system can refresh upcoming-release intel without regenerating each full artist brief.
  - Release-only scans update `weekly_pulse.next_release*` without bumping `weekly_pulse_generated_at`; the release intel carries its own `checked_at`.
  - Full brief generation and release-only scans now persist structured release intel into the DB.

**Database**

- `supabase/migrations/20260429193000_artist_release_calendar.sql`
  - Created `artist_release_calendar` for auditable upcoming-release intelligence.
  - Added RLS: label members can view/update/insert their label rows; service role has full access.
  - Added indexes for label/date and artist lookups.
  - Added `trigger_upcoming_release_scan()` which calls the Edge Function in `release_scan_only` batch mode.
  - Scheduled `daily-upcoming-release-scan` via `pg_cron` for `0 11 * * *`.
  - Stored the Edge Function auth key in Supabase Vault as `supabase_service_role_key`; no secret is committed.

**Frontend**

- `src/hooks/useContentDashboardData.ts`
  - Fetches active future rows from `artist_release_calendar`.
  - Prefers calendar rows over `weekly_pulse` fallback fields.
- `src/data/contentDashboardHelpers.ts`
  - Added release provenance fields to `ContentArtist`.
  - Posting Window ignores `low` confidence upcoming dates for the green pill/sort.
- `src/components/label/content-social/ContentRosterTable.tsx`
  - Upcoming-release pills now show confidence/source in the subtitle.
  - Hover tooltip shows release title, evidence, and source URL.
- `src/components/label/briefing/AIFocus.tsx`
  - Extended `WeeklyPulse` typing with the new release intel fields.
- `src/pages/label/LabelArtistProfile.tsx`
  - Fetches the nearest future `artist_release_calendar` row for the artist profile and merges it into `weekly_pulse` before rendering.
  - Added authenticated upsert for label users to confirm a missed upcoming release with date/source/title.
- `src/components/label/artist-tabs/OverviewTab.tsx`
  - Added a Release Intel panel below AI Focus.
  - Shows release source/evidence/confidence for positive finds, "No dated release found" for fresh null scans, and "Not scanned yet" for artists without release intel.
  - Added a "Confirm release" dialog that writes a `confirmed`/`manual` calendar row.
- `docs/features/content-social-dashboard.md`
  - Updated behavior, edge cases, and data-source docs.

## Why

Paul called out the real source-of-truth problem: upcoming release dates are scattered across captions, press, DSP pre-save pages, artist announcements, and label context. The AI is the right collector, but the roster needs provenance and a durable table so the signal can be trusted, corrected, refreshed, and eventually used outside the brief.

## What was tested

- Verified live DB columns for `artist_intelligence`, `roster_dashboard_metrics`, `labels`, and `user_profiles` via `information_schema` before writing new queries.
- Applied migration to production Supabase successfully.
- Applied and verified the live RLS insert policy for `artist_release_calendar`; label members can now create confirmed rows through the app.
- Deployed `generate-artist-focus` v28.
- Triggered one release-only scan:
  - Artist: `malcolmtodddd`
  - Label: `8cd63eb7-7837-4530-9291-482ea25ef365`
  - Result: `2026-06-05`, title `Do That Again`, confidence `high`, source URL from Spotify pre-release.
- Verified the row persisted in `artist_release_calendar`.
- Verified the exact URLSearchParams-based REST query used by the profile fetch returns Malcolm Todd's future calendar row.
- Verified `artist_intelligence.weekly_pulse.next_release` and compatibility fields persisted.
- Verified release-only scans do not bump `weekly_pulse_generated_at`; Malcolm Todd stayed at `2026-04-29T17:48:51.373+00:00` while `next_release.checked_at` updated.
- Tested Addison Rae (`addisonre`, Columbia US) through both paths:
  - `release_scan_only` returned structured null release intel because no specific public announced release date was found in the next 60 days.
  - Full brief generation also persisted `weekly_pulse.next_release = { date: null, ... }` and compatibility fields as null.
  - Verified no `artist_release_calendar` row was created for Addison, which is correct for a null/no-evidence result.
- Verified cron exists and is active:
  `daily-upcoming-release-scan | 0 11 * * * | active=true`.
- `npx tsc --noEmit` — clean.
- Targeted lint on touched implementation files — clean.
- `git diff --check` — clean.
- Full `npm run lint` was attempted and is still blocked by pre-existing repo-wide lint debt: 958 errors / 129 warnings, mostly old `any` and `var` issues outside this change.

## What to verify in browser

1. Open `/label` as a Content & Social role.
2. Posting Window still shows `FRESH RELEASE` for recent-release artists.
3. Hover an upcoming-release `DROP IN Xd` pill after release scans populate; tooltip should show evidence/source.
4. Low-confidence release intel should not produce a green upcoming pill.
5. Open Malcolm Todd's artist profile Overview tab; Release Intel should show `Do That Again`, `Jun 5, 2026`, high confidence, and a Spotify source.
6. Open Addison Rae's artist profile Overview tab; Release Intel should show a fresh "No dated release found" state from the full generation test.
7. Use "Confirm release" with a safe test source/date if you want to validate the manual override path in-browser; it should update the panel immediately and create a `confirmed` row.

## While I was in here

1. Add `Dismiss`/`Edit date` actions next to the new `Confirm release` flow so reps can correct false positives as easily as false negatives.
2. Add a health tile for `daily-upcoming-release-scan` in System Health, same pattern as other cron gap checks.
3. Backfill one release-only scan across the whole active roster during a low-traffic window; the daily cron will keep it fresh afterward.
