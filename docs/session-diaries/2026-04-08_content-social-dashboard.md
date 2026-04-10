# Session: Content & Social Dashboard — Phase 1

**Date:** 2026-04-08

## What changed

### New files

- `src/components/label/content-social/ContentSocialDashboard.tsx` — Main orchestrator
- `src/components/label/content-social/ContentBriefingCard.tsx` — Executive briefing with greeting, narrative, actions
- `src/components/label/content-social/ContentPriorityCards.tsx` — Collapsible priority cards (drought, spike, drop, shift, UGC)
- `src/components/label/content-social/ContentRosterTable.tsx` — Sortable/filterable table with content-focused columns
- `src/components/label/content-social/ContentInsightBanner.tsx` — Bottom insight banner
- `src/components/label/content-social/SoundPerformanceSection.tsx` — UGC/Sound Performance table from catalog_tiktok_performance
- `src/hooks/useContentDashboardData.ts` — React hook with parallel Supabase queries + client-side join
- `src/data/contentDashboardHelpers.ts` — Types, formatters, filter/sort/briefing/priority/insight generators
- `docs/features/content-social-dashboard.md` — Feature documentation

### Modified files

- `src/pages/label/LabelDashboard.tsx` — Removed 430-line inline ContentSocialDashboard, replaced with import. File went from 710 to ~365 lines. NotificationBell now accepts role prop and shows real content_anomalies when in Content & Social mode.

## Why

Paul wanted the Content & Social role dashboard to match the design quality of the Digital Marketing dashboard (executive briefing, priority cards, sortable table, insight banner) but use real data instead of mocks, and be tailored for a content/social manager's concerns.

## What was tested

- `npx tsc --noEmit` — passes clean, zero errors
- **Browser-verified end-to-end** with Columbia Records US roster (8 artists):
  - Briefing card renders with real narrative: "Across your 8 artists, 2 posted in the last 3 days, and 4 have posting gaps of 7+ days. The Kid LAROI leads at 32 days silent."
  - Priority bar: "NEEDS ATTENTION — Presley Haile — No posts in 11 days +4 more"
  - Roster table: all 8 artists with real Content Health pills (Regular/Sporadic/Inactive/Dormant), Performance (205K–2.3M views), Activity (Today–32d ago), engagement rates, video counts
  - Content DNA joined: best formats shown (Live Performance, Studio Lip-Sync, Selfie Performance, etc.)
  - Sound Performance section: "Earrings" by Malcolm Todd (18.2M plays, TikTok hot/Spotify cold), "As It Was" by Harry Styles (11K plays, +1/wk)
  - Insight banner: "4 of 8 artists are posting consistently this week. 2 posting sporadically. 1 dormant."
  - Notification bell: 10 real content anomalies (posting droughts for addisonre, presleylnhaile, malcolmtodddd, thekidlaroi, hshq)
  - Filter tabs work: All 8, Posting Gap 5, Top Performers 8, Declining 0, Format Shift 2
  - Switching back to Digital Marketing: no regressions, notification bell reverts to 4 mock marketing alerts

## Data access findings

- `roster_dashboard_metrics` — has RLS, requires authenticated user with label_id
- `artist_content_dna`, `artist_content_evolution`, `tiktok_video_summary` — no RLS (dbt tables), accessible with anon key
- `content_anomalies` — has RLS scoped by label_id
- `catalog_tiktok_performance` — no RLS, accessible
- `roster_dashboard_metrics` does NOT have `entity_id` column — the hook gets entity_ids from `artist_content_dna` instead
- Admin users need a `user_profiles` row with `label_id` set (via label switcher) for data to load

## Notes

- Briefing narrative is generated client-side from structured data (no AI call). Phase 2 could upgrade to Claude-generated briefings.
- The entity_id join path: roster handles → artist_content_dna (has both handle + entity_id) → tiktok_video_summary + catalog_tiktok_performance (keyed by entity_id)
