# 2026-04-13 — delta*\* → velocity*\* swap in Content & Social

## What changed

- `src/data/contentDashboardHelpers.ts`
  - `ContentArtist`: renamed `delta_avg_views_pct` → `velocity_views_pct`,
    `delta_engagement_pct` → `velocity_engagement_pct`, added
    `velocity_posting_freq_pct`. Kept `delta_followers_pct` (no velocity
    equivalent from backend).
  - All usages in `generateContentPriorities`, `generateContentBriefing`,
    `generateSignalReport`, `generateContentInsight`, `filterContentArtists`
    now read `velocity_views_pct` / `velocity_engagement_pct`.
  - Deleted the 7d-vs-30d workaround block in `generateSignalReport` that
    manually derived velocity from `avg_views_7d`/`avg_views_30d`. Backend
    dbt pipeline now populates the column directly.
- `src/hooks/useContentDashboardData.ts` — maps `r.velocity_views_pct`,
  `r.velocity_engagement_pct`, `r.velocity_posting_freq_pct` from
  `roster_dashboard_metrics`.
- `src/components/label/content-social/ContentSocialDashboard.tsx` — roster
  `avgVelocityDelta` aggregate reads `velocity_views_pct`.
- `src/components/label/content-social/ContentRosterTable.tsx` — three
  `trend` fallbacks (`PerformanceCell`, `derivePriorityAction`,
  `buildTierAdaptiveTiles`, `ArtistCard`) now fall back to
  `velocity_views_pct` instead of `delta_avg_views_pct`. `delta_followers_pct`
  left untouched.
- `src/pages/label/health/HealthRosterCoverage.tsx` — `RosterRow`/`RosterRaw`
  types, `FIELDS` catalog (re-labelled "Δ Views %" → "Velocity Views %", same
  for engagement), and the `select()` column list now reference
  `velocity_views_pct` / `velocity_engagement_pct`. `delta_followers_pct`
  stays.
- `src/integrations/supabase/types.ts` — regenerated via
  `npx supabase gen types typescript --project-id kxvgbowrkmowuyezoeke`.
  Both `delta_*` and `velocity_*` columns now coexist in the generated types
  for `roster_dashboard_metrics`.
- `src/hooks/useArtistDatabase.ts` — refreshed the stale comment that said
  `tiktok_trend`/`youtube_trend` were NULL. Backend now populates them
  (~21K TikTok rows, ~11K YouTube rows).

## What was NOT changed (intentionally)

- `src/pages/label/LabelArtistProfile.tsx` + `src/components/label/profile/ProfileSidebar.tsx`
  still consume `delta_avg_views_pct`, `delta_engagement_pct`,
  `delta_posting_freq_pct`, `delta_followers_pct`. These carry **Wavebound
  Impact Delta** semantics (comparison against the onboarding baseline,
  gated on `has_baseline`) — not 7d-vs-30d velocity. Both column sets live
  on `roster_dashboard_metrics` and both are valid.

## Why

Backend commit `a99e0cd` (wavebound-backend) fixed the dbt `pct_change`
pipeline and added `velocity_{views,engagement,posting_freq}_pct` columns to
`roster_dashboard_metrics`. The client-side 7d-vs-30d derivation in
`generateSignalReport` is now redundant, and the Content & Social UI should
read the authoritative backend column.

## What was tested

- `npx tsc --noEmit` → exit 0, clean.
- Grepped `src/` to confirm the only remaining `delta_avg_views_pct` /
  `delta_engagement_pct` references are in (a) `LabelArtistProfile.tsx`
  (Impact Delta path) and (b) generated `types.ts` schema — both expected.
- Confirmed `supabase/types.ts` now includes `velocity_views_pct`,
  `velocity_engagement_pct`, `velocity_posting_freq_pct` on
  `roster_dashboard_metrics`, alongside the preserved `delta_*` columns.

## What to verify in the browser

- `/label` (Content & Social dashboard): "Roster velocity" pulse line on the
  briefing card should now show a non-zero WoW number for a populated label
  (Columbia is seeded). Previously the helper derived it from raw 7d/30d
  averages; now it reads the backend column.
- `/label/health/roster-coverage`: Columns should render as
  "Velocity Views %" and "Velocity Eng %" with real percentages. The
  "Δ Foll %" column should be unchanged.
- `/label/artist/<handle>`: Wavebound Impact Delta card should still render
  the same four tiles for artists with baseline data.
- Roster table: surging/declining artists should still show trend chips and
  the breakout velocity copy with correct percentages.

## While I was in here

- **Surge filter thresholds are still tuned to the legacy delta semantics.**
  `filterContentArtists` treats `velocity_views_pct > 15` as a top performer
  and `< -15` as declining. Now that the backend clamps velocity and the
  column is reliably populated, those thresholds may need retuning — worth
  validating against Columbia once Paul has eyes on the numbers.
- **`HealthRosterCoverage` labels.** I renamed to "Velocity Views %" /
  "Velocity Eng %" for clarity, but Δ Foll % is still in the same table for
  visual parity. If we later add a velocity equivalent for followers we can
  collapse them.
- **`useArtistDatabase` note.** I updated the stale comment but didn't drop
  the `daily_summaries` join — we still need absolute TikTok followers /
  YT subscribers from there, since `artist_score` only carries trend %.
- **Committed `backend-todo.md` trim.** The backend session rewrote it from
  ~593 → 200 lines; committing alongside the velocity swap as one cleanup.
- **Consider exposing `velocity_posting_freq_pct` in the UI.** Backend ships
  it, nothing reads it yet. A "posting frequency momentum" pill on the
  roster table's expanded detail view would land naturally next to the
  velocity views tile.
