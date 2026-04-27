# Backend handoff — Realfootage poster-frame extraction

**Repo:** `wavebound-backend`
**Stack:** Supabase Edge Functions (Deno), ffmpeg, Supabase Storage
**Estimated effort:** 1–2 hrs. One ffmpeg call + one storage upload + one bucket policy.

---

## Background

The Content Factory v2 Story preset bundles two pipelines: cartoon (`cartoon_scripts` → `cartoon_videos`) and realfootage (`realfootage_scripts` → `realfootage_videos`). Cartoon items get a deterministic still thumbnail at `${SUPABASE_URL}/storage/v1/object/public/cartoon-images/${script_id}/000.png` (shot 0's rendered first frame), so the QueueCard in Review shows a recognizable preview before the user clicks play.

Realfootage has no parallel — clip 0's first frame isn't extracted to a deterministic URL anywhere. The QueueCard falls back to the `<video>` element with no poster, so the Review tile is visually noisier than the cartoon equivalent.

The frontend (this repo, today's commit) has already been updated to **probe** the future realfootage URL pattern — `deriveCartoonItemState` in `src/components/content-factory-v2/cartoonReconciler.ts` now sets:

```ts
thumbnailUrl =
  format === "realfootage"
    ? `${SUPABASE_URL}/storage/v1/object/public/realfootage-thumbs/${row.id}/poster.jpg`
    : `${SUPABASE_URL}/storage/v1/object/public/cartoon-images/${row.id}/000.png`;
```

The `<img onError>` in `ReviewView.tsx:645` hides the broken image if the file isn't there, so this is safe to ship before the backend lands. The moment a poster.jpg lands at that URL, every realfootage card in the inbox renders it without any further frontend change.

## What to ship on the backend

### 1. Storage bucket: `realfootage-thumbs`

- Public read (same policy as `cartoon-images`).
- Path key: `${realfootage_script_id}/poster.jpg` (script id, not video id — the frontend doesn't know the video id when deriving the thumbnail URL).
- One file per script. If multiple posters get extracted (rare), overwrite is fine.

### 2. Poster extraction step in `realfootage-vo` (or a follow-on worker)

The simplest place is right after Creatomate's `final_url` lands and `realfootage_videos.status` flips to `complete`. Pseudo-code:

```ts
// Inside the realfootage-vo Creatomate webhook handler, after persisting
// final_url:
const videoUrl = creatomate_payload.url;
const tmp = await Deno.makeTempFile({ suffix: ".mp4" });
const tmpJpg = await Deno.makeTempFile({ suffix: ".jpg" });
// 1) download the rendered video
await downloadTo(videoUrl, tmp);
// 2) extract frame at t=1.0s (skips any leading black/fade), 720p quality
await runFFmpeg([
  "-y",
  "-i",
  tmp,
  "-ss",
  "00:00:01.000",
  "-frames:v",
  "1",
  "-q:v",
  "5", // ~720p JPEG, ~120KB
  "-vf",
  "scale=720:-1",
  tmpJpg,
]);
// 3) upload to public bucket
await supabase.storage
  .from("realfootage-thumbs")
  .upload(`${script_id}/poster.jpg`, await Deno.readFile(tmpJpg), {
    contentType: "image/jpeg",
    upsert: true,
  });
```

Edge function execution-time budget: this is well under the 60s ceiling. A 60s 1080p MP4 download + ffmpeg single-frame extract + upload typically runs in 4–8s.

### 3. Failure handling

Don't fail the video-completion path if the poster extraction fails — log and continue. The frontend already handles missing posters via `<img onError>`. The video itself is the deliverable; the poster is a polish item.

### 4. Backfill (optional, low priority)

There are existing realfootage rows with no poster. A one-shot edge function or pg_cron job that walks `realfootage_videos` where `status='complete' AND final_url IS NOT NULL` and runs the same extraction would close the gap. Not blocking the fix — new realfootage rows will get posters from the moment the writer ships.

## Acceptance

- A new realfootage job that completes end-to-end has a `poster.jpg` at `realfootage-thumbs/${script_id}/poster.jpg` within 30s of `realfootage_videos.status='complete'`.
- The bucket is publicly readable (no signed-URL needed — the frontend constructs the URL directly).
- Hitting the URL with `curl -I` returns 200 + `image/jpeg`, file size 50–200 KB.
- The Review tile for that realfootage item shows the still in the QueueCard preview (visual confirmation in the frontend).

## Notes / context

- Don't reuse `cartoon-images` for realfootage — it's already keyed by cartoon `script_id` and the bucket policy may diverge later.
- `script_id` (not `video_id`) is the path key because the frontend's `deriveCartoonItemState` doesn't know the video id at derivation time, only the script id.
- If poster extraction adds noticeable wall time to the webhook handler, move it to a `pg_notify` + worker subscription instead of inline. Don't block the MP4-ready signal on the poster.
