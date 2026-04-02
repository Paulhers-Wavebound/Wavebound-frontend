# Sound Intelligence UX Overhaul

**Date:** 2026-04-02
**Handoff:** `docs/handoffs/2026-04-02_sound-intelligence-ux-overhaul.md`

## What Changed

### Section 1: Real-Time Monitoring Redesign

- **`MonitoringTrendChart.tsx`** — Complete rewrite of header area
  - Header now shows: `LIVE MONITORING · Scanning every 3h · Last checked 2m ago`
  - Intensive mode: `INTENSIVE MONITORING · Scanning every 15min · Tracking Lip Sync / Dance spike`
  - Chart filtering threshold raised from 1% to 5% of total views (3-5 lines instead of 10+)
  - Spike badges capped at 3, with `+N more` overflow
  - Total delta context: `+87K views · +12 new videos · 196 creators`
  - Now accepts `monitoring` prop for interval/spike info
- **`SoundHeader.tsx`** — Removed duplicated monitoring row (now lives in chart header)
  - Removed `NextCheckCountdown` import (unused)

### Section 2: 6-Axis Tabbed Browser

- **`AxisBrowser.tsx`** (NEW) — Replaces `AudienceInsightSection` + `NicheDistributionChart`
  - Tabs: FORMAT | NICHE | VIBE | INTENT | CREATORS
  - Song Role shown as compact stat bar at top: `Primary 72% · Background 25% · Sound Bite 3%`
  - Each tab uses consistent bar chart layout with engagement badges
  - Niche tab preserves click-to-filter behavior for Top Performers

### Section 3: Format Drill-Down Redesign

- **`FormatBreakdownTable.tsx`** — Drilldown rewritten as `FormatDrilldown` component
  - Top line: format summary with verdict badge
  - "Who's making these": niches + vibe as pills, intent as one-liner
  - Timing: song clip heatmap + daily velocity as thin compact bars side by side
  - AI insight in a subtle card
  - Top Videos remain prominent with clickable links
  - Removed SongTimestampHeatmap import (inline thin bar instead)

### Section 4: Sound Health Strip

- **`SoundHealthStrip.tsx`** (NEW) — Compact inline strip below SoundHeader
  - Shows: `118 videos · 196 creators · 896K views · 72% Primary · 79% Organic · Accelerating`

### Section 5: Page Layout

- **`SoundIntelligenceDetail.tsx`** — Rewired to use new components
  - Added SoundHealthStrip between SoundHeader and HeroStatsRow
  - Replaced AudienceInsightSection + NicheDistributionChart with AxisBrowser
  - Passed `monitoring` prop to MonitoringTrendChart
  - Fixed delete handler reference to `name` variable (was undefined, now uses `analysis?.track_name`)

## Why

Label execs found the page confusing — too much noise in monitoring, 5 of 6 classification axes hidden, format drill-downs were flat and disconnected.

## What Was Tested

- `npx tsc --noEmit` — zero errors
- Verified no unused imports in modified files
- Old components (AudienceInsightSection, NicheDistributionChart, SongTimestampHeatmap) are no longer imported but still exist as files

## What to Verify in Browser

- [ ] Monitoring chart header shows correct interval and last-checked time
- [ ] Monitoring chart only shows 3-5 format lines (not 10+)
- [ ] Spike badges cap at 3 with "+N more"
- [ ] Sound Health Strip renders below song title
- [ ] Axis Browser tabs switch correctly between Format/Niche/Vibe/Intent/Creators
- [ ] Song Role stat bar appears above tabs
- [ ] Niche tab click-to-filter still works with Top Performers
- [ ] Format drill-down shows focused story layout (pills, one-liners, compact bars)
- [ ] Top Videos links in drill-down still open correct TikTok URLs
- [ ] PDF export still works (new components may need data-pdf attributes)

## Follow-up Fixes (same session)

All 5 items from the initial "While I was in here" list were fixed:

1. **Dead components deleted** — AudienceInsightSection.tsx, NicheDistributionChart.tsx, SongTimestampHeatmap.tsx removed. tsc clean.
2. **PDF attributes added** — `data-pdf-hide` on AxisBrowser tab bar so PDF shows format tab content without interactive buttons.
3. **Monitoring fallback added** — SoundHeader now shows "Monitoring paused · Last checked Xm ago" when monitoring is paused and the chart isn't rendered.
4. **Posting hours restored** — Collapsible `PostingHoursCollapsible` component in FormatDrilldown. Shows "Posting Hours · Peak: 7p" label, expands to bar chart on click.
5. **Unique creators derived** — SoundHealthStrip now computes creator count from `creator_tiers` sum instead of using `userCount`. Backend handoff added to `docs/handoffs/backend-todo.md` for proper `unique_creators` field.

## While I Was In Here

1. **InfoPopover still used in deleted components** — The InfoPopover component itself is still used by other components, so it stays. But verify no other imports reference the deleted files.
2. **PostingHoursChart (page-level) still exists** — The page-level PostingHoursChart is separate from the per-format one and is still used in the page layout.
3. **MonitoringBadge still in SoundHeader** — The small badge icon is still shown. Consider whether it's redundant with the chart header's "LIVE MONITORING" label.
4. **HeroStatsRow could be simplified** — Now that SoundHealthStrip shows the same data in a compact strip, HeroStatsRow has some redundancy. Consider merging or differentiating them.
5. **AxisBrowser default tab** — Always defaults to "format" on mount. Consider remembering the last-selected tab via URL params or local state.
