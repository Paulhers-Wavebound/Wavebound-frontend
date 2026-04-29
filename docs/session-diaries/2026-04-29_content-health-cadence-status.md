# Content health cadence status

## What changed

- `src/data/contentDashboardHelpers.ts`
  - Added `getContentHealthStatus()` so the Consistency pill and sort use one shared rule.
  - Added `getContentHealthMeta()` so the UI can show the exact posts-per-week evidence and stale-cadence warnings.
  - Numeric `posting_freq_7d` / `posting_freq_30d` now drive the status before the older categorical `posting_cadence` fallback.
  - Content Health sort now uses the same status model instead of `consistency_score - days_since_last_post * 2`.
- `src/components/label/content-social/ContentRosterTable.tsx`
  - `ContentHealthPill` now reads the shared helper from `contentDashboardHelpers`.
  - Added a small posts-per-week subtitle under each Consistency pill.
  - Added a warning tooltip when the old categorical `posting_cadence` disagrees with numeric frequency by more than one bucket.
  - Removed the local rule that could label an artist `Hot` just because `posting_cadence = daily` and `performance_trend = improving`.
- `docs/features/content-social-dashboard.md`
  - Documented that numeric frequency wins over stale cadence labels.

**Production data**

- Backfilled `tiktok_video_summary.posting_cadence` from `roster_dashboard_metrics.posting_freq_7d`, `posting_freq_30d`, and `days_since_last_post`.
- Updated 24 stale summary rows:
  - `daily -> sporadic`: 6
  - `regular -> inactive`: 6
  - `daily -> regular`: 4
  - `sporadic -> inactive`: 3
  - `inactive -> dormant`: 2
  - `regular -> dormant`: 2
  - `regular -> sporadic`: 1

## Why

Max McNown showed `Hot` in the roster while the expanded row said he last posted 2 days ago and was posting every couple of weeks. The data confirmed the contradiction:

- `roster_dashboard_metrics.posting_freq_7d = 0.57`
- `roster_dashboard_metrics.posting_freq_30d = 0.53`
- `tiktok_video_summary.posting_cadence = daily`
- `artist_content_evolution.performance_trend = improving`

The old pill trusted the categorical cadence first, so `daily + improving` became `Hot`. The expanded row used numeric frequency, which correctly mapped Max to "Posting every couple of weeks." Numeric frequency is the more transparent source for the roster.

## What was tested

- Verified live column names for `roster_dashboard_metrics` and `tiktok_video_summary` before querying.
- Queried Max McNown's live data and reproduced the mismatch.
- Checked the new frequency rule against Max's values; it resolves to `Inconsistent`.
- Verified Max McNown's `tiktok_video_summary.posting_cadence` is now `sporadic`.
- Verified the stale-cadence conflict query now returns `0`.
- `npx tsc --noEmit` — clean.
- Targeted lint on touched implementation files — clean.
- `git diff --check` — clean.
- Full `npm run lint` still fails on pre-existing repo-wide lint debt: 958 errors / 129 warnings.
- `npm audit --audit-level=high` still fails on pre-existing dependency advisories: 27 vulnerabilities (12 moderate, 14 high, 1 critical).

## What to verify in browser

1. Open `/label` as Content & Social.
2. Find Max McNown.
3. The Consistency pill should no longer say `Hot`; with the current data it should say `Inconsistent`.
4. Expand the row and confirm the Cadence tile still says "Posting every couple of weeks."

## While I was in here

1. Add a tiny subtitle under the Consistency pill (`0.6/wk` or `2d ago`) so reps can see the reason without expanding.
2. Add a stale-data warning when `posting_cadence` conflicts with roster frequency by more than one bucket.
3. Backfill/recompute `tiktok_video_summary.posting_cadence`; Max's `daily` category is clearly stale relative to current roster metrics.
