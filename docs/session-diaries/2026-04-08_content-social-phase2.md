# Session: Content & Social Dashboard — Phase 2

**Date:** 2026-04-08

## What changed

### Phase 2E — Data Integrity Audit

- Verified all 9 tables backing the content dashboard have real production data
- Columbia roster: 13 artists, 18 anomalies in last 7 days, 13/13 DNA coverage
- `intelligence_briefs`: 2 tier2 briefs (per-artist, Addison Rae), with `brief_html` + `brief_json`
- `tiktok_video_summary`: `posting_cadence`, `consistency_score`, `plays_trend_pct`, `engagement_trend_pct` all populated
- `wb_comment_sentiment`: sentiment and fan energy data present
- `artist_intel_chunks`: 10 actionable chunks (mostly Addison Rae — not wired yet, waiting for broader coverage)

### Phase 2B — Replace Client Heuristics with dbt Data

- `ContentRosterTable.tsx`: `deriveCadence()` now prefers dbt `posting_cadence` over client-side heuristic; falls back to client-side when dbt is null
- `ContentHealthPill`: now shows `consistency_score` as secondary percentage badge
- `PerformanceCell`: uses `plays_trend_pct` from dbt instead of `delta_avg_views_pct` when available
- `useContentDashboardData.ts`: removed broken `supabase.rpc("refresh_roster_metrics")` call (RPC doesn't exist, data refreshes nightly via dbt)

### Phase 2A — AI-Generated Executive Briefing

- New hook: `src/hooks/useIntelligenceBriefs.ts` — fetches latest `intelligence_briefs` for the label, extracts action_items from per-artist briefs
- `ContentSocialDashboard.tsx`: when AI briefs exist, replaces client-side generated actions with AI-extracted action items
- `ContentBriefingCard.tsx`: shows "AI Brief" badge + AI timestamp when backend briefs are available; narrative stays client-side generated (label-level context)

### Phase 2C — Wire Missing Data Sources

- `contentDashboardHelpers.ts`: UGC_SURGE priority type now implemented — triggers on songs with `fan_to_artist_ratio >= 3`, `videos_last_7d > 0`, and `tiktok_status` of viral/trending
- `useContentDashboardData.ts`: now fetches `wb_comment_sentiment` in Phase 3 (parallel with video summary + catalog), merges into ContentArtist
- `ContentArtist` type: added `sentiment_score` and `fan_energy` fields
- `ContentRosterTable.tsx`: sentiment dot indicator (green/yellow/red) on artist column

### Phase 2D — Role-Aware Artist Intelligence Tab

- New hook: `src/hooks/useContentIntelligence.ts` — fetches 7 data sources for a single artist (DNA, evolution, video summary, sentiment, anomalies, briefs, catalog)
- New component: `src/components/label/intelligence/ContentIntelligenceView.tsx` — 6 sections: Content Health, Format DNA, Content Evolution, Anomalies, Fan Sentiment, Sound Performance + AI Brief (when available)
- `ArtistIntelligence.tsx`: when role is "content", renders `ContentIntelligenceView` instead of marketing briefing; hides briefing/classic toggle

### Also done in this session (prior to Phase 2)

- Created `DashboardRoleContext` — app-wide role state with localStorage persistence
- Extracted `RoleSelector` as reusable component
- Wired role selector to: Dashboard, ArtistIntelligence, LabelArtistProfile, SoundIntelligenceOverview, SoundIntelligenceDetail
- Added role pill to LabelSidebar next to Dashboard nav item
- NotificationBell consumes context directly (no more prop)

## Files created

- `src/contexts/DashboardRoleContext.tsx`
- `src/components/label/RoleSelector.tsx`
- `src/hooks/useIntelligenceBriefs.ts`
- `src/hooks/useContentIntelligence.ts`
- `src/components/label/intelligence/ContentIntelligenceView.tsx`
- `docs/handoffs/content-social-phase2.md`

## Files modified

- `src/App.tsx` — DashboardRoleProvider in provider tree
- `src/pages/label/LabelDashboard.tsx` — uses context, cleaned up
- `src/pages/label/ArtistIntelligence.tsx` — role-conditional rendering
- `src/pages/label/LabelArtistProfile.tsx` — role selector added
- `src/pages/label/SoundIntelligenceOverview.tsx` — role selector added
- `src/pages/label/SoundIntelligenceDetail.tsx` — role selector added
- `src/components/label/LabelSidebar.tsx` — role pill on dashboard item
- `src/hooks/useContentDashboardData.ts` — sentiment fetch, removed broken RPC
- `src/data/contentDashboardHelpers.ts` — UGC_SURGE builder, sentiment fields
- `src/components/label/content-social/ContentSocialDashboard.tsx` — AI briefs integration
- `src/components/label/content-social/ContentBriefingCard.tsx` — AI badge + timestamp
- `src/components/label/content-social/ContentRosterTable.tsx` — dbt cadence, consistency score, sentiment dot

## What was tested

- `npx tsc --noEmit` — clean pass after every phase
- Data audit verified all tables have production data via Supabase REST API

## What to verify in browser

- Switch between Digital Marketing and Content & Social roles on the dashboard — role should persist across pages
- Content dashboard briefing card should show "AI Brief" badge if intelligence_briefs exist for your label
- Roster table should show consistency % next to cadence pills
- Small green/yellow/red sentiment dots should appear next to artist names
- Navigate to an artist intelligence page — when role is "content", should see Content Health, Format DNA, Evolution, Anomalies, Sentiment, Sound sections
- When role is "marketing", should still see the existing briefing/classic toggle

## Deferred

- `artist_intel_chunks` as priority type — only Addison Rae has actionable chunks right now, will wire when more artists have data
- `LabelArtistProfile` inline styles to Tailwind — deferred until content intelligence tab is built on that page
