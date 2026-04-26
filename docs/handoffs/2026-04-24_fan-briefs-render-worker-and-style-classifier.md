# Task: revive the fan-briefs render worker + fix render_style mis-tagging

**For the next Claude Code session inside `~/Projects/wavebound-backend`.**

## Skills to Invoke

**Core:**

- `/verification-before-completion` — every change is observable in the prod DB. Don't claim it works until you've SQL-verified that a fresh approved brief gets `rendered_clip_url` populated end-to-end.
- `/systematic-debugging` — three layered issues; tempting to patch the symptom (restart the worker) without fixing the structural causes (no auto-restart, missed-INSERT subscription, classifier bug). Don't stop at the first one.

**On-demand:**

- `/typescript-expert` — small Deno edits to `render-worker.ts` and either `generate-briefs.ts` or `mine-live-signals.ts`.
- `/supabase` — only if you need to inspect Realtime publication status.

## Why this exists

The frontend on-demand fan-brief wizard (shipped today, see `wavebound-frontend/docs/handoffs/2026-04-24_fan-briefs-on-demand-generation.md`) is now end-to-end live: user picks artist + source + count → POST `fan-briefs-generate-on-demand` → worker runs the four-stage pipeline → `fan_briefs` rows land at `status='approved'`.

But the rendered MP4s never appear. The 5 Malcolm Todd briefs created at `2026-04-25T03:28:25` are all `rendered_clip_url=null`, three full days after the last successful render in the system (Apr 21, Boone). The frontend now has a "watch the edit" modal, but with nothing to play, that modal just shows "render hasn't run yet."

Three root causes, layered:

1. **The render worker is dead.** It's a long-running Deno process started via `nohup` — no systemd unit, no auto-restart. Last successful render was 2026-04-21. Whatever restarted the box (or killed the worker) since then took the render path with it.
2. **Even with a healthy worker, on-demand briefs would still leak through.** The Realtime subscription only listens to `event: "UPDATE"` with `filter: "status=eq.approved"`. The on-demand pipeline INSERTS rows already at `status='approved'` — those events fire as INSERTs, not UPDATEs. Worker would only catch them via `renderBacklog()` at startup, which fires once per process start. Restart-fragile.
3. **`mine-live-signals.ts` mis-tags interview segments as `render_style='karaoke'`.** Even when the worker is alive and catches INSERTs, the explicit karaoke-skip in `V1_SKIP_RENDER_STYLES` would still defer those briefs to the v2 song renderer that doesn't exist yet. Two of the five Malcolm Todd briefs are mistagged this way.

Fix all three. They compound — fixing only #1 leaves a fragile setup that breaks again on the next host reboot, and a fraction of every on-demand batch silently won't render.

## Current state (verified via REST API at 2026-04-25T03:30Z)

```sql
-- Total approved fan_briefs: 9
-- Already rendered: 4 (latest 2026-04-21, bensonboone)
-- Unrendered approved: 5 (all malcolmtodddd from 2026-04-25 03:28)

-- 3 of 5 are render_style='talking_head' (renderable today, just blocked by dead worker)
-- 2 of 5 are render_style='karaoke' (mis-tagged — should be talking_head)

-- The mis-tagged segments inherit karaoke from content_segments.metadata.render_style
-- which mine-live-signals.ts wrote during the wizard run.

-- Example of a mis-tagged segment (id c885bcc4-d258-4524-ad63-bd278628f348):
--   moment_type: live_peak
--   metadata.render_style: karaoke
--   metadata.live_venue: "live"   ← also wrong; this is a podcast/interview source
--   metadata.source_title: "A Very Saucy Dinner with Malcolm Todd"
```

The wizard's "Podcasts" path (`source='podcasts'`) maps to `content_type='interview'` and runs `discover.ts` → `fetch-comments.ts` → `mine-live-signals.ts` → `generate-briefs.ts --content-type interview`. The third script is the culprit — it was designed for `content_type='live_performance'` but runs unchanged on interview content, so it stamps live-performance metadata onto segments it shouldn't.

## What to build

### 1. Restart `render-worker.ts` and convert to a systemd unit (so it survives reboots)

SSH into Hetzner. First confirm the worker is dead:

```bash
ps aux | grep render-worker | grep -v grep
```

If it's missing (almost certainly), do NOT just `nohup … &` it back up — that's how we got here. Convert it to a systemd unit so the host owns the lifecycle:

