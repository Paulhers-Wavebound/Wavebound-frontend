# 2026-04-25 (later) — Cartoon thumbnails in Review

## What changed

- `src/components/content-factory-v2/cartoonReconciler.ts`
  - `reconcileCartoonItem` completion branch now queries
    `cartoon_image_assets` for the lowest-index complete shot when a
    cartoon flips from `generating` → `pending`, and includes
    `thumbnailUrl` in the returned patch. Uses `.from("...
" as never)`
    to match the existing pattern (cartoon tables aren't in the typegen
    yet).
  - `CartoonRunSnapshot` gained `thumbnailUrl?: string` so the thumb
    survives refresh through the localStorage hydration path.
  - `snapshotFromItem` and `itemFromSnapshot` mirror the new field.

No other files needed edits — `ReviewView`'s `ThumbFrame` already keys
its `<img>` rendering off `item.thumbnailUrl` (line 664), and the
hover-overlay + click-to-play path (line 742) lights up automatically
once the thumb is set, since `renderedClipUrl` is already populated for
completed cartoons.

## Why

In the pending-review list, fan-brief clips show a real thumbnail
(YouTube `hqdefault.jpg` synthesized from `source_url`), but cartoons
fell through to the generic `Film` icon — the tile was effectively
blank. Cartoons looked like second-class items next to fan briefs even
though we'd already rendered a perfect hook frame for each one.

`cartoon_image_assets.storage_url` is a public Supabase Storage URL of
the rendered shot. Shot 0 is the art-director-designated hook frame, so
it's the natural thumbnail. When shot 0 itself was blocked by
gpt-image-2 safety (e.g. `cartoon_scripts.id =
0122bceb-7f68-4a06-b7ee-aec33e16e8fa`, which shipped with a blank
opener), `ORDER BY segment_index ASC LIMIT 1 WHERE status='complete'`
falls back to the next successful shot — still a real cartoon frame
from the same scene, still better than a gray icon.

## What was tested

- `npx tsc --noEmit` — clean.
- Live REST query against `cartoon_image_assets` confirmed the column
  shape used by the reconciler:
  ```
  GET /rest/v1/cartoon_image_assets?segment_index=eq.0&status=eq.complete
  →
  [{ "script_id":"8b96cecd-19ac-47b4-b18b-8e0aa02b85a2",
     "segment_index":0,
     "status":"complete",
     "storage_url":"https://kxvgbowrkmowuyezoeke.supabase.co/storage/v1/
                   object/public/cartoon-images/8b96cecd-…/000.png" },
   { "script_id":"edef5e4e-8df1-470b-8902-8e6c4f4e80ca", … }]
  ```
  Both publicly readable, no signed URL needed.

## What to verify in browser

1. **Existing pending cartoons** — open
   `/label/content-factory-v2?tab=review` for a label with a cartoon
   already at `pending`. The first load won't show the thumb (snapshot
   was written before this change, and a `pending` item doesn't go
   through the reconciler again). After regenerating one fresh cartoon,
   the thumb appears on its QueueCard.
2. **Fresh cartoon, end-to-end** — wizard at `?tab=create`, count = 1.
   When the stage timeline lands on `complete`, the QueueCard thumbnail
   should be the rendered shot 0 (9:16 cartoon frame), not the gray
   `Film` icon.
3. **Refresh after complete** — hard-refresh while the completed
   cartoon is on screen. Thumbnail must remain (proves snapshot
   persistence works).
4. **Click-through** — clicking the thumbnail opens the existing
   `BriefViewerModal` and plays `cartoonFinalUrl`.
5. **Fallback path** — if any future cartoon has shot 0 fail but later
   shots succeed, the QueueCard should show the next-lowest shot
   instead of falling back to the icon. Hard to force in normal
   testing; the query semantics make it self-evident.

## While I was in here

1. **`cartoon_image_assets` should land in the Supabase typegen**
   alongside `cartoon_scripts` / `cartoon_videos`. All three are still
   accessed via `.from("..." as never)`. Once the next typegen runs,
   drop the casts in `cartoonReconciler.ts` (lines 277/282 and the new
   shot-fetch query).
2. **Pending cartoons hydrated from localStorage stay thumb-less until
   regen.** They're at `status === 'pending'`, so the reconciler
   short-circuits at line 197. Could add a one-shot
   "missing-thumbnail-backfill" inside `itemFromSnapshot` (or in
   ContentFactoryV2's mount effect) that fires the
   `cartoon_image_assets` query for any pending cartoon whose snapshot
   has no `thumbnailUrl`. Cheap (one query per affected card on mount)
   and would clean up the stragglers without forcing a regen. Worth
   doing as a follow-up if Paul has many old pending cartoons.
3. **`CartoonRunSnapshot` is starting to drift toward "subset of
   QueueItem".** Five new fields in the last week. Next time a field is
   added, consider just storing the whole `QueueItem` shape and
   typing the snapshot as `Pick<QueueItem, …>` to keep them in sync
   automatically.
