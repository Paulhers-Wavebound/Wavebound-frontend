# Session Diary: Roster Coverage Page

**Date:** 2026-04-12

## What changed

- **New page:** `src/pages/label/health/HealthRosterCoverage.tsx` — per-artist data quality matrix at `/label/admin/health/roster-coverage`. Rows = roster artists, columns = **19 critical fields** across 3 source tables (`roster_dashboard_metrics`, `artist_content_dna`, `artist_content_evolution`), grouped as Core / Velocity / Reach / Quality / Signature / Trajectory. Each cell renders as ✅ value, ⚠ "0" (suspect zero), or ✗ (NULL). Includes a top KPI strip (overall coverage %, missing count, suspect zeros, weakest field, weakest artist), per-row coverage bar, and a footer row showing per-field `ok / total` ratios.
- **Multi-table fetch:** Phase 1 pulls roster for the current `label_id`, then Phase 2 fans out in parallel to `artist_content_dna` and `artist_content_evolution` using normalized handles (same pattern as `useContentDashboardData.ts:107`). DNA/Evolution queries soft-fail — if one table is broken, its columns render as NULL instead of blanking the whole page. That's the point: surface upstream gaps, don't hide them.
- **Routing:** Added lazy import + `<Route path="roster-coverage">` in `src/App.tsx` under the existing `/label/admin/health` outlet.
- **Sidebar:** Added "Roster Coverage" entry with `Users` icon to the existing "Data Quality" group in `src/pages/label/health/HealthSidebar.tsx`.
- **Breadcrumbs:** Added the new path to both `ROUTE_MAP` and `PARENT_MAP` in `src/pages/label/LabelLayout.tsx` so the breadcrumb trail renders correctly.

## Why

After fixing the Signal Report's "Velocity 0%" bug earlier today, the underlying issue was that `delta_avg_views_pct` was silently NULL/zero across most of the roster — and we only caught it because Paul stared at one tile and thought "that can't be right." We need a way to spot upstream pipeline gaps _before_ they leak into a tile and look wrong.

The Roster Coverage page is the canonical "is the data actually here?" view: one screen, every artist, every critical field, color-coded. If the backend pipeline silently stops populating something for an artist, this page surfaces it immediately.

## Audited fields (v2)

19 fields across 3 source tables:

| Group      | Source Table               | Fields                                                                                               |
| ---------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Core       | `roster_dashboard_metrics` | `total_videos`, `days_since_last_post`                                                               |
| Velocity   | `roster_dashboard_metrics` | `avg_views_7d`, `avg_views_30d`, `delta_avg_views_pct`, `avg_engagement_30d`, `delta_engagement_pct` |
| Reach      | `roster_dashboard_metrics` | `tiktok_followers`, `instagram_followers`, `delta_followers_pct`                                     |
| Quality    | `roster_dashboard_metrics` | `momentum_tier`                                                                                      |
| Signature  | `artist_content_dna`       | `videos_analyzed`, `avg_hook_score`, `avg_viral_score`, `best_format`, `primary_genre`               |
| Trajectory | `artist_content_evolution` | `performance_trend`, `views_change_pct`, `strategy_label`                                            |

`days_since_last_post` is the only field where literal `0` is treated as a valid value (an artist could have posted today). Every other numeric field treats `0` as a "suspect zero" (yellow ⚠) because in practice that's almost always a placeholder, not a real measurement.

## Status logic

```ts
NULL                                     → "missing" (red ✗)
0 in a numeric field where 0 is invalid  → "suspect" (yellow ⚠)
anything else                            → "ok" (green ✓)
```

## What was tested

- `npx tsc --noEmit` — clean
- Cross-checked against all 3 live source tables for the Columbia roster:
  - `roster_dashboard_metrics`: 5 artists null on `avg_views_7d` (Addison Rae, Chance Peña, Harry Styles, Miles Caton, Presley Haile), 2 artists with literal-zero deltas (Chance Peña, Henry Moodie), Bb Trickz + The Kid LAROI fully empty
  - `artist_content_dna`: **all 13 artists populated** across all 5 Signature fields — this entire section will be green
  - `artist_content_evolution`: **all 13 artists populated** except Bb Trickz's `views_change_pct` (expected — handle was fixed this week, rescrape hasn't caught up)

The good news from the v2 extension: the DNA/Evolution pipelines are clearly healthy. Every pipeline gap we know about lives in `roster_dashboard_metrics`, which makes the fix target crystal clear.

## What to verify in browser

1. Open `/label/admin/health/roster-coverage` and confirm:
   - **Roster columns (Core/Velocity/Reach/Quality):** Bb Trickz and The Kid LAROI bubble up as the weakest rows. Addison Rae / Harry Styles / Miles Caton / Presley Haile / Chance Peña all show red ✗ in **Views 7d**. Chance Peña + Henry Moodie show yellow ⚠ "0" in all three delta columns.
   - **Signature columns (Analyzed / Hook / Viral / Best Format / Genre):** all green for all 13 artists
   - **Trajectory columns (Trend / Δ Views WoW / Strategy):** all green except Bb Trickz's Δ Views WoW (red ✗)
   - Footer "Field coverage" row: `delta_avg_views_pct` worst at ~2/13, all 5 Signature fields at 13/13, `views_change_pct` at 12/13
2. Sidebar — "Roster Coverage" should appear under "Data Quality" between "Data" and "Identity"
3. Breadcrumb should read **System Health → Roster Coverage**
4. Refresh button in the top right should re-query and update without a full page reload
5. Horizontal scroll works — with 19 columns + the sticky artist column, the table needs to scroll sideways on most screens

## "While I was in here"

1. **Click-through to the artist profile.** Each row's name should link to `/label/artists/<handle>` so a missing-data alert is one click from the page that depends on it.
2. **Pipeline-level "last refreshed" stamp** at the top — `roster_dashboard_metrics.updated_at` per artist would tell you whether the data is missing or just stale. The column exists; just need to surface it.
3. **Email/Slack alert when coverage drops below a threshold.** Once the cron deployment lands (handoff `2026-04-12_sound-tracking-cron-deploy.md`), this page should be the source of truth for "did the cron actually populate everything it was supposed to?" — and we should get pinged when it didn't.
4. **Reuse the cell-status function for other tables.** `catalog_tiktok_performance`, `artist_intelligence`, `artist_content_dna` all have the exact same shape problem (which artists have which fields). The `cellStatus` + `<Cell>` pattern is genuinely reusable — worth pulling into `src/components/admin/health/CoverageMatrix.tsx` once we have a second consumer.
