# Info Popovers for Sound Intelligence Cards

**Date:** 2026-04-01

## What changed

- Created `src/components/sound-intelligence/InfoPopover.tsx` — reusable popover component with bouncy spring animation (Framer Motion)
- Added InfoPopover with plain-English explanations to **all 14 sections** in Sound Intelligence detail page:
  - HeroStatsRow (Key Metrics) — also added section header with accent bar for consistency
  - VelocityChart (Sound Velocity)
  - WinnerCard (Winning Format)
  - FormatTrendsChart (Format Trends)
  - FormatBreakdownTable (Format Breakdown)
  - HookDurationSection — both Hook Analysis and Duration Comparison headers
  - TopPerformersGrid (Top Performers)
  - CreatorTiersSection (Creator Tiers)
  - GeoSpreadSection (Geographic Spread)
  - LifecycleCard (Lifecycle Status)
  - MonitoringTrendChart (Real-Time Monitoring)
  - PostingHoursChart (Posting Hours)
  - AudienceInsightSection (Audience Profile)
  - NicheDistributionChart (Niche Distribution)

## Why

Users need simple explanations of what each card/section means. The popover keeps the UI clean (hidden behind a subtle ? icon) while making the data accessible to non-technical users.

## What was tested

- `npx tsc --noEmit` — clean, no errors

## What to verify in browser

- Click the ? icon on each section header — popover should appear with bouncy spring animation
- Click outside or X to close
- Check that popovers don't get cut off by overflow:hidden on parent cards
- Verify popovers are hidden in PDF exports (data-pdf-hide attribute)
- Check HeroStatsRow now has "Key Metrics" section header matching the pattern of all other sections

## While I was in here

1. **HeroStatsRow was the only section without a header** — added "Key Metrics" with the standard accent-bar pattern to match every other section. Verify this looks right visually.
2. **Popover z-index (50)** — may need adjustment if it renders behind modals or the sidebar. Watch for this.
3. **NicheDistributionChart header structure** — used an inline span wrapper since it had a different header pattern. May want to refactor all section headers into a shared `SectionHeader` component for consistency.
4. **SoundHeader has no info popover** — it's the main header with song metadata, doesn't need an explanation. Skipped intentionally.
5. **SongTimestampHeatmap** — embedded inside FormatBreakdownTable drilldowns, not a standalone section. Covered by the parent's explanation.
