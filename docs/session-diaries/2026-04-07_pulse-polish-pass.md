# The Pulse — Polish Pass for Columbia Demo

**Date:** 2026-04-07
**Goal:** Fix visual bugs and clean up The Pulse for Thursday demo

## What Changed

### Files Modified

- `src/types/pulse.ts` — Added `entity_id` and `metric` to `CountryDetailSong` view model
- `src/hooks/use-pulse-data.ts` — Rewrote `transformCountryDetail` with song dedup by entity_id, platform dedup by platform+metric, and consistent count derivation
- `src/components/pulse/CountrySidebar.tsx` — Metric-aware platform badges, capped "Also in:" list, Unknown artist handling, improved sort with rank tiebreaker, sorted roster section
- `src/components/pulse/PulseGlobe.tsx` — Arcs hidden in Activity view
- `src/components/pulse/LiveCounter.tsx` — Increased vertical padding (12→16px), wider gap between arbitrage hero row and counters
- `src/components/pulse/mockPulseData.ts` — Added entity_id and metric to mock data

### Bugs Fixed

1. **Duplicate platform badges** — Platforms deduped by platform+metric key per song
2. **Insane position numbers** (e.g. "tiktok #18154908") — Only chart_position/trending_position/position metrics shown as #X; count metrics formatted as abbreviated numbers (18.2M); values > 500 filtered from rank display
3. **"Also in:" country wall** — Capped at 5 countries + "and N more"
4. **Duplicate songs in sidebar** — Songs grouped by entity_id with platforms merged
5. **Data count consistency** — song_count and platform_count derived from deduped songs, not raw arrays
6. **"Unknown" artist** — Line hidden when artist is "Unknown" or empty
7. **Spaghetti arcs** — Removed from Activity view (only shown in other view modes)
8. **Bottom ticker cramped** — More vertical padding
9. **Sort by velocity** — Roster section now sorted too; secondary sort by best chart position within same velocity class

## What Was Tested

- `npx tsc --noEmit` — clean, zero errors
- Mock data updated to match new type requirements

## What to Verify in Browser

- Open The Pulse → Activity mode: no arcs rendering, globe shows clean hex polygons only
- Click any country (especially Brazil or US) → sidebar should show each song once, no duplicate badges
- Check songs with previously insane numbers → should show formatted counts or be filtered
- Check Malcolm Todd or similar with many countries → "Also in:" should cap at 5 + "and N more"
- Check songs with "Unknown" artist → artist line should be hidden
- Verify sort order: accelerating/growing songs at top, steady at bottom; within same class, lower chart position first
- Bottom ticker should feel slightly more spacious
