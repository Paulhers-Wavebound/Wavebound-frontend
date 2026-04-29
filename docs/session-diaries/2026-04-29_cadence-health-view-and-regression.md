# Cadence health view and regression coverage

## What changed

- `supabase/migrations/20260429210500_content_social_cadence_metrics.sql`
  - Added `content_social_cadence_metrics`, a shared roster-derived cadence view for Content & Social surfaces.
  - Exposes derived `posting_cadence`, roster recency/frequency, summary cadence/recency, `consistency_score`, and `has_drift`.
- `src/hooks/useContentDashboardData.ts`
  - Content & Social roster now prefers `content_social_cadence_metrics` for cadence, recency, frequency, and consistency score.
  - Falls back to `tiktok_video_summary` and `roster_dashboard_metrics` if the view query is unavailable.
- `edge-functions/admin-health.ts`
  - `admin-health` now returns `cadence_drift` with drift count, artists checked, sample rows, and status.
  - Overall health becomes yellow when cadence drift exists.
- `src/pages/label/health/components/SystemStatusSummary.tsx`
  - Added Cadence Drift summary tile.
- `src/components/admin/health/MorningBriefing.tsx`
  - Adds a warning item when cadence drift is non-zero.
- `scripts/run-content-health-regression.mjs` and `package.json`
  - Added `npm run test:content-health`, a lightweight regression script for Max McNown's stale cadence case.
- `docs/features/system-health.md` and `docs/features/content-social-dashboard.md`
  - Documented the shared cadence view, health tile, and drift behavior.

## Why

Max McNown exposed the deeper problem: the UI could be fixed locally, but stale cadence data needed one shared operational source of truth and a visible health signal. This makes cadence drift both harder to reintroduce and easier to catch.

## What was tested

- Verified live Supabase columns for `roster_dashboard_metrics`, `artist_content_dna`, `tiktok_video_summary`, `tiktok_cadence_drift_check`, and the new `content_social_cadence_metrics` view via `information_schema`.
- Applied the new view migration to production Supabase.
- Verified `content_social_cadence_metrics` returns 38 rows with 0 drift rows.
- Verified `tiktok_cadence_drift_check` returns 0 rows.
- Deployed `admin-health`; Supabase function list shows `admin-health` active at v34.
- Queried the new cadence view through PostgREST with the service role; sample rows returned expected derived cadence values.
- Called `admin-health` with the service token and got the expected `401 Invalid token`, confirming the deployed endpoint is reachable but still requires a real admin user JWT.
- `npx tsc --noEmit` — clean.
- `npm run test:content-health` — clean.
- Targeted ESLint on touched TS/TSX/MJS files — clean.

## What to verify in browser

1. Open `/label/admin/health`.
2. Overview should show a Cadence Drift tile next to Scrapers/API/Data Freshness.
3. Current expected state is `OK`, with about 38 artists checked.
4. If drift is ever non-zero, Morning Briefing should show a warning and overall health should become yellow.

## While I was in here

1. The old `src/pages/label/SystemHealth.tsx` appears orphaned now that `/label/admin/health` uses `HealthLayout`; remove it after confirming no hidden route imports it.
2. The `admin-health` endpoint cannot be fully smoke-tested from CLI without a real admin access token; add a non-prod admin test token or health smoke RPC to make deploy verification cleaner.
3. `content_social_cadence_metrics` should be added to generated Supabase types during the next type refresh so the hook can stop using a manual row type.
