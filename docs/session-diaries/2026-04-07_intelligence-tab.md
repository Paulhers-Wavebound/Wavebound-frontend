# Session: Intelligence Tab Frontend Implementation

**Date:** 2026-04-07

## What Changed

### New Files

- `src/types/artistIntelligence.ts` — TypeScript interfaces for all Layer 2 intelligence API responses + visual config constants (tier/trend/signal/severity colors)
- `src/utils/artistIntelligenceApi.ts` — API utility with `resolveEntityId`, `getArtistCard`, `getArtistAlerts`, `getMarketMap`, `getTikTokProfile`, `getCatalogTikTok`
- `src/components/label/intelligence/ScoreHeroCard.tsx` — Score display with sub-score bars and SVG sparkline
- `src/components/label/intelligence/AlertsFeed.tsx` — Priority-sorted alerts with severity coloring
- `src/components/label/intelligence/PlatformSignals.tsx` — Platform trend bars with centered diverging layout
- `src/components/label/intelligence/TikTokProfileCard.tsx` — Grade badge, consistency, key metrics
- `src/components/label/intelligence/CatalogIntelligence.tsx` — Catalog status, top songs, cross-platform gaps
- `src/components/label/intelligence/FanSentiment.tsx` — SVG ring gauges for sentiment/energy + theme chips
- `src/components/label/intelligence/GeoMarketMap.tsx` — Filterable market list with flag emojis, strength dots, action badges
- `src/components/label/intelligence/IntelligenceTab.tsx` — Orchestrator: resolves entity_id, fetches all data in parallel, renders sections
- `docs/features/intelligence-tab.md` — Feature documentation

### Modified Files

- `src/pages/label/LabelArtistDetail.tsx` — Added Intelligence tab as default tab, import IntelligenceTab component

## Why

Backend handoff delivered 4 edge function endpoints + 8 database tables powering a complete artist intelligence view. This session builds the frontend to consume all of it.

## What Was Tested

- `npx tsc --noEmit` — zero errors
- All imports resolve correctly
- Type safety across all API response shapes

## What to Verify in Browser

1. Navigate to any artist detail page — Intelligence tab should be the default
2. If artist is linked in wb_entities, should see score hero card + sections loading
3. If artist is NOT linked, should see "Intelligence data not yet available" empty state
4. Content Plan and 30-Day Plan tabs should still work as before
5. Check that the entity_id resolution works (depends on wb_entities RLS allowing anon key reads)
6. Verify two-column layout doesn't break on narrow viewports

## Polish Pass (same session)

1. **Backend TODO** — Added `entity_id` column recommendation to `docs/handoffs/backend-todo.md`
2. **Responsive grid** — Added `.intel-grid` CSS class in `index.css` with `@media (max-width: 900px)` stacking to single column
3. **React Query migration** — Replaced all `useEffect`+`useState` data fetching with `useQuery` hooks (5 queries, `staleTime: 5min`, each independently `enabled` once entity_id resolves)
4. **URL tab persistence** — Tab clicks now call `setSearchParams()` so `?tab=plan` / `?tab=plan30` survive refresh and back-button. Intelligence tab (default) clears the param.
5. **Sparkline animation** — Added `stroke-dasharray` reveal animation (1s ease-out draw) with delayed area fill fade-in

## Architecture Notes

- Entity ID resolution: `artist_intelligence.id` !== `wb_entities.id`. The IntelligenceTab resolves entity_id by matching `artist_intelligence.artist_name` against `wb_entities.canonical_name` (case-insensitive). If RLS blocks this query, the tab will show the "no entity" state — backend would need to expose a resolution endpoint or add entity_id to artist_intelligence.
- All 5 data queries fire in parallel via React Query (each independently enabled once entity_id resolves). Partial failures are graceful — only the core artist card failing shows an error state; other sections show individual empty states.
