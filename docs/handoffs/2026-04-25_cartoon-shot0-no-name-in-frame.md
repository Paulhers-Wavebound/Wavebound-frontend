# Cartoon shot 0 — drop "name in frame" rule + require shot 0 to succeed

**Repos:** `wavebound-backend`
**Files:**

- `edge-functions/content-factory-cartoon-art-director.ts` (prompt change)
- `scripts/content-factory/cartoon-image-worker.ts` (worker guard)

**Priority:** High — every cartoon currently ships with a blank opening
frame because shot 0 is reliably blocked by gpt-image-2 safety, and the
worker silently lets the cartoon ship anyway.

## Symptom

Live run today: `cartoon_scripts.id = 0122bceb-7f68-4a06-b7ee-aec33e16e8fa`
("EVERYONE LAUGHED AT ADDISON RAE") shipped a complete MP4 at
`https://f002.backblazeb2.com/file/creatomate-c8xg3hsxdu/734837ab-…mp4`,
but the first frame is blank. Per-shot status:

```
seg  0 | failed   | url=NO  | OpenAI edits 400: "Your request was rejected by the safety system."
seg  1 | complete | url=YES
seg  2 | complete | url=YES
… (segs 3–11 all complete)
```

11 of 12 shots OK, 1 failed — and the one that failed is the only one
that matters narratively (the hook frame).

## Root cause

The art-director system prompt mandates that shot 0 spell the artist's
**real name** in-image (album cover, tour poster, magazine cover, etc.)
on top of the artist's likeness from the reference photo. gpt-image-2's
safety filter blocks the combination of a real-person likeness +
identifying name in the same image — celebrity-likeness protection.

Shots 1–11 only carry the likeness (no name), which is why they pass.

Worker compounds this: `processJob` line 485 has

```ts
var finalStatus = allDone ? "complete" : anyDone ? "complete" : "failed";
```

…so a single successful shot is enough to ship the cartoon. The hook
frame failure is treated as cosmetic.

Paul's call after seeing the result: stop trying to render the artist's
name in-frame. The likeness from the reference photo is enough; the
hook caption is already burned in by the Creatomate editor in post (the
prompt itself acknowledges this on line 67).

## Fix

### Part 1 — `content-factory-cartoon-art-director.ts`

Two prompt edits.

**Edit 1.1 — line 68:** replace the cross-cutting rule that grants shot
0 a text exception with a uniform "no text anywhere" rule.

Replace:

```
- Shot 0 (the hook moment) is the ONLY shot where readable in-image text is allowed — and it must spell the ARTIST'S NAME (see SHOT 0 RULES below). Every other shot: NO text, lyrics, numbers, signage, or readable typography. All on-screen captions are burned in by the editor in post.
```

with:

```
- NO readable in-image text on any shot — no names, lyrics, numbers, signage, or readable typography. The hook caption (artist name + hook) is burned in by the Creatomate editor in post over a clean illustrated backdrop.
```

**Edit 1.2 — replace the entire SHOT 0 RULES block (lines 72–85)** with
a version that keeps the "movie poster, not establishing shot" energy
but drops the name-in-frame requirement.

Replace lines 72–85 verbatim with:

```
═══════════════════════════════════════
SHOT 0 RULES — THE HOOK MOMENT (FIRST 2 SECONDS)
═══════════════════════════════════════
Shot 0 owns the most important real estate in short-form video. Treat it like a movie poster, not a documentary establisher:
- The artist is the hero — striking pose, dramatic angle, cinematic light. Make the viewer stop scrolling.
- NO text, name, or signage in the image. The artist name and hook caption are burned in by the editor in post over the bottom quarter; do not render them in the illustration.
- Lean into bold composition: forced perspective, low or canted angles, theatrical lighting. The hook line decides the mood — pick a pose that visually argues the hook before the viewer even reads the caption.
- The artist's face must be visible enough to anchor recognition — three-quarter or front, not a back-of-head shot.
- Keep stylization: cartoon-comic illustration, not photorealism. Same locked visual signature as every other shot — no exceptions.
```

