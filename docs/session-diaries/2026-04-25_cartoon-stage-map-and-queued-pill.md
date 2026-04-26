# 2026-04-25 — Cartoon stage map fix + queued sub-state pill

## What changed

- `src/components/content-factory-v2/types.ts` — added
  `cartoonStageDetail?: string` to `QueueItem`.
- `src/components/content-factory-v2/cartoonReconciler.ts`
  - `scriptStatusToStage`: added `planning_images` → `images` (the
    backend now emits this between `vo_complete` and `rendering_images`;
    previously fell through to the default `vo` and looked like a regression).
  - New `scriptStatusToDetail` helper — emits "Queued · waiting for slot"
    at `vo_complete` / `images_complete`, "Preparing" at `planning_images`.
  - New `FAILED_STATUSES` set + `statusToErrorLabel` — catches
    `vo_failed` / `images_failed` / `video_failed` as terminal and
    synthesizes a label when backend leaves `error_message` null
    (matches the silent-VO-failure pattern observed earlier today on the
    Harry Styles runs).
  - `CartoonRunSnapshot` + `snapshotFromItem` + `itemFromSnapshot` thread
    `cartoonStageDetail` through localStorage so the hint survives refresh.
  - Reconciler step 2 patch now sets/clears `cartoonStageDetail` on every
    transition and clears it on terminal states.
- `src/components/content-factory-v2/ReviewView.tsx`
  - `CartoonStageTimeline` accepts an optional `detail` prop, renders it
    as an inline secondary-color label after the "Done" pill, and adds
    `flex-wrap` so the row breaks cleanly on narrow cards.
  - QueueCard passes `item.cartoonStageDetail` through.
- `docs/features/cartoon-create.md` — documented the new stage mapping,
  the failure-status handling, and the queued sub-state.

## Why

Watched two Addison Rae cartoons run end-to-end (run started 23:28,
finished 23:53). Two issues surfaced live:

1. **Backend serializes image rendering.** Cartoon 2 sat at
   `vo_complete` for ~9 min while Cartoon 1 occupied the image-render
   worker. The Review timeline showed the Images pill spinning the whole
   time, indistinguishable from an actual stall.
2. **Stage map gap.** Backend now passes through `planning_images`
   between `vo_complete` and `rendering_images`. The reconciler's switch
   didn't handle it — fell through to the default `vo` case, briefly
   bouncing the timeline backwards.

Also folded in the `vo_failed` / `images_failed` / `video_failed`
terminal handling because the same audit surfaced that the previous
silent VO failures (this morning's Harry Styles runs) only ever hit the
literal `failed` branch — staged failures were silently treated as
in-progress.

## What was tested

- `npx tsc --noEmit` — clean.
- Verified live `cartoon_scripts.status` values via service-role REST
  query: `draft`, `rendering_vo`, `vo_complete`, `planning_images`,
  `rendering_images`, `images_complete`, `rendering_video`, `complete`,
  `vo_failed` (observed on prior runs).

## What to verify in browser

- Generate N=2 cartoons, watch Review:
  - Cartoon 2 should show "Queued · waiting for slot" at the end of the
    timeline while Cartoon 1 is at `rendering_images`.
  - Once Cartoon 1 reaches `rendering_video`, Cartoon 2 should advance
    past the queued hint into `Preparing` → spinning Images pill →
    Video.
- Refresh the page mid-run — the queued hint should survive (it's in the
  snapshot now).

## While I was in here, recommendations

1. Backend: populate `cartoon_scripts.error_message` on `*_failed`
   states. The frontend now has a fallback label, but ground-truth would
   be better.
2. Backend: parallelize image rendering for the same label, or surface a
   queue depth so the UI can show "2 cartoons ahead".
3. UI: consider an estimated-completion line ("~10 min remaining") once
   we have observable per-stage timing.
4. Backend handoff: investigate why earlier Harry Styles runs hit
   `vo_failed` with null error_message. Likely an unhandled provider
   error path in the VO worker.
