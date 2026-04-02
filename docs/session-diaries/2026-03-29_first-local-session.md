# 2026-03-29 — First Local Session (Lovable → Claude Code)

## What changed

### Bug fixes (6 from CLAUDE.md)
- `SongTimestampHeatmap.tsx` — Fixed tooltip fake percentages, dynamic time axis, song duration from API
- `FormatBreakdownTable.tsx` — Client-side verdict algorithm, "Share Rate" → "Engagement Rate", Tooltip import
- `CreatorTiersSection.tsx` — Double @@ fix, share → engagement labels
- `GeoSpreadSection.tsx` — Share → engagement label
- `SoundIntelligenceDetail.tsx` — Passes `avg_duration_seconds` to heatmap

### SongTimestampHeatmap redesign
- Continuous color gradient (opacity-mapped) instead of binary red/gray
- Honest intensity tooltips (Peak/High/Moderate/Low/Minimal)
- Tooltip edge clamping, consolidated clip label
- Fixed label overflow (was absolutely positioned in narrow zone)

### VelocityChart improvements
- Custom tooltip (fixed stray colon bug)
- Single color with opacity-based bars (removed jarring orange/yellow split)
- Fixed chunk size bug (3M was slicing 7-day chunks)
- Removed broken 24H option (data is daily, not hourly)
- PEAK label repositioned, better x-axis intervals
- "Since Peak: 3d days" → "3d ago"
- Hardened date parsing (ISO + short formats)

### FormatBreakdownTable enhancements
- Sortable columns (click header to sort, click again to reverse, third click resets)
- Alternating row shading (zebra stripes)
- "Videos Posted Per Day" renamed from "Daily Velocity" with tooltip + day count + Oldest/Latest labels

### FormatTrendsChart
- Removed broken 24H option
- Fixed chunk size bug
- Solo mode: double-click legend item to show only that format
- "Show All" button when lines are hidden

### SoundHeader
- Cover art display (40px rounded square) with Music icon placeholder
- Ready for `cover_url` from backend

### SoundIntelligenceOverview
- Grid/List view toggle for completed analyses
- Sound avatar in both grid cards and list rows
- Processing cards: stuck job detection (>10min → "Likely failed" + warning), dismiss button

### Admin features
- Admin nav link in sidebar (Shield icon, only for admin users)
- Admin label switcher dropdown (sidebar, above main nav)
  - Lists all labels, click to switch view
  - Writes `label_id` to `user_profiles` so RLS works
  - "Back to my account" to reset
- LabelDashboard now filters by `labelId`
- LabelLayout re-mounts children on label switch via `key={labelId}`
- `useLabelRole` grants admin users label portal access even without label_id
- Artist delete: handles "already deleted" gracefully (removes from UI)

### Types
- `SoundAnalysis.cover_url` added (optional, nullable)
- `ListAnalysisEntry.cover_url` added (optional, nullable)

## Why
First session transferring from Lovable to local Claude Code editing. Fixed all known bugs from CLAUDE.md, improved data visualization components, added admin label switching for multi-label support.

## What was tested
- `npx tsc --noEmit` after every change — all clean
- Verified DB queries (user_profiles, artist_intelligence, labels, roster_dashboard_metrics)
- Confirmed RLS behavior with/without label_id

## What to verify in browser
- Heatmap tooltip shows intensity levels, not fake percentages
- Velocity chart single-color bars, no 24H option
- Format trends solo mode (double-click legend)
- Format breakdown sorting + zebra rows
- Label switcher: switch labels, verify dashboard shows correct artists
- Artist profile loads when clicking "View" from switched label
- Sound Intelligence shows correct analyses per label
- Processing cards dismiss + stuck detection

## While I was in here
- `roster_dashboard_metrics` has no rows for Warner UK artists — need to run "Refresh Metrics"
- Content Plans page not yet label-filtered
- The `deliverable_versions` backend is entirely missing — handoff prompt sent
- Cover art CDN URLs expire — handoff prompt sent for Supabase Storage caching
- Hourly velocity investigation — handoff prompt sent
- Paul's account (`contact@paulhers.com`, user_id `a1b1bf0a`) was detached from Columbia (label_id set to null) to support admin label switching
