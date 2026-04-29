# TikTok cadence drift sync

## What changed

- `supabase/migrations/20260429202000_tiktok_cadence_drift_sync.sql`
  - Added `derive_tiktok_posting_cadence(freq_7d, freq_30d, days_since)`.
  - Added `tiktok_cadence_drift_check` view to list stale `tiktok_video_summary` cadence/recency rows.
  - Added `refresh_tiktok_cadence_from_roster()` to sync `posting_cadence` and `days_since_last_post` from `roster_dashboard_metrics`.
  - Scheduled `daily-tiktok-cadence-drift-sync` at `20 11 * * *`.
- `src/data/contentDashboardHelpers.ts`
  - `getContentHealthMeta()` now exposes `recencyLabel` and `evidenceLabel`.
- `src/components/label/content-social/ContentRosterTable.tsx`
  - Consistency subtitle now shows both cadence and recency, e.g. `0.6/wk · 2d ago`.
- `docs/features/content-social-dashboard.md`
  - Documented the daily drift sync and richer Consistency evidence.

## Why

After fixing the Consistency pill, Max McNown still had stale `tiktok_video_summary.days_since_last_post = 6` while the fresher roster metric said `2`. That could make the artist profile / expanded context contradict the roster again. The dashboard should not depend on stale derived TikTok summary fields when fresher roster metrics already exist.

## What was tested

- Verified column names for `tiktok_video_summary`, `artist_content_dna`, and `roster_dashboard_metrics` via `information_schema`.
- Previewed stale `days_since_last_post` mismatches before updating; 21 rows were stale.
- Applied migration to production Supabase.
- Ran `select public.refresh_tiktok_cadence_from_roster();` once; it updated 21 rows.
- Verified `select count(*) from public.tiktok_cadence_drift_check;` returns `0`.
- Verified cron exists and is active: `daily-tiktok-cadence-drift-sync | 20 11 * * * | active=true`.
- Verified Max McNown now has `posting_cadence = sporadic` and `days_since_last_post = 2`.
- `npx tsc --noEmit` — clean.
- Targeted lint on touched implementation files — clean.
- `git diff --check` — clean.
- Full `npm run lint` still fails on pre-existing repo-wide lint debt: 958 errors / 129 warnings.
- `npm audit --audit-level=high` still fails on pre-existing dependency advisories: 27 vulnerabilities (12 moderate, 14 high, 1 critical).

## What to verify in browser

1. Open Content & Social roster.
2. Find Max McNown.
3. Consistency should show `Inconsistent` with `0.6/wk · 2d ago`.
4. Expanded row cadence should no longer contradict the summary fields.

## While I was in here

1. Add a System Health tile for `tiktok_cadence_drift_check` so drift count is visible to ops.
2. Consider moving cadence derivation fully into a DB view used by both roster and profile surfaces.
3. Add a lightweight regression test for `getContentHealthMeta()` using Max's exact case.
