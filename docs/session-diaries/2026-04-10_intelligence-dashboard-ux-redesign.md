# Session Diary: Intelligence Dashboard UX Redesign

**Date:** 2026-04-10
**Trigger:** Paul flagged the ContentIntelligenceView as chaotic with unnatural stat spacing and unclear structure

## What Changed

**File:** `src/components/label/intelligence/ContentIntelligenceView.tsx`

### Layout & Spacing (all sections)

- Section gaps: `gap-4` (16px) -> `gap-5` (20px) for clearer card separation
- SectionCard title: 11px -> 12px, opacity 40% -> 45%
- StatChip label: 10px -> 11px with `leading-none`; value: 15px -> 17px with `leading-tight`

### Hero Card (ContentCommandCenter)

- Changed from 2-column flex (score left, rank right, dead space in middle) to 3-column grid: Score | Sub-scores (2x2) | Rank
- Sub-scores now fill the dead horizontal space with vertical separator borders
- Score: 52px -> 48px, tighter badge/rank gaps

### TikTok Profile

- Stats: always 2-column grid (was 4-col on desktop = too sparse)
- Bottom stats: also 2-column grid instead of flex-wrap

### Audience Footprint

- Platform bars: h-2 -> h-2.5 (thicker, easier to read)
- Follower counts: font-semibold, higher opacity
- Removed per-platform growth delta column (was noisy)

### Streaming Pulse

- Stats: always 2-column grid with `max-w-[520px]` (was 4-col stretching across full width)

### Format Performance

- Added "More/Less" toggle that shows/hides Hook, Viral, Engage columns
- Default: compact view with Format, Videos, Avg Views, vs Median
- Detail view: adds Hook, Viral, Engage columns

### Content Activity (merged from Content Evolution + Content Health)

- Combined two separate sections into one card
- Top: Health stats (Cadence, Consistency, Engagement, Performance)
- Middle: Video counts, virality, play/engage trends
- Bottom: Evolution section (strategy label, format shift, new/dropped formats)
- Layout changed from "Evolution full-width -> Health|Anomalies two-col" to "Activity|Anomalies two-col"

### Recent Anomalies

- Grouped by date instead of repeating the date on each line
- Date headers above each group; individual items no longer show dates

### Playlist Intelligence

- Reversed label/value order: label now sits above number (matching StatChip pattern)
- Numbers: 24px -> 22px with `leading-none`

### Market Expansion

- Removed per-card urgency badge (redundant with group header like "Monitor (9)")

### Fan Comment Pulse

- Vibe badge: 10px -> 11px with proper padding
- Comment count: slightly brighter

## Backend Todo Added

- `docs/handoffs/backend-todo.md`: Catalog Velocity `velocity_class` is "new" for all songs — classification pipeline not differentiating

## What Was Tested

- `npx tsc --noEmit` — clean, zero errors

## What to Verify in Browser

- Hero card: sub-scores should fill the space between score and rank on wide screens
- Format Performance: "More/Less" toggle should show/hide Hook/Viral/Engage columns
- Content Activity card: should feel substantial with health stats + evolution in one card
- Anomalies: dates should group as headers, not repeat per-line
- Market Expansion cards: no duplicate "MONITOR" badge
- All stat values should be slightly larger and more readable
- Overall spacing between cards should feel more deliberate
