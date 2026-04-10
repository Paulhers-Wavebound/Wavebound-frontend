# Expansion Radar — Narrative Layer

**Date:** 2026-04-04

## What changed

### New components created

- `src/components/expansion-radar/MethodologyExplainer.tsx` — Collapsible methodology row below stats bar. Shows tracking summary (platforms, markets, comparable count, listener range). Expands to reveal data sources and update frequency.
- `src/components/expansion-radar/SummaryInsight.tsx` — Orange left-border insight card. Shows untapped market count, top 3 gaps, avg comparable streams, total estimated uncaptured revenue.
- `src/components/expansion-radar/GlobalCoverageMap.tsx` — SVG world map with equirectangular projection. Green dots for active markets (sized by streams), orange pulsing dots for opportunities (sized by score), gray dots for tracked markets with no signal. Hover tooltips and legend. ~90 country centroids.

### Components modified

- `StreamingVsSocial.tsx` — Show ALL markets (not just 10) with "Show all X markets →" expand toggle on each column. Removed old summary callout (replaced by SummaryInsight). Added context sentence to section header. Badge labels: "EMERGING" → "MARKET FORMING", "EARLY SIGNAL" → "WINDOW OPEN". Added `>=2` threshold for WINDOW OPEN.
- `ExpansionOpportunityCards.tsx` — Same badge label changes. Added context sentence to section header.
- `ComparableOverlay.tsx` — Added context sentence using artist name and comparable count.
- `MarketHeatGrid.tsx` — Added `artistName` prop and context sentence to section header.
- `LabelExpansionRadar.tsx` — Reordered sections: Stats → Methodology → World Map → Streaming vs Demand → Summary Insight → Comparable Artists → Market Heat Grid → Expansion Opportunity Cards → Coming Soon. Added imports for 3 new components.

### Previous session fixes (same day, earlier session)

- Market count: removed hardcoded "73", uses `total_markets_tracked` from edge function
- Demand Says subheader changed to "Where demand is forming"
- Auto-hide empty platform columns in heat grid
- Revenue tooltip on opportunity cards
- "View Strategy →" navigates to `/label/assistant` with prefilled expansion prompt

## Why

Columbia Records pitch — the page needs to tell a story, not just show data. Exec sees evidence (map, streaming data, comparable artists) before conclusions (opportunity cards). Each section has context so it reads as a narrative.

## What was tested

- `npx tsc --noEmit` — clean, no errors
- Verified section order in LabelExpansionRadar matches spec
- Verified old summary callout removed from StreamingVsSocial
- Verified badge labels updated in both components

## What to verify in browser

- World map renders with dots in correct positions (green for active, orange pulsing for opportunities)
- Hover tooltips on map dots show country name + metric
- Methodology explainer collapses/expands correctly
- "Show all X markets →" toggles work in both Streaming/Demand columns
- Summary insight card shows correct revenue calculation
- Section order matches narrative flow
- Context sentences render below each section header
- Badge labels show "MARKET FORMING" and "WINDOW OPEN"

## While I was in here

1. **World map centroids may need tuning** — Some country positions are approximate. If a dot looks off by 50px, the centroid lat/lng for that country code needs adjustment in `GlobalCoverageMap.tsx`.
2. **SignalFeed mock data still hardcoded** — The "after April 10" TODO is still pending. Should replace with real `wb_observations_geo` data.
3. **ExpansionRadarPreview still uses old mock components** — `src/pages/label/previews/ExpansionRadarPreview.tsx` imports from the old `src/components/label/expansion/` directory.
4. **No skeleton for world map** — The SkeletonLoader in LabelExpansionRadar doesn't include a map-shaped skeleton block. Could add one for visual consistency.
5. **Revenue calculation in SummaryInsight uses flat $0.004/stream** — Same as opportunity cards. If per-market rates become available from the edge function, both should be updated.
