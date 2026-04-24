# Content Factory — Three backend issues surfaced during UI polling-resilience test

Found while verifying the UI fix for the `lyrics_fixed` stepper stall
(frontend repo, `docs/session-diaries/2026-04-24_content-factory-polling-resilience.md`).
UI is fine; these are backend problems worth fixing before they bite.

## Test jobs (read-only evidence)

| job_id                               | final status | dur  | note                                                                                                            |
| ------------------------------------ | ------------ | ---- | --------------------------------------------------------------------------------------------------------------- |
| 4e279f8a-88b4-491d-b34d-a9e7fbe00495 | done         | 229s | WhisperX path — sat at `transcribed` for ~140s before advancing. UI was correct; backend just took a long time  |
| 0429581e-1b6d-4fc5-add9-d01517811032 | done         | 297s | Was manually DB-flipped `lyrics_fixed → done` mid-test (UI skip-ahead verification). Ignore the duration        |
| 27094dc1-066d-4838-a379-05e167e2cdbc | done         | 236s | **Was DB-flipped to `error` mid-flight and backend kept advancing anyway — workers don't check terminal state** |
| 51a7785f-f7b1-4877-8434-a8b4d4a441cb | error        | 35s  | Hit `gemini_429` in `content-factory-generate.ts` or `lyric-fix.ts`                                             |

## 1. WhisperX → lyric-fix handoff is slow or not triggered

Symptom: job `4e279f8a-...` wrote `status='transcribed'` at t≈86s and
then sat there. No change for ~140s. Eventually reached `done` at t=229s
(so it recovered, but very late).

Likely cause: `content-factory-lyric-fix.ts` (T4.5) is invoked on a
trigger that isn't reliably firing for WhisperX runs, or it waits on a
condition that isn't satisfied by WhisperX's `lyric_timestamps` shape.

What to check:

- How is `content-factory-lyric-fix.ts` invoked? pg_notify, direct edge-fn
  call from `content-factory-transcribe.ts`, cron? Whichever trigger this
  is, confirm it fires for `transcribe_provider = 'whisperx'` rows.
- Diff the two write paths in `content-factory-transcribe.ts` —
  AudioShake vs WhisperX — specifically whether WhisperX populates the
  fields lyric-fix reads (probably `lyric_timestamps`, `song_title`).
- Job 4e279f8a had `lyric_timestamps IS NOT NULL` and empty
  `ref_metadata->>'song_title'`. If lyric-fix hard-requires
  `song_title`, that's the silent precondition failure.

## 2. Gemini 429 quota exhaustion

Symptom: job `51a7785f-...` errored at t=35s with
`gemini_429: Resource has been exhausted (e.g. check quota).` — full
message retained in `cf_jobs.error`.

Likely cause: the Gemini API key tied to the project has hit its per-minute
or per-day quota. Content Factory is ingesting/parsing TikTok refs and
calling Gemini somewhere early in the pipeline (probably song-title
extraction in `content-factory-generate.ts` or the Genius reconciliation
in `content-factory-lyric-fix.ts`).

What to do:

- Check GCP Gemini quota dashboard for the project's key.
- Add exponential backoff retry (1s → 2s → 4s, max 3 attempts) for the
  429 specifically — most 429s clear within a minute.
- If quota is the real ceiling, request a quota bump OR fall back to a
  cheaper model (Flash) for this particular call.
- Front-end now renders any `gemini_*` or `audioshake_*`/`whisperx_*`
  error as-is; adding `gemini_429` to `friendlyError()` in
  `ContentFactory.tsx` would make the operator-facing copy clearer
  ("Gemini is rate-limited — try again in a minute or switch providers").
  Currently it dumps the raw JSON.

## 3. Workers don't check terminal status before advancing

Symptom: I manually `UPDATE cf_jobs SET status='error'` on job
`27094dc1-...` while the backend was processing it. Subsequent workers
(`content-factory-cast.ts`, `content-factory-render.ts`, the creatomate
webhook handler) kept writing and eventually set the row back to
`status='done'`. A terminal `error` was silently clobbered.

This matters because:

- If a real backend worker crashes and writes `error`, a later worker on
  the same row can wipe that signal. Debugging a failure becomes
  impossible — the row just shows `done` with no hint of the blip.
- Any external intervention (operator, support, automation that forces a
  retry by writing `pending`) is equally unsafe.

What to fix:

- Each worker should read `cf_jobs.status` before writing and bail if
  it's already in a terminal state (`'done'` or `'error'`).
- Prefer an optimistic-concurrency `UPDATE ... WHERE status = :expected`
  pattern so the DB, not the worker, enforces the invariant.
- For the creatomate webhook specifically: if the row is already
  `status='error'` by the time the render webhook lands, keep the error
  (don't overwrite to `done`) and log a warning.

## Constraints

- Do not touch the frontend. The UI work is complete — see
  `src/pages/label/ContentFactory.tsx` on the frontend repo's `main`
  branch at commit landing today.
- Keep the canonical chain
  `pending → ingested → decomposed → transcribed → lyrics_fixed → cast →
rendering → done` intact. The UI enum is locked to this sequence; any
  new state needs a frontend coordination.
