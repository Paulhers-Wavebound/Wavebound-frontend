# Session Diary: Roster Expansion Intelligence

**Date:** 2026-04-09
**Duration:** ~2 hours

## What changed

### Backend (wavebound-backend)

1. **New dbt seed:** `seeds/language_country_map.csv` — 79-row weighted mapping of ISO 639-1 language codes to country codes (handles many-to-many: Spanish→20 countries, Portuguese→BR 85%/PT 15%, etc.)

2. **New dbt model:** `models/layer2_intelligence/roster_expansion_intelligence.sql` — Enriches `market_opportunity_v2` with 6 roster-specific signals for each artist × country combination:
   - TikTok audience geo (from `wb_observations_geo`)
   - Comment language distribution (from `wb_comment_sentiment` × language seed)
   - Fan intensity (fan_energy × language relevance)
   - Touring alignment (from `artist_touring_signal`)
   - Platform readiness (artist platform strength × market platform affinity)
   - Playlist penetration (from `artist_playlist_intelligence`)

   Computes `enriched_opportunity_score` (50% chart backbone + 50% roster signals) and `signal_convergence_count` (0-9 independent signals agreeing).

3. **New edge function:** `edge-functions/expansion-intelligence.ts` — Detects roster artists automatically, returns enriched data with evidence items, roster signals context, and budget allocation recommendations. Falls back to v2 behavior for non-roster artists. Uses 2-batch parallel query pattern.

4. **Updated:** `layer2_intelligence.yml` — Added model definition with tests.

### Frontend (Wavebound-frontend)

5. **Updated types:** `components/expansion-radar/types.ts` — Added `EnrichedOpportunity`, `EvidenceItem`, `BudgetAllocation`, `RosterSignals`, and signal score interfaces.

6. **Updated hook:** `components/expansion-radar/useExpansionRadar.ts` — Points to `expansion-intelligence` endpoint (superset of v2).

7. **New components:**
   - `RosterBadge.tsx` — Small accent pill indicating enriched data quality
   - `MarketIntelligenceCards.tsx` — Top 6 enriched opportunities with confidence meters, evidence bullets, score breakdown bars, and click-to-drawer interaction
   - `BudgetAllocationChart.tsx` — Horizontal bar chart with % allocation, ROI index, and methodology note
   - `EvidenceWall.tsx` — Slide-over drawer showing full signal breakdown, evidence items, entry song, and market economics per country

8. **Updated page:** `pages/label/LabelExpansionRadar.tsx` — Conditional rendering: roster artists see MarketIntelligenceCards + BudgetAllocationChart; non-roster see existing ExpansionOpportunityCards. RosterBadge appears next to methodology explainer.

## Why

The expansion radar showed identical chart-derived data for all 25K artists. Roster artists have dramatically richer signals (TikTok audience geo, comment languages, fan sentiment, touring, etc.) that were completely untapped. A Senior VP at Columbia needs to see evidence like "8.2% of TikTok audience in Brazil + 43% comments in Portuguese" to make budget allocation decisions.

## What was tested

- `dbt seed` loaded 79 rows to `language_country_map`
- `dbt run --select roster_expansion_intelligence` created 502 rows (7 artists × 73 countries)
- Verified enriched scores exceed original scores where roster signals exist (e.g., Chainsmokers US: 47→59 with 5 converging signals)
- Edge function deployed and responds (tested with curl — cold boot takes ~150s for DB-heavy queries, same as existing v2)
- `npx tsc --noEmit` passes with zero errors

## What to verify in browser

1. Navigate to `/label/expansion-radar` and select a roster artist (Harry Styles, The Chainsmokers, The Kid LAROI)
2. Verify **RosterBadge** appears next to methodology explainer
3. Verify **MarketIntelligenceCards** show with enriched scores, confidence meters, and evidence bullets
4. Click a card → **EvidenceWall** drawer slides in with full signal breakdown
5. Verify **BudgetAllocationChart** renders with % bars and ROI data
6. Select a non-roster artist → verify classic ExpansionOpportunityCards still render (no regression)
7. Check that GlobalCoverageMap, MarketHeatGrid, and all other existing components still work

## Notes

- Edge function uses 2-batch parallel queries to stay within Supabase execution limits
- The `roster_expansion_intelligence` dbt model runs as part of the daily pipeline (full rebuild, ~80s)
- Signal weights: 50% chart data + 20% audience geo + 12% language + 5% fan intensity + 5% platform + 4% touring + 4% playlist
