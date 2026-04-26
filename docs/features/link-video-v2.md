# Link → video (Content Factory V2)

## What it does

Generates a 9:16 MP4 from a TikTok reference URL via the legacy
`content-factory-generate` edge function, surfaced inside the V2 Create tab
as the **Link → video** preset. The legacy `/label/content-factory` page
remains as a parity reference but the V2 path is the long-term home.

## Who uses it and why

Label operators who have a TikTok ref clip whose vibe they want to mirror
for an artist drop. Common flow: see a TikTok that matches the artist's
mood, paste it, get a vertical MP4 lip-synced to the artist's track in
~4–8 minutes.

## Correct behavior

- Pick **Link → video** in the Create preset grid; the form replaces the
  generic Tune+Generate footer with its own.
- Required: a `tiktok.com` / `vm.tiktok.com` URL and a free-text artist
  handle (leading `@` is stripped).
- Optional: an MP3 of the artist track (max 10 MB, `.mp3` only). Skip to
  use the audio attached to the ref TikTok.
- Transcribe provider toggle (AudioShake premium / WhisperX free) persists
  per user via `localStorage` key `cf:transcribe_provider:{userId}`.
- Hitting Generate uploads the MP3 (if present) to the
  `content-factory` storage bucket at
  `sources/{labelId}/{rand}-{slugified-handle}.mp3`, then invokes
  `content-factory-generate` with
  `{ label_id, artist_handle, ref_tiktok_url, transcribe_provider, artist_mp3_path? }`.
- The form resets, the user is flipped to the Review tab, and a
  placeholder QueueItem appears with `status='generating'`,
  `outputType='link_video'`, `linkVideoJobId`, `linkVideoRefUrl`.
- Polling against `content-factory-status/{jobId}` runs every 3s. Stage
  transitions update `jobStage` (Ingested → Decomposed → Transcribed →
  Lyrics fixed → Cast → Rendering → Done). Cost in `linkVideoCostCents`
  also updates each tick.
- On `done`: status flips to `pending`, `renderedClipUrl` is set from
  `final_url`, Review's existing inline `<video>` player renders the MP4.
- On `error`: status flips to `failed`, `jobError` carries a friendly
  message (e.g. `sound_no_play_url`, `audioshake_*`, etc.).
- Refresh-resilient: snapshots persist to `sessionStorage` under
  `cf-linkvideo-runs-v1-{labelId}` for instant remount rehydrate.
  `cf_jobs` is the **authoritative** source of truth — the
  `recentCfJobsQuery` in `ContentFactoryV2` polls every 30s (only
  while at least one link_video item is `generating`; the initial
  fetch always runs to discover orphans) and either patches the
  sessionStorage-rehydrated items with the latest DB state or
  builds fresh placeholders via `buildLinkVideoItemFromJob` when
  sessionStorage was lost (HMR before the first poll, fresh tab,
  incognito).

## Edge cases

- **No label scope.** Form is disabled and the helper text reads "No
  label scope on your profile — contact Paul."
- **Invalid URL.** Inline yellow help text ("Must be a tiktok.com or
  vm.tiktok.com URL.") + Generate disabled.
- **Missing handle.** Generate disabled until non-empty.
- **MP3 too big / wrong type.** Inline red error banner; submit blocked.
- **`content-factory-generate` returns no `job_id`.** Surfaces as
  "Generation failed — No job_id returned from generate endpoint" toast,
  no placeholder is added.
- **Stale rehydrate (404 on status).** Reconciler treats Status 404 as
  terminal: placeholder flips to `failed` with "Job not found — it may
  have been cleaned up."
- **30-min stall.** Local timeout flips placeholder to `failed`. If the
  worker eventually finishes after that, the next 30s poll of
  `recentCfJobsQuery` will re-patch the item with the final URL and
  flip it back to `pending` (the merge effect doesn't downgrade
  locally-`scheduled` items, but `failed` → `pending` on a real
  completion is desired).
