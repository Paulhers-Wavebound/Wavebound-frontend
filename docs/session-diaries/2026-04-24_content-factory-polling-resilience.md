# Content Factory — Polling stepper resilience (lyrics_fixed stall fix)

## What changed

- `src/pages/label/ContentFactory.tsx`
  - `JobStatus` union now includes `"lyrics_fixed"`; `STAGES` and
    `STAGE_ORDER` both carry the new row at rank 3. The canonical chain
    `pending → ingested → decomposed → transcribed → lyrics_fixed → cast →
rendering → done` is the single source of truth and matches the backend
    edge-fn writer chain.
  - Added `isKnownStatus(s)` type guard. The poll tick `console.warn`s on any
    status the UI doesn't recognise, so the next new backend state surfaces
    loudly instead of silently stalling the stepper.
  - Stepper comparison is now ordinal rank-based (`i <= currentIdx` for past,
    `i === currentIdx + 1` for in-flight). Fixes hypothesis #1 in the
    handoff: a fast backend run that jumps `lyrics_fixed → done` in one poll
    interval now correctly promotes every intermediate row instead of
    leaving `cast`/`rendering` grey forever.
  - On terminal (`done`/`error`) the displayed elapsed is now
    `updated_at - created_at` from the status response, not the client-side
    `setInterval` tick. Defends against a class of bug where the tick
    interval somehow stays alive and the timer kept ticking to 18:21 while
    the job had been done for 14 minutes.
  - Error state tracks the failed stage via a `lastNonTerminalRef` and a new
    `failedStageIdx` piece of state. Stepper renders the red `X` + inline
    `errorMsg` on that row (via `friendlyError()`), with every other row
    grey. No green checks appear on `error`, matching the handoff's
    constraint #5.
  - `resetAll` and `handleSubmit` reset the new ref + state so back-to-back
    generations don't leak prior failure context.

## Why

Reported bug (from backend repo `docs/prompts/content-factory-polling-stuck-frontend.md`):
`/label/content-factory` was freezing on **Lyrics fixed** with a 18:21
timer while the backend had long since written `status = 'done'` and a
valid `final_url` — a UI-only poll/reconcile bug introduced when backend
landed `lyrics_fixed` (commit `fbc5604`) and the UI enum drifted.

Root cause (pre-fix): `JobStatus` and `STAGE_ORDER` didn't carry the
`lyrics_fixed` literal. Every poll that returned `lyrics_fixed` became a
no-op for stepper rendering (`STAGE_ORDER["lyrics_fixed"] === undefined`),
and because the stepper's previous "completed" check was `i < currentIdx`,
a skip from `lyrics_fixed` to `done` wouldn't have promoted the
intermediate rows either (hypothesis #1).

The fix repairs the immediate stall and closes off the neighbouring
failure modes: defensive status guard, ordinal rank, backend-authoritative
elapsed, and explicit failed-row rendering.

## What was tested

- `npx tsc --noEmit` — clean.
- Playwright MCP against `localhost:8080`:
  1. Fresh WhisperX job fired; stepper walked `ingested → decomposed →
transcribed` live — each row flipped green as backend advanced, next
     row showed the spinner.
  2. DB-level skip simulated (`UPDATE cf_jobs SET status='done', ...
final_url=...`) from `lyrics_fixed` straight to `done`. UI
     transitioned to the result view within one poll (3s). Elapsed shown
     `3:29` matched backend `updated_at - created_at = 209s` exactly. Cost
     updated to `$0.42`. Skip-ahead hypothesis #1 confirmed fixed.
  3. Error path: fresh job DB-flipped to `status='error',
error='audioshake_task_400'` (backend then overwrote with its own
     `gemini_429` error — that's the real poll output). UI correctly
     rendered: red `X` on the Ingested row, friendly error text inline
     below the label, every other row grey with its number, timer frozen
     at `0:14`, cost `$0.00`, `Start over` button rendered.
  4. Interval-leak check: network tab totalled 6 `content-factory-status`
     GETs across a 42s lifespan. After the error poll, zero further GETs
     for another 20 seconds — `clearTimers()` cleanly stopped both
     `pollRef` and `tickRef`.

## What to verify in browser

Nothing else — the path was exercised end-to-end live. One note: an
earlier test showed 13 polls when I edited the file while a job was in
flight (HMR fast-refresh left a stale interval). Won't repro on real user
sessions (no HMR), but if you ever see phantom polls during local dev,
that's the cause.

## Backend bugs surfaced during the test (not touched — sent to backend todo)

See `docs/handoffs/2026-04-24_content-factory-backend-followups.md`.

1. WhisperX → lyric-fix handoff stalls then recovers late. Job
   `4e279f8a-88b4-491d-b34d-a9e7fbe00495` sat at `transcribed` for ~140s
   before advancing; eventually hit `done` at 229s total. Suggests
   `content-factory-lyric-fix.ts` isn't being invoked immediately after
   WhisperX writes `transcribed` — probably a missing trigger or a
   provider-conditional path.
2. Gemini 429 quota exhaustion in the generate/lyric-fix path. Job
   `51a7785f-f7b1-4877-8434-a8b4d4a441cb` errored with `gemini_429:
Resource has been exhausted`. Need to check GCP quota on the project's
   Gemini key, or add retry/backoff + a user-facing friendlyError entry.
3. Backend workers keep writing status updates even after the row is at
   `status='error'`. I manually flipped `27094dc1-...` to `error` and
   backend workers raced it back through `cast → rendering → done`.
   Workers should check the current status is still non-terminal before
   advancing — otherwise a terminal `error` can be silently clobbered.

## While I was in here

- Verified `cf:transcribe_provider:<uid>` localStorage persists across
  reloads (the Apr 23 feature — still working).
- Noticed no session persistence for the active job: reloading
  `/label/content-factory` mid-generation loses the stepper progress.
  Stretch goal listed in the original handoff. Not done here — scope it
  as a follow-up if operators are reloading mid-generation and complaining.

### Items worth doing next, ranked by operator impact

1. **Persist active `job_id` in sessionStorage** and rehydrate the
   stepper on mount. Prevents "I refreshed and lost the job" confusion.
   ~30 LOC; safe even without backend changes.
2. **Stale-status banner.** If `cf_jobs.updated_at` is > 10 min old while
   UI is non-terminal, render "This job may be stuck — check the server."
   Requires `updated_at` to already be in the status response (it is).
   Makes future backend stalls obvious without needing another bug report.
3. **Surface `transcribe_provider` on the in-progress card.** Needs a
   one-line backend change (add `transcribe_provider` to the status
   response). When AudioShake errors, operators currently have to remember
   which provider they picked.
4. **Cost copy config-driven** (`~11¢/clip` hardcoded in the dropdown
   label will drift when AudioShake pricing changes).
5. **Copy-as-curl button on error cards** for faster provider debugging.