```ini
# /etc/systemd/system/wavebound-render-worker.service
[Unit]
Description=Wavebound fan-briefs render worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=<the user owning /opt/wavebound-pipeline>
WorkingDirectory=/opt/wavebound-pipeline
EnvironmentFile=/opt/wavebound-pipeline/dbt/.env.dbt
ExecStart=/usr/local/bin/deno run -A /opt/wavebound-pipeline/scripts/fan-briefs/render-worker.ts
Restart=on-failure
RestartSec=10s
StandardOutput=append:/opt/wavebound-pipeline/logs/render-worker.log
StandardError=append:/opt/wavebound-pipeline/logs/render-worker.log

[Install]
WantedBy=multi-user.target
```

(Adjust `User=`, the deno path, and the env-file path to match what the on-demand worker uses — `/opt/wavebound-pipeline/dbt/.env.dbt` is what Paul mentioned earlier today, so it should hold `SUPABASE_SERVICE_KEY` already.)

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wavebound-render-worker.service
sudo systemctl status wavebound-render-worker.service
tail -f /opt/wavebound-pipeline/logs/render-worker.log
```

Expect to see `[worker] Backlog: 3 to render, 2 deferred (karaoke)` shortly after start (the 3 Malcolm Todd talking-head briefs + the 2 karaoke-mistagged ones deferred). Renders take a few minutes each (yt-dlp + ffmpeg + Remotion).

### 2. Patch `render-worker.ts` to subscribe to INSERT events as well as UPDATEs

`scripts/fan-briefs/render-worker.ts:126-147` currently subscribes only to UPDATE:

```ts
function subscribe(): void {
  var channel = supabase
    .channel("fan-briefs-render")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "fan_briefs",
        filter: "status=eq.approved",
      },
      function (payload: {
        new: { id: string; status: string; rendered_clip_url: string | null };
      }) {
        var row = payload.new;
        if (row.status === "approved" && !row.rendered_clip_url) {
          console.log(
            "[worker] Realtime: brief " +
              row.id +
              " approved, triggering render",
          );
          renderBrief(row.id);
        }
      },
    )
    .subscribe(/* … */);
}
```

This was correct for the original CLI flow (briefs are inserted as `pending` then UPDATEd to `approved`). The on-demand wizard flow inserts directly at `approved` — fires INSERT, not UPDATE.

Change `event: "UPDATE"` to `event: "*"` so both INSERT and UPDATE trip the handler. The same row check (`status === "approved" && !rendered_clip_url`) still correctly filters out anything that isn't a fresh approval. Verify by running the on-demand wizard end-to-end (see Verification below) — the worker log should show `Realtime: brief <uuid> approved, triggering render` within a second of the wizard hitting "Create" → pipeline finishing.

If `event: "*"` doesn't work for filtered subscriptions in your Realtime SDK version, fall back to two parallel subscriptions (one INSERT, one UPDATE) or change the filter strategy. Test before merging.

### 3. Stop mis-tagging interview briefs as `render_style='karaoke'`

Two layers — pick the **defensive** layer for now (faster fix, lower blast radius), and open a follow-up issue for the **structural** layer:

#### Defensive (do this in this session)

`scripts/fan-briefs/generate-briefs.ts:657-667` — after deriving `renderStyle` from segment metadata, force `talking_head` for any non-live content type:

```ts
// Derive content_type + render_style from the matched segment (join or metadata)
var briefContentType: string | null = contentType;
var renderStyle = "talking_head";
if (matchedSegment) {
  if (
    matchedSegment.content_catalog &&
    matchedSegment.content_catalog.content_type
  ) {
    briefContentType = matchedSegment.content_catalog.content_type;
  }
  if (matchedSegment.metadata && matchedSegment.metadata.render_style) {
    renderStyle = matchedSegment.metadata.render_style;
  }
}

// Override: render_style only applies to actual live performances. mine-live-
// signals.ts currently writes 'karaoke' onto segments regardless of content
// type, so guard against inheriting that on interview/podcast briefs.
if (briefContentType === "interview" || briefContentType === "podcast") {
  renderStyle = "talking_head";
}
```

That single override would have correctly tagged all 5 Malcolm Todd briefs as `talking_head`.

Also: backfill the 2 currently-mistagged briefs so the worker picks them up after step 1:

```sql
UPDATE fan_briefs
   SET render_style = 'talking_head'
 WHERE id IN (
   '4be213f7-f4bb-48ca-971e-6505976ddb3a',
   '7febf782-e8d8-4fbf-a5e4-8abd551b40da'
 );
