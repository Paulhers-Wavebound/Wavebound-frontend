# 2026-03-30 — Light/Dark Theme Fix for Sound Intelligence

## What changed

### CSS variables added (`src/index.css`)

Added 8 new overlay/chart CSS variables to both `[data-label-theme="light"]` and `[data-label-theme="dark"]`:

- `--overlay-hover` — subtle background on hover (white-alpha in dark, black-alpha in light)
- `--overlay-subtle` — zebra stripes, expanded panels
- `--overlay-active` — stronger interactive overlay
- `--border-subtle` — fine borders, pill backgrounds, progress bar tracks
- `--chart-grid` — Recharts grid lines
- `--chart-tooltip-bg` — tooltip background (dark glass in dark, white glass in light)
- `--chart-tooltip-border` — tooltip borders
- `--card-edge` — subtle top-edge border on cards

### Components fixed (15 files)

Every hardcoded dark-mode color replaced with CSS variables across all Sound Intelligence components:

**`src/components/sound-intelligence/`** (12 files):

- HeroStatsRow, SoundHeader, WinnerCard, TopPerformersGrid
- PostingHoursChart, LifecycleCard, HookDurationSection, SongTimestampHeatmap
- VelocityChart, FormatTrendsChart, CreatorTiersSection, GeoSpreadSection
- FormatBreakdownTable

**`src/pages/label/`** (2 files):

- SoundIntelligenceOverview, SoundIntelligenceDetail

### Specific replacements made (~70 total):

- `#1C1C1E` → `var(--surface)` — card backgrounds
- `#2C2C2E` → `var(--surface-hover)` — toggle pill backgrounds, hover states
- `rgba(255,255,255,0.06)` → `var(--border-subtle)` — borders, bar tracks, pill backgrounds
- `rgba(255,255,255,0.04)` → `var(--card-edge)` — card top-edge borders
- `rgba(255,255,255,0.03)` → `var(--overlay-hover)` — hover highlights
- `rgba(255,255,255,0.015)` → `var(--overlay-subtle)` — zebra stripes
- `rgba(0,0,0,0.92)` → `var(--chart-tooltip-bg)` — Recharts tooltip backgrounds
- `rgba(255,255,255,0.08)` → `var(--chart-tooltip-border)` — tooltip borders
- `#e8430a` → `var(--accent)` — buttons, icons, labels (NOT Recharts fill)
- `#fff` text → `var(--ink)` — tooltip labels (NOT white-on-accent buttons)
- `rgba(255,255,255,0.7)` → `var(--ink-secondary)` — tooltip item text
- `rgba(255,255,255,0.3/0.4/0.5)` → `var(--ink-tertiary)` or `var(--ink-secondary)` — axis ticks, inactive text

### Intentionally preserved:

- Recharts `fill="#e8430a"` — SVG fills don't resolve CSS vars the same way
- Format colors (`#30D158`, `#0A84FF`, etc.) — data visualization palette
- Verdict badge rgba backgrounds — semantic status colors
- `#fff` on accent-colored buttons — white-on-orange must stay white
- `rgba(232,67,10,...)` accent tints — work fine on both light/dark surfaces

## Why

All Sound Intelligence components used hardcoded dark-mode colors (white-alpha overlays, dark hex backgrounds). Switching to light theme made text invisible, backgrounds wrong, and borders disappear.

## What was tested

- `npx tsc --noEmit` clean
- `npm run build` passes (6.4s)
- Grep confirms: 0 remaining `#1C1C1E`/`#2C2C2E`, 0 remaining `rgba(255,255,255,...)` across all sound-intelligence components and pages

## What to verify in browser

- Toggle light/dark theme in sidebar and verify every Sound Intelligence section renders correctly
- Check tooltip styling on all charts (Velocity, Format Trends, Posting Hours, format drilldown daily)
- Verify card borders, hover states, and zebra striping are visible in light mode
- Check accent colors on buttons, icons, trophy badge

## While I was in here

1. The `rgba(232,67,10,...)` WinnerCard/LifecycleCard accent tints use hardcoded rgb(232,67,10) while `--accent` is #F25D24 (rgb(242,93,36)) — slightly different orange. Adding `--accent-subtle`, `--accent-border` CSS variables would let these adapt to any future accent color changes.
2. The Recharts `fill="#e8430a"` can't easily use CSS variables in SVG — would need a JS bridge reading `getComputedStyle` to resolve `var(--accent)` at render time
3. Two remaining `#e8430a` in Recharts fills (VelocityChart, PostingHoursChart) are the only hardcoded accent colors left
