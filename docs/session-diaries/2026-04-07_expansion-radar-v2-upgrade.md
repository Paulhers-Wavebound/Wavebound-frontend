# Session: Expansion Radar V2 Upgrade

**Date**: 2026-04-07

## What changed

### New files

- `src/components/expansion-radar/EntrySongs.tsx` — Per-market song recommendations grouped by country
- `src/components/expansion-radar/SpilloverTimeline.tsx` — Predicted market cascade flow diagram
- `src/components/expansion-radar/RevenueSizing.tsx` — Headline uncaptured revenue + per-market breakdown table
- `docs/features/expansion-radar-v2.md` — Feature documentation

### Rewritten files

- `src/components/expansion-radar/types.ts` — Complete V2 response interface (ActiveMarket, ExpansionOpportunity, DiscoveryRadarEntry, EntrySongRecommendation, SpilloverPrediction, etc.)
- `src/components/expansion-radar/useExpansionRadar.ts` — Points to `expansion-radar-v2` endpoint
- `src/components/expansion-radar/utils.ts` — Added velocityArrow, velocityColor, urgencyConfig, confidenceBorder, signalTypeBadge, discoveryDotColor, platformColor, formatDollar, trendLabel, crossPlatformBadge, PLATFORM_META
- `src/components/expansion-radar/ArtistSelector.tsx` — Added artist_score, tier badge, trend, cross-platform signal, platforms_growing
- `src/components/expansion-radar/GlobalCoverageMap.tsx` — Velocity arrows on dots, discovery coloring (blue glow for pre-breakout), radar ping animation, pre-breakout legend entry
- `src/components/expansion-radar/StreamingVsSocial.tsx` — Left: "Market Momentum" with velocity arrows, 7d delta, sort toggles. Right: "Early Signal Radar" with discovery-vs-streaming divergence gauges
- `src/components/expansion-radar/SummaryInsight.tsx` — Uses revenue_sizing for uncaptured revenue, shows pre-breakout/early-demand counts, ACT NOW count
- `src/components/expansion-radar/MarketHeatGrid.tsx` — Replaced per-platform columns with Velocity/Signal/Discovery/Health columns, background intensity from market_health_score
- `src/components/expansion-radar/ExpansionOpportunityCards.tsx` — Urgency badges (ACT NOW/PLAN/MONITOR), window confidence borders, entry song recommendation, spillover context, expandable score breakdown, revenue with per-stream rate tooltip
- `src/components/expansion-radar/ComparableOverlay.tsx` — Market overlap analysis: common_markets, unique_markets with expandable flag list
- `src/components/expansion-radar/MethodologyExplainer.tsx` — Updated copy for V2, removed monthly_listeners dependency
- `src/pages/label/LabelExpansionRadar.tsx` — New section ordering, all V2 data wired, coming soon sections removed

### Deleted files

- `src/components/expansion-radar/CommentIntelligence.tsx` — Coming Soon placeholder removed
- `src/components/expansion-radar/NicheMigration.tsx` — Coming Soon placeholder removed

## Why

Backend shipped `expansion-radar-v2` edge function with 5 new compression algorithms. Frontend needed to consume and visualize: market velocity, discovery-streaming divergence, per-market song recommendations, spillover predictions, revenue sizing, and transparent score breakdowns.

## What was tested

- `npx tsc --noEmit` — clean pass, zero errors
- All components type-safe against new V2 response interface

## What to verify in browser

1. Select an artist — verify V2 data loads (check \_meta.version === "v2" in network tab)
2. Artist bar shows new fields: artist score, tier badge, trend, cross-platform signal
3. Map: blue glowing dots with radar ping on pre-breakout markets, velocity arrows next to non-stable dots
4. Market Momentum (left panel): sort toggles work (streams/velocity/discovery gap), velocity arrows and 7d delta percentages display
5. Early Signal Radar (right panel): discovery-vs-streaming divergence gauges, PRE-BREAKOUT badges pulse red
6. Entry Songs section: cards show per-market song rec with velocity badge and adjacent market count
7. Spillover Timeline: cascade flows from active markets with probability badges and estimated days
8. Market Heat Grid: velocity/signal/discovery/health columns, background intensity varies
9. Opportunity Cards: urgency badges (ACT NOW red, PLAN yellow, MONITOR gray), entry song rec, spillover context, expandable score breakdown
10. Comparable Artists: common/unique market counts, expandable unique market flag list
11. Revenue Sizing: headline number, per-market table with per-stream rates, methodology disclaimer
12. Coming Soon placeholders gone (no CommentIntelligence or NicheMigration sections)
