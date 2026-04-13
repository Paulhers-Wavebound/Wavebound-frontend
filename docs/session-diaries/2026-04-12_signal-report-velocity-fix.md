# Session Diary: Signal Report Velocity Fix

**Date:** 2026-04-12

## What changed

- `src/data/contentDashboardHelpers.ts:639` — Replaced the broken `delta_avg_views_pct` aggregation with a client-side computation derived from `avg_views_7d` and `avg_views_30d`. The Signal Report's "Velocity" metric now reflects real WoW vs trailing-30d view deltas.
- `docs/handoffs/backend-todo.md` — Added new item #0 documenting the upstream pipeline gap: `delta_*` columns never written, plus 5 active roster artists missing `avg_views_7d` entirely.

## Why

Paul asked why the Content & Social dashboard's Signal Report showed "Velocity 0%". I queried `roster_dashboard_metrics` directly and confirmed: 11 of 13 Columbia roster artists have `delta_avg_views_pct = NULL` and the other 2 (Chance Peña, Henry Moodie) have it stored as literal `0`. The frontend filter `!= null` kept only those two zero-rows, averaged them, and displayed `0%`. The data to compute the delta was right there in the same row — the upstream view just never wrote it.

## What was tested

- `npx tsc --noEmit` — clean
- Manually computed expected velocity from live `roster_dashboard_metrics` data:
  - Alina +3.2%, Henry Moodie −39.2%, Malcolm Todd +50.9%, Max McNown −30.4%, Meg Moroney −6.3%, The Chainsmokers −52.3%
  - 6 artists qualify (others have `avg_views_7d` null and are excluded)
  - **Expected roster average: ≈ −12.3%** — meaningfully negative because more roster artists are decelerating than accelerating right now

## What to verify in browser

- Open `/label/content-social` (or wherever the Signal Report renders) and confirm the Velocity tile now shows **roughly −12%** instead of `0%`.
- The number should look "directionally honest" — Malcolm Todd is on a tear, Chainsmokers and Henry Moodie are cooling. If the displayed average is wildly different from −12%, there's a downstream consumer of `delta_avg_views_pct` I missed.

## Why a frontend workaround is okay here

The fix is one client-side computation from columns we already query — no extra round trips, no schema change, no risk. The proper fix is in the backend pipeline (logged as backend-todo #0), but waiting on that would mean the Signal Report stays broken in the meantime. When the backend lands, the frontend code can stay as-is or be reverted to read the column directly — both will produce identical numbers because the math is the same.

## "While I was in here" — recommendations

1. **Bb Trickz is fully empty** in `roster_dashboard_metrics` — both `avg_views_7d` and `avg_views_30d` are NULL despite the handle being fixed to `imsorrymissjacksonuhh` last week. Likely the post-fix re-scrape never ran. Re-check after backend-todo #3 lands.
2. **The Kid LAROI is also fully empty** despite having 86 videos tracked. Worth investigating — same root cause as Bb Trickz, or different?
3. **`delta_engagement_pct` and `delta_followers_pct` have the exact same bug** — both are null/0 across the roster. The Signal Report doesn't currently use them, but anywhere else that does will show the same fake-zero.
4. **Consider adding a "data quality" badge** to dashboard tiles when fewer than half the roster has the underlying data populated. Right now the Velocity tile silently averaged 2 zero-rows and looked confident about it. A `(6 of 13 artists)` subscript would catch this kind of bug at a glance.
5. **The 7d-window aggregator's NULL behavior is a footgun.** Any time an artist doesn't post for a week, they vanish from every dashboard average. Either fall back to last-N-posts averaging or store `0` with a `has_recent_posts=false` flag — but don't silently drop them.
