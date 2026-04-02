# 2026-03-30 — Actual Share Rate + Posting Hours

## What changed

- `src/types/soundIntelligence.ts` — Added `actual_share_rate?: number` to `SoundAnalysis` and `FormatBreakdown`, added `posting_hours?: number[]` to `SoundAnalysis`
- `src/components/sound-intelligence/HeroStatsRow.tsx` — New "AVG SHARE RATE" card (conditionally shown when data exists), grid adapts from 5 to 6 columns. Updated "AVG ENGAGEMENT RATE" delta to say "Likes / views" for clarity.
- `src/components/sound-intelligence/FormatBreakdownTable.tsx` — Dynamic "Share Rate" column added when formats have `actual_share_rate`. Sortable. Also appears in drilldown quick stats.
- `src/components/sound-intelligence/PostingHoursChart.tsx` — **New component.** 24-bar chart showing video posting distribution by hour. Shows peak hour, best 3h window with % of total. Accent color with opacity-by-intensity. Fixed edge case: all-zeros array won't crash peakHour calculation.
- `src/pages/label/SoundIntelligenceDetail.tsx` — Wired PostingHoursChart between Velocity/Winner row and FormatTrendsChart (conditionally rendered when posting_hours exists)
- `src/utils/exportAnalysis.ts` — Updated CSV exports: format breakdown CSV includes share rate column, full analysis CSV includes share rate per format + posting hours section

## Why

Backend adding two new data points to `get-sound-analysis`: actual share rate (shares/views) and posting hour distribution.

## What was tested

- `npx tsc --noEmit` passes clean
- All new fields are optional — backward compatible with current API responses

## What to verify in browser

- With current data: everything should look identical (no actual_share_rate or posting_hours in current API responses)
- Once backend deploys the new fields: verify 6th hero stat card appears, posting hours chart renders below velocity, share rate column shows in format table

## While I was in here

1. The engagement rate delta text was misleading ("Above 1% platform avg") — hardcoded claim regardless of actual value. Changed to descriptive "Likes / views"
2. The `SoundIntelligenceOverview.tsx` list page could also benefit from showing share rate in the card previews once data is flowing
3. The WinnerCard still shows `share_rate` (engagement) — could add `actual_share_rate` there too when available
4. PostingHoursChart could support timezone toggle (UTC vs local) once we know what timezone the backend returns
5. Consider adding posting_hours to the per-format drilldown if the backend ever provides that granularity
