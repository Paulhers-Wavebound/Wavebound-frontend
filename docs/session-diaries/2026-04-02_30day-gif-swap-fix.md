# 30-Day Plan GIF Swap Fix

## What changed

- `src/components/admin/ThirtyDayPlanEditor.tsx`
  - Removed `hasGifRef` guard from PlayCard — swap button now shows on every play, not just ones with "Ref #N" in source text
  - Added prominent GIF management strip inside expanded PlayCard with vertical layout (thumbnail + "Swap GIF" / "Replace Play" buttons on their own row — prevents overflow clipping)
  - Added `gifMap` prop as fallback GIF URL source when `planVariants.gifs.available` is empty
  - Fixed `gifUrlMap` regex to handle "Reference video #N", "Niche inspiration #N" variants (not just strict "Ref #N")
  - Added evidence field to source text search (some plays only reference GIFs in evidence, not source)
  - Fixed own key format: tries `own_N` (1-indexed, matching backend) before falling back to `gifMap[N-1]` (0-indexed storage)

- `src/components/admin/AdminEditTab.tsx`
  - Passes `gifMap` prop to ThirtyDayPlanEditor

## Why

- GIF swap buttons were hidden: `hasGifRef` regex didn't match common source text patterns like "Reference video #1"
- Buttons were clipped: horizontal flex layout with `flex-shrink-0` buttons overflowed the `overflow-hidden` card container
- GIF thumbnails showed "No GIF assigned" even when GIFs existed: `get-plan-variants` returns 0 available GIFs for some artists (silent backend error), but `buildGifMap` (storage scan) finds them fine
- "Can't click" issue: buttons existed but were rendered off-screen to the right

## What was tested

- tsc clean
- Verified `get-content-pool` returns 88 own videos (12 with GIFs), 39 niche videos for thechainsmokers
- Verified storage has 12 GIFs for thechainsmokers that `buildGifMap` resolves correctly
- Confirmed `get-plan-variants` returns 0 GIFs (backend issue) — gifMap fallback handles this

## What to verify in browser

1. Open 30-day plan for any artist, expand a play card — should see GIF thumbnail and "Swap GIF" / "Replace Play" buttons below it
2. Click "Swap GIF" — should open GIF picker modal with Own/Niche tabs
3. Click "Replace Play" — should open idea picker modal
4. GIF thumbnails should show for plays that reference videos in source/evidence text

## While I was in here

1. **Backend `get-plan-variants` GIF loading is broken** — returns 0 GIFs for thechainsmokers even though storage has 12. The catch block at line 190 silently swallows errors. Need to add logging or fix the root cause in the backend.
2. **`own_` key indexing inconsistency** — backend uses `own_${idx+1}` (1-indexed) but some frontend code assumes 0-indexed. The gifUrlMap now tries both, but this should be unified.
3. **GIF strip doesn't show** — since `planVariants.gifs.available` is empty, the GifStrip component at top of 30-day editor doesn't render. Could add a fallback to show gifMap GIFs in the strip too.
