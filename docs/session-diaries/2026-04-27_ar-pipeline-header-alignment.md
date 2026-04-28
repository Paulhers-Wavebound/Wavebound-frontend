# A&R Pipeline — Column Header Alignment + Click-to-Sort

## What changed

- `src/components/label/ar/ARPipelineTable.tsx`
  - Column headers now actually align with their data cells.
  - Sortable columns are now click-to-sort with chevron indicator.
  - Removed the separate Sort dropdown from the toolbar (now redundant).
  - Format Alpha is now a sortable column (sorts by `best_format_engagement_lift`).
- `src/hooks/useARData.ts`
  - Added `"format_alpha"` case to `sortProspects` switch.

## Why

Paul flagged that header text positions did not match data row positions. RISE PROB, STAGE, 7D VELOCITY, FORMAT ALPHA, SIGNABILITY, and GHOST CURVE headers all sat at the left of their grid cells while the data values were center-aligned via `flex justify-center`. Visible offset between header and value.

Two root causes:

1. Headers were inline `<span>` elements with `style={{ textAlign: "center" }}`. Inline spans collapse to their content width, so `text-align: center` had nothing to center within — the span just sat at `justify-self: start` of the grid cell.
2. The rows container had `min-w-[1100px]` but the header row did not. On narrow viewports the header would compress while rows enforced 1100px — columns would diverge under horizontal scroll.

After fixing alignment, follow-up: previously the only way to change sort was a "Sort" `<select>` dropdown in the toolbar. Native table UX is click-the-header. Adding click-to-sort with a chevron indicator removes the need for the dropdown entirely.

## Fix

### Alignment

- Switched header spans to `display: block` with Tailwind `text-center` (or `text-left` for Artist + Top Signal which match left-aligned data cells).
- Added `min-w-[1100px]` to the header row to match the rows container.

### Click-to-sort

- Promoted `COLUMNS` from `string[]` to `{ label, align, sortKey? }[]`.
- Sortable columns (Rise Prob, Stage, 7d Velocity, Signability, Ghost Curve) render as `<button>` elements that call the existing `handleSort()` (toggles direction on same key, sets new key descending).
- Active sort column shows `text-white/70` with `<ChevronDown>` (desc) or `<ChevronUp>` (asc) at 11px, strokeWidth 2.5.
- Inactive sortable columns render `text-white/25 hover:text-white/55` with an invisible chevron of the same size to reserve space and prevent layout shift on activation.
- `aria-sort` attribute on each sortable header for screen readers (`ascending` | `descending` | `none`).
- Non-sortable columns (Artist, Format Alpha, Top Signal) stay as plain spans.
- Removed the Sort `<select>` and the `SORT_OPTIONS` constant from the toolbar — the headers replace it. `SortKey` type and URL-persistence logic for `?sort=` and `?order=` are unchanged, so deep links still work.

## What was tested

- `npx tsc --noEmit` — clean.

## What to verify in browser

- Visit `/label/ar` and confirm:
  - RISE PROB number sits centered under the RISE PROB header
  - STAGE badge sits centered under STAGE
  - 7D VELOCITY sparkline + percent sit centered under 7D VELOCITY
  - FORMAT ALPHA value sits centered under FORMAT ALPHA
  - TOP SIGNAL stays left-aligned under TOP SIGNAL header
  - SIGNABILITY score centered under SIGNABILITY
  - GHOST CURVE match centered under GHOST CURVE
- Click each sortable header (Rise Prob, Stage, 7d Velocity, Format Alpha, Signability, Ghost Curve):
  - First click → sorts descending, chevron points down
  - Second click on same column → sorts ascending, chevron points up
  - Click on a different sortable column → that column becomes active descending, previous column's chevron disappears
  - Hover non-active sortable headers → text gets brighter (white/25 → white/55)
  - Artist / Top Signal headers do nothing on click (not buttons)
  - Format Alpha sort surfaces highest engagement-lift formats first (desc) — useful for spotting outliers
- Confirm sort persists via URL (`?sort=signability&order=asc`) — refresh the page on a sorted view, sort survives.
- Resize viewport narrower than 1100px and confirm header and rows scroll together.
