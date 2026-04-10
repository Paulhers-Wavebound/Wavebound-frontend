# Session Diary — dbt Inventory Expansion

**Date:** 2026-04-08

## What changed

- **`src/pages/label/health/components/scraperInventory.ts`** — Replaced single "dbt Run (11 models)" entry with 5 entries: orchestrator + 4 layer groups (Compression 10, Health 8, Anomalies 1, Intelligence 15). Total: 34 models.
- **`src/components/admin/health/types.ts`** — Added `DbtModelStat` interface and extended `DbtHealth` with `total_models`, `compression_models`, `health_models`, `intelligence_models`, `anomalies_rows` fields.
- **`src/components/admin/health/DbtHealthSection.tsx`** — Added summary strip (model counts per layer), plus 3 new expandable cards (Compression, Health Models, Intelligence) each showing per-model row counts with totals. Existing Entity/Song/Market Health cards preserved.
- **`edge-functions/admin-health.ts`** — Added parallel count queries for all 34 dbt model tables, organized into per-layer arrays (`compressionModels`, `healthModels`, `intelligenceModels`, `anomaliesRows`). Deployed.

## Why

The admin health inventory showed "11 models" for dbt but the actual dbt project has grown to 34 models across 4 layers. The panel needed to reflect reality and show per-model health.

## What was tested

- `npx tsc --noEmit` — passes clean
- Edge function deployed and verified ACTIVE via `supabase functions list`
- Database scan confirmed row counts for all 34 tables (e.g. entity_health: 23,818, artist_momentum: 113,889, market_opportunity: 218,244, mv_song_artist_genre: 1,407,484)

## What to verify in browser

- Navigate to Health → Inventory and filter by "dbt" category — should show 5 entries (1 orchestrator + 4 layers)
- Navigate to Health → Pipeline — dbt section should now show summary strip with model counts and 3 new layer cards with per-model row counts
- Check that existing Entity Health / Song Health / Market Health cards still render correctly
