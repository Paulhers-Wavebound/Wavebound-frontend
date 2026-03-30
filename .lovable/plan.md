

## Enhance Song Timestamp Heatmap

### Current State
The heatmap (lines 102-121 in `FormatBreakdownTable.tsx`) renders `songBars` as simple colored divs with no interactivity, no tooltips, and no context. The `hooks` data on each format has `snippet` (e.g. "0:38-0:52") and `snippet_pct` available but unused in the heatmap.

### Data Available
- `f.songBars`: array of ~24 values (0-100), normalized so max = 100
- `f.hooks.snippet`: string like "0:38-0:52" — the most-used clip window
- `f.hooks.snippet_pct`: percentage of videos using that snippet
- `f.video_count`: total videos for this format
- `color`: format-specific color from `getFormatColor()`

### Changes — Single File

**`src/components/sound-intelligence/FormatBreakdownTable.tsx`** (lines 102-121)

Replace the static heatmap block with an enhanced version:

1. **Parse snippet range** — Extract start/end seconds from `f.hooks.snippet` (e.g. "0:38-0:52" → 38, 52). Calculate which bar indices fall within this range based on song duration (bars count × segment size).

2. **Hover tooltips** — Wrap each bar in a container with `onMouseEnter`/`onMouseLeave` state. On hover, show a positioned tooltip with:
   - Time range: "0:38 – 0:40"
   - Usage: "34% of videos use this section"
   - Video count: "12 of 35 videos"
   - Calculated as `(barValue / maxBar) * 100` for relative %, and `Math.round(barValue / maxBar * videoCount)` for count

3. **Hot zone highlight** — Behind bars within the snippet range, render a subtle accent-colored background band. Add a "Most used clip" label with time range above the highlighted bars.

4. **Color differentiation** — Bars within the snippet range use the format's color at full opacity. Bars outside use muted gray (`rgba(255,255,255,0.08)`). Peak bar gets extra brightness.

5. **Insight text below** — Below the time axis, add: `"Most creators clip {snippet} — {snippet_pct}% of top performers use this window"`

6. **Height increase** — Bump heatmap height from 48px to 64px for better readability.

### Tooltip Implementation
Use local state `hoveredBar: number | null` with an absolutely positioned div (no external tooltip library needed — keeps it simple and consistent with the rest of this component's inline-style approach).

### Visual Result
```text
              ┌─ Most used clip: 0:38–0:52 ─┐
 ▁ ▂ ▃ ▄ ▅ ▃ ████████████████████████████████ ▂ ▁
0:00          0:30          1:00          2:00
"74% of top performers clip 0:38–0:52"
```

Hovering a bar shows: `"0:40–0:43 · 34% of videos (12 of 35)"`

### Scope
- 1 file modified
- ~60 lines replaced/added in the heatmap block
- No new dependencies