(No need to "override the no-readable-signage line" anymore — it now
applies uniformly to every shot, which is also simpler downstream.)

### Part 2 — `cartoon-image-worker.ts`: require shot 0 to succeed

Currently the finalize block (line 482–494) treats any successful shot
as enough. Add a shot-0 guard.

After the rendering loop produces `results` (around line 481), find
shot 0's outcome:

```ts
var shot0Ok = results.some((r) => r.ok && r.shot_index === 0);
```

(If results don't carry `shot_index`, derive it from the `shotPlan.shots`
ordering — assume `results[i]` corresponds to `shotPlan.shots[i]`. Worth
double-checking how results are ordered — if they're ordered by
`shot_index` ascending, `shot0Ok = results[0]?.ok` works. Otherwise use
the per-row lookup.)

Then change line 485:

```ts
var finalStatus = allDone ? "complete" : anyDone ? "complete" : "failed";
```

to:

```ts
var finalStatus = allDone || (anyDone && shot0Ok) ? "complete" : "failed";
```

And mirror the script-status update on line 492:

```ts
await setScriptStatus(
  scriptId,
  allDone || (anyDone && shot0Ok) ? "images_complete" : "images_failed",
  {
    images_completed_at: allDone || (anyDone && shot0Ok) ? nowIso : null,
    ...(allDone || (anyDone && shot0Ok)
      ? {}
      : {
          error_message: shot0Ok
            ? lastShotError || "All shots failed to render"
            : "Hook frame (shot 0) failed — required for cartoon to ship",
        }),
  },
);
```

(Optionally extract `var canShip = allDone || (anyDone && shot0Ok)` to
clean up the repetition.)

This way: future shot-0 failures cleanly mark the script `images_failed`
with a clear reason, instead of shipping a cartoon with a blank opener.

## Test plan

1. **Prompt change:** `deno check edge-functions/content-factory-cartoon-art-director.ts`,
   then `supabase functions deploy content-factory-cartoon-art-director --project-ref kxvgbowrkmowuyezoeke`.
2. **Worker change:** `deno check scripts/content-factory/cartoon-image-worker.ts`,
   commit + rsync to Hetzner (same path as
   `2026-04-25_cartoon-image-worker-error-pipe-and-retry.md`).
3. **End-to-end:** generate a fresh cartoon for any artist (Paul will do
   this from `/label/content-factory-v2?tab=create`). Confirm:
   - Shot 0 renders successfully (no safety block — it no longer asks
     for the artist name in-image).
   - Final video opens with a real first frame.
4. **Negative path verification:** if any future cartoon's shot 0 still
   fails (e.g., transient API error), confirm the script lands at
   `images_failed` with a populated `error_message` instead of shipping
   a blank-opener cartoon.

## Frontend side (no changes needed)

Today's reconciler already treats `images_failed` as terminal and
synthesizes a stage-specific label. Once Part 2 ships, a future shot 0
failure will surface in Review as a red banner with the actual reason.

## Recovery for the existing broken cartoon

`cartoon_scripts.id = 0122bceb-7f68-4a06-b7ee-aec33e16e8fa` already
shipped to MP4. Easiest recovery: dismiss it from Review via the kill
flow and regenerate from the wizard once the prompt + worker are
deployed. The new prompt should produce a clean shot 0 on the first
attempt.

## Cross-reference

- Live blocked prompt:
  `cartoon_image_assets` row with `script_id =
0122bceb-7f68-4a06-b7ee-aec33e16e8fa AND segment_index = 0`
- Frontend session diary today:
  `docs/session-diaries/2026-04-25_cartoon-n1-cap-elevenlabs-concurrency.md`
- Prior backend handoff (image-worker error plumbing + retry):
  `docs/handoffs/2026-04-25_cartoon-image-worker-error-pipe-and-retry.md`
