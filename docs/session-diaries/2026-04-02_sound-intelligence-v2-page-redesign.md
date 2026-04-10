# Sound Intelligence V2 Page Redesign

**Date:** 2026-04-02  
**Task:** Complete page redesign of SoundIntelligenceDetail into 4-zone layout

## What Changed

### New Types (`src/types/soundIntelligence.ts`)

- Added `SpotifySnapshot`, `PlaylistTracking`, `ShazamSnapshot` interfaces
- Added `spotify_snapshots`, `playlist_tracking`, `shazam_snapshots` to `SoundAnalysis`
- Added `spark_score` to `FormatBreakdown` and `TopVideo`

### New Components

- **`VerdictStrip.tsx`** — Zone 1: Dense horizontal strip replacing SoundHeader + SoundHealthStrip + HeroStatsRow. Shows sound name, status badge, lifecycle phase, 4 key metrics (velocity, creators, organic %, days active), 7-day sparkline, top geo context, AI summary placeholder.
- **`ConversionChart.tsx`** — Zone 2: Dual-axis ComposedChart with TikTok velocity bars (orange) + Spotify monthly listeners line (green). Falls back to velocity-only when no Spotify data. Time range toggle.
- **`WinningFormatCard.tsx`** — Zone 2: Merged winner format + clip window + optimal duration + best posting time into a single card.
- **`PlaylistActivityFeed.tsx`** — Zone 2: Timeline feed of Spotify playlist adds/removes with follower counts. Shows placeholder when no data.
- **`CreatorActionList.tsx`** — Zone 3 right: Compact ranked list of top performers with spark_score badge, copy-handle button, and CSV export.
- **`DeepDiveSection.tsx`** — Zone 4: Collapsible section containing GeoSpread, FormatTrends (top 3), CreatorTiers, and Instagram Reels "coming soon" placeholder.

### Modified Components

- **`FormatBreakdownTable.tsx`** — Added `spark_score` column with color-coded display (green ≥70, yellow ≥40, gray <40). Added sorting support.

### Rewired Page

- **`SoundIntelligenceDetail.tsx`** — Replaced all old zone rendering with V2 layout. Removed imports for SoundHeader, SoundHealthStrip, HeroStatsRow, VelocityChart, WinnerCard, HookDurationSection, TopPerformersGrid, AxisBrowser, PostingHoursChart, LifecycleCard. Preserved loading/error/delete/export/polling logic.

## Why

Sound Intelligence V2 redesign — restructured from exploratory data dump to decision-oriented zones: Verdict → Conversion Signal → Spend Decision → Deep Dive.

## What Was Tested

- `npx tsc --noEmit` — zero errors
- All new components import correctly and type-check

## What to Verify in Browser

- Zone 1 verdict strip renders correctly with sparkline and metrics
- Zone 2 dual-axis chart degrades gracefully (no Spotify data yet → bars only)
- Playlist activity shows empty state placeholder
- Zone 3 side-by-side layout: format table left, creator list right
- spark_score columns show "—" when data not yet populated
- Zone 4 collapses/expands, format trends limited to top 3
- Copy handle button works
- PDF export still functional
- Mobile/responsive behavior of the flex layouts

## While I Was in Here

1. **AI Summary is hardcoded** — Zone 1 summary uses winner format + second format as placeholder. Once the backend returns `ai_summary` from GPT, wire that in (highest impact).
2. **Old components are orphaned** — SoundHeader.tsx, SoundHealthStrip.tsx, HeroStatsRow.tsx, VelocityChart.tsx, WinnerCard.tsx, HookDurationSection.tsx, TopPerformersGrid.tsx, PostingHoursChart.tsx, LifecycleCard.tsx, AxisBrowser.tsx are no longer imported by the detail page. Can be deleted once V2 is confirmed stable, or kept if the overview page uses them.
3. **Responsive breakpoints** — The Zone 2 and Zone 3 side-by-side layouts use `display: flex` which will need `flex-wrap: wrap` or a media query for <768px screens to stack vertically.
4. **Playlist tracking + Spotify data pipeline** — The frontend is ready. Backend needs to populate `spotify_snapshots` and `playlist_tracking` in the get-sound-analysis response.
5. **spark_score pipeline** — `sound_scan_videos.spark_score` exists per the plan but needs to be aggregated per-format and per-top-video in the synthesizer edge function.
