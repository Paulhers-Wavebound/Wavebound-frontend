# Expansion Radar — Real Data Frontend Rebuild

**Date:** 2026-04-03
**Duration:** Single session

## What Changed

Complete rewrite of the Expansion Radar page from mock data to real edge function data.

### New files created (`src/components/expansion-radar/`):

- `types.ts` — TypeScript interfaces matching the `expansion-radar` edge function response
- `utils.ts` — Formatting helpers (formatNumber, formatRevenue, countryFlag, signalColor)
- `useExpansionRadar.ts` — Custom hook fetching from the expansion-radar edge function
- `ArtistSelector.tsx` — Search-based artist picker querying `wb_entities` table (25K+ artists), shows artist stats bar
- `StreamingVsSocial.tsx` — Two-column hero: Streaming Says (active markets by streams) vs Demand Says (expansion opportunities by comparable artist presence)
- `MarketHeatGrid.tsx` — Platform × country heatmap table with expandable rows showing comparable artist detail
- `ExpansionOpportunityCards.tsx` — Top 4 opportunity cards with platform presence, comparable artists, revenue estimates
- `ComparableOverlay.tsx` — Grid of comparable artists used in the analysis with market flags
- `SignalFeed.tsx` — Floating button + slide-out panel with mock signals (real data after April 10)
- `CommentIntelligence.tsx` — Coming Soon placeholder
- `NicheMigration.tsx` — Coming Soon placeholder

### Modified files:

- `src/pages/label/LabelExpansionRadar.tsx` — Complete rewrite from mock-based to edge function data

### Preserved (not deleted):

- `src/components/label/expansion/` — Old mock-based components still used by ExpansionRadarPreview.tsx

## Why

Columbia Records demo prep. The page needed real data from the new `expansion-radar` edge function to show actual market intelligence for any of the 25K+ tracked artists.

## What Was Tested

- `npx tsc --noEmit` — CLEAN, zero errors
- Build has a pre-existing error in `LabelArtistProfile.tsx` (unterminated regex) — unrelated to this work

## What to Verify in Browser

1. Navigate to `/label/expansion-radar`
2. Search for "Drake" or "Taylor Swift" in the artist selector
3. Verify real data loads in:
   - Streaming Says column (active markets sorted by streams)
   - Demand Says column (expansion opportunities with badges)
   - Market Heat Grid (platform heatmap with expandable rows)
   - Expansion Opportunity Cards (top 4 with comparable artist evidence)
   - Comparable Artists grid
4. Signal Feed floating button (bottom-right) opens slide-out panel
5. Coming Soon cards render at bottom (Comment Intelligence, Niche Migration)

## While I Was In Here

1. **Pre-existing build error in LabelArtistProfile.tsx** — unterminated regex at line 1164. Needs fixing before any deploy.
2. **Old expansion components still alive** — `src/components/label/expansion/` is still imported by the preview/mock. Once Columbia has access, delete the mock and old components.
3. **Signal Feed needs real data after April 10** — Hook up to `wb_observations_geo WHERE z_score > 2.0` for real-time signals.
4. **Artist selector could show roster artists first** — Currently searches all 25K entities. Could prioritize the label's roster artists at the top of results.
5. **"View Strategy" CTA on opportunity cards** — Placeholder, does nothing. Could link to the Intelligence assistant with a pre-filled prompt about that market.