```

(IDs are the two with `render_style='karaoke'` and `content_type='interview'` from today's batch — verify before running:
`curl … fan_briefs?artist_handle=eq.malcolmtodddd&render_style=eq.karaoke&select=id,hook_text`)

#### Structural (open an issue, don't fix in this session unless you have time to test on Boone live data too)

`scripts/fan-briefs/mine-live-signals.ts` should be content-type-aware. When run on segments whose source `content_catalog.content_type` is `interview` or `podcast`, it should NOT write `metadata.render_style='karaoke'` and should NOT set `metadata.live_venue`. The whole notion of "render_style" is a live-performance concern.

Either:

- **Make mine-live-signals.ts skip the karaoke detection branch** when the source video isn't `live_performance`. The talk-segment / chapter-snap logic still applies; just the song-detection path (`render_style='karaoke'` for chapters that look like song titles) shouldn't fire.
- **Or rename the script** and split: `mine-segments.ts` for the shared logic, `classify-render-style.ts` only for live content. Bigger refactor; defer.

Easier short-term move: gate the karaoke branch behind a check on the video's content_type, log a warning when skipped so we know which segments are getting the cleaner default.

## Verification (end-to-end happy path)

After all three fixes, run a single end-to-end test from the frontend, then SQL-verify backend state:

1. **Trigger an on-demand job from the frontend** (Paul will do this in a browser). He'll pick any artist with a podcast catalog (Malcolm Todd, Alex Warren, Benson Boone for live, etc.) and hit Create with count=2 or 3.
2. **Watch `/opt/wavebound-pipeline/logs/render-worker.log`** — within 60s of the on-demand worker finishing the 4-stage pipeline, you should see:
   ```
   [worker] Realtime: brief <uuid> approved, triggering render
   ...
   [worker] Render complete: <uuid> → fan-brief-clips/<handle>/rendered/<uuid>.mp4
   ```
   Multiple lines, one per renderable brief.
3. **SQL check**:
   ```sql
   SELECT id, hook_text, render_style, status,
          rendered_clip_url IS NOT NULL AS rendered
     FROM fan_briefs
    WHERE artist_handle = '<the test artist>'
      AND created_at > NOW() - INTERVAL '15 minutes'
    ORDER BY created_at DESC;
   ```
   Expect every `render_style='talking_head'` row to have `rendered=true` within ~5 minutes of the brief landing. Karaoke rows still defer (that's correct — v2 renderer not built yet).
4. **systemd survival check**: `sudo systemctl restart wavebound-render-worker.service` — confirm the unit comes back up automatically and processes any backlog. Then reboot the host (if Paul is OK with it; otherwise just a `kill -9` of the deno process and verify systemd revives it).
5. **Backfill check**: after step 1 of the patch + the SQL backfill from step 3, the 5 existing Malcolm Todd briefs should render too. Verify their `rendered_clip_url` populates within 5 minutes of the worker starting up.

## What could go wrong

- **Realtime publication on `fan_briefs`**: if the table isn't part of `supabase_realtime` publication, no events fire regardless of subscription filter. Confirm:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```
  If `fan_briefs` is missing: `ALTER PUBLICATION supabase_realtime ADD TABLE fan_briefs;`. (Same for `fan_brief_jobs`, but Paul mentioned that's already added.)
- **`event: "*"` syntax** may differ across `@supabase/supabase-js` versions. If the worker logs a subscribe error after the change, fall back to two channels or check the docs for the version pinned in `deno.lock`.
- **systemd `EnvironmentFile=` pitfalls**: the file must use `KEY=value` shell syntax, no `export`. If the worker logs `SUPABASE_SERVICE_KEY env var is required` on start, that's the cause.
- **`render-clip.ts` still requires** ffmpeg, yt-dlp, WhisperX, and Remotion installed on the worker host. Paul confirmed earlier those are present. If a render fails with a missing-binary error, that's the next thing to check before assuming the code is wrong.

## When complete

1. Reply to Paul with: systemd unit status, before/after rendered-vs-approved counts, and the verification SQL output.
2. Add a session diary in the backend repo: `docs/session-diaries/2026-04-XX_render-worker-revival.md`.
3. Open an issue (or todo entry in `docs/handoffs/`) for the structural fix to `mine-live-signals.ts` if you didn't ship it here.
4. Tell the frontend session: "render worker is up, INSERT events flow, the FE viewer modal will now play real edits." That's our cue to delete the temporary "render not ready" copy in the modal and just show the edit.

---

Questions before starting? Ask Paul. Otherwise: confirm worker is dead → write the unit → patch the subscription → patch generate-briefs.ts → backfill the 2 mistagged rows → verify with a fresh on-demand job.
