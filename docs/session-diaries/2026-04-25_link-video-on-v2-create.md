# 2026-04-25 — Link → video moved into Content Factory V2

## What changed

- `src/components/content-factory-v2/types.ts` — added `linkVideoJobId`,
  `linkVideoStage`, `linkVideoRefUrl`, `linkVideoCostCents` to `QueueItem`.
- `src/components/content-factory-v2/linkVideoReconciler.ts` — **new**
  module. `reconcileLinkVideoItem(item)` polls
  `content-factory-status/{jobId}`, returns a patch
  (`status`, `linkVideoStage`, `jobStage`, `linkVideoCostCents`, plus
  `renderedClipUrl` on done / `jobError` on error). Snapshot helpers
  (`load/save/itemFromSnapshot/snapshotFromItem`) persist runs to
  `sessionStorage` under `cf-linkvideo-runs-v1-{labelId}`.
  `friendlyLinkVideoError` ports the legacy error map.
- `src/components/content-factory-v2/CreateView.tsx` — exported
  `LinkVideoJobInput`, added `onLinkVideoJob` to `CreateViewProps`. New
  state for the link_video form (URL, handle, MP3 file, transcribe
  provider, submitting, error). New `handleLinkVideoSubmit` uploads the
  optional MP3 to the `content-factory` bucket then invokes
  `content-factory-generate` (same payload as legacy). New
  `useEffect` block reads/persists transcribe provider per user via
  `localStorage`. The mock Extract+Generate JSX block was replaced with
  a real form (URL, handle, transcribe-provider select, MP3 picker,
  error banner, Generate button). Generic Tune+Generate footer now
  also excludes `link_video`. Helper functions `isValidTikTokUrl`,
  `stripHandle`, `slugifyHandle` ported from the legacy file.
- `src/pages/label/ContentFactoryV2.tsx` — imported the reconciler and
  `LinkVideoJobInput` type. Added the link_video orchestration block
  (rehydrate on label change, save on queue change, single-item
  reconcile callback, fetch-by-id with stale-job timeout, 3s polling
  tick + visibility-change catch-up). New `handleLinkVideoJob` callback
  pushes a placeholder `QueueItem` and flips to Review. Wired the prop
  into the `<CreateView>` render site.
- `docs/features/link-video-v2.md` — new feature doc.

## Why

The user asked to wire the legacy `/label/content-factory` flow into the
new V2 Create tab — "just move it into this new one." The `link_video`
preset already had the matching copy ("Paste a TikTok/YT ref, we mirror
the vibe") but its CTA was a mock that pushed a `QueueItem` with
`status='pending'` and no real backend call. Now the preset hosts the
real generator.

## What was tested

- `npx tsc --noEmit` — clean (exit 0).
- No runtime test yet — Paul to verify in browser per
  `docs/features/link-video-v2.md` "Correct behavior" bullet list.

## What to verify in browser

1. Open `/label/content-factory-v2?tab=create`, pick **Link → video**.
2. Submit a known-good ref: `https://www.tiktok.com/music/Aperture-7598271658722576401`
   with handle `aperturetest`. Tab should flip to Review with a
   placeholder card showing the spinner + "Queued — pipeline picking
   up." stage label.
3. Watch the stage label tick through Ingested → Decomposed →
   Transcribed → Lyrics fixed → Cast → Rendering. On `done`, the card
   should flip to a video thumbnail and the inline player should open.
4. Compare against `/label/content-factory` for the same ref — `final_url`
   should be identical end-to-end.
5. Refresh the page mid-job. The placeholder should rehydrate from
   sessionStorage and the polling tick should resume.
6. Force a failure (malformed URL, expired session, etc.) — card flips
   to red `failed` with the friendly error.

## While I was in here

- The legacy `/label/content-factory` page (`src/pages/label/ContentFactory.tsx`)
  - its sidebar entry (`LabelSidebar.tsx:121`) + its route
    (`App.tsx:380-381`) are untouched. Once you confirm V2 parity, I'd
    suggest a follow-up PR to remove all three — that file is 1,032 lines
    of duplicated state machine and is the single source of truth for the
    port we just did.
- The `link_video` preset card on the picker still says "Paste a
  TikTok/YT ref, we mirror the vibe" but YouTube refs aren't actually
  accepted (legacy validator only matches `tiktok.com` / `vm.tiktok.com`).
  Worth tightening the copy to "Paste a TikTok ref" until the YouTube
  ingest path actually exists.
- The V2 sidebar artist picker (the right column) still uses
  `MOCK_ARTISTS` — it doesn't drive the link_video handle. The user
  types the handle by hand into the form. If you want that to become a
  real-roster dropdown (like the fan-brief wizard), that's a separate
  small task.
- The legacy form had a stepper UI showing the 7 pipeline stages.
  Review's QueueCard surfaces only `jobStage` (a single live label) for
  link_video — same UX as fan-brief and cartoon. If you want a richer
  stage timeline like the cartoon's pill bar, mirror
  `cartoonReconciler.scriptStatusToStage` in `linkVideoReconciler` and
  add a 7-pill row to QueueCard. Defer until somebody complains.
