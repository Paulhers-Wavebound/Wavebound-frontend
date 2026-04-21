# Fan Briefs rendering stuck — diagnosis and fix

## What was broken

Paul approved a brief and watched the Clips tab spin forever. Two unrelated bugs:

### 1. Render worker not running

`scripts/fan-briefs/render-worker.ts` is a **long-running Deno process** that subscribes to Supabase Realtime for `fan_briefs` UPDATEs with `status=eq.approved` and shells out to `render-clip.ts`. It also checks for a backlog of approved briefs on startup and every 5 min.

`ps aux | grep render-worker` → nothing. `/tmp/render-worker.log` → did not exist. The process had been dead at least since April 9 (there's a brief from that date still stuck in backlog).

Approved briefs with no `rendered_clip_url` when I looked:

- `3d4c7703-8aca-4e56-95ee-ef81bea5ccd2` (harrystyles) — approved 2026-04-09
- `9ddb3394-3081-4c22-99c9-34c534d6817e` (bensonboone) — approved 2026-04-21 20:36 (today)

### 2. Frontend bucket name was wrong

Backend `scripts/fan-briefs/render-clip.ts:27` writes to `fan-brief-clips`. Existing `rendered_clip_url` values in the DB all point at `/fan-brief-clips/...`. Frontend `LabelFanBriefs.tsx:13` had `FAN_BRIEFS_BUCKET = "fan-briefs"`.

Consequence: `getStoragePath()` returned `null` for every real rendered URL. The Clips-tab delete flow would archive the DB row but skip storage cleanup, leaking the MP4. Not loud because both buckets actually exist.

## What changed

- **`src/pages/label/LabelFanBriefs.tsx`** — `FAN_BRIEFS_BUCKET = "fan-brief-clips"`. Removed the stale doc comment referencing `/object/public/fan-briefs/...` — the regex uses the constant now, so it's self-documenting.
- **`docs/features/fan-briefs.md`** — Updated all four references to the bucket name; added `render-worker.ts` to Key Files with a note that approvals don't render unless it's running; reworded Permissions to reflect the bucket is public-read (that's how the `<video>` tag streams without a signed URL).
- **Ran `render-worker.ts` in the background** — `nohup deno run -A scripts/fan-briefs/render-worker.ts > /tmp/render-worker.log 2>&1 &` from the backend repo, with `SUPABASE_SERVICE_KEY` in env. It immediately picked up both backlog briefs and started downloading via yt-dlp.

## What was tested

- `npx tsc --noEmit` — clean
- Worker process alive: `ps aux | grep render-worker` shows PID 90564
- Worker log shows preflight checks passing (ffmpeg, yt-dlp, Remotion, WhisperX venv, TikTokSans-Bold.ttf) and the first brief already in Step 1 (yt-dlp extraction)

## What to verify in browser

1. Leave `/label/fan-briefs` open on the Clips tab — within ~5–10 min the two stuck briefs should swap from "Rendering..." to playable videos on the 30s poll
2. Approve a fresh brief → Realtime fires, worker picks it up within a second, spinner resolves on next poll (~30s after render completes)
3. Delete a rendered clip → confirm in Supabase Studio that the MP4 is actually gone from the `fan-brief-clips` bucket (this was silently broken before)

## While I was in here

1. **The render worker is a single point of failure on Paul's laptop.** If the Mac sleeps or reboots, approvals silently stack up in backlog. Options:
   - Wrap it in a `launchd` plist (`~/Library/LaunchAgents/com.wavebound.render-worker.plist`) with `KeepAlive=true` — survives logout but not a Mac power-off
   - Move it to a Railway / Fly.io / Render worker so it's not tied to a laptop — right answer long-term
   - Add a "Workers healthy?" admin panel that pings a heartbeat table — cheap insurance so this doesn't happen again
2. **Add a `render_status` column on `fan_briefs`** (`queued` / `rendering` / `failed` / `rendered`) so the UI can distinguish "waiting for worker" from "worker down" from "render errored". Today we conflate all three into a spinner.
3. **The worker has no retry on transient yt-dlp / ffmpeg failures.** One flaky network blip and the brief is stuck forever (until next 5-min backlog sweep, which just retries blindly without tracking attempts).
4. **Backend handoff `2026-04-20_fan-briefs-rendered-clip-path.md`** proposed a `rendered_clip_path text` column to avoid URL parsing on the frontend. Today's bucket-name bug is a nice datapoint for that handoff — had the path been stored directly, the frontend wouldn't have needed to know the bucket name at all.
5. **Confirm both buckets should exist.** `fan-briefs` bucket is defined in migrations but unused in code. Either delete it or reconcile — the naming collision is exactly what caused this confusion.
