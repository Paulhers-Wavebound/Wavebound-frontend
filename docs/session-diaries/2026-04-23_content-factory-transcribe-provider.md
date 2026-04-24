# Content Factory — Transcription provider dropdown

## What changed

- `src/pages/label/ContentFactory.tsx`
  - Added `TranscribeProvider` type + `TRANSCRIBE_PROVIDER_OPTIONS`.
  - New `<select id="cf-transcribe-provider">` in the generate form, placed
    after the Artist MP3 field. Two options with explicit cost copy:
    - `audioshake` → "AudioShake — premium (~11¢/clip)" (default)
    - `whisperx` → "WhisperX — free (self-hosted)"
  - Added `transcribe_provider` to the `content-factory-generate` POST body
    (snake_case, exact literal `"audioshake" | "whisperx"`).
  - Per-user localStorage persistence keyed by Supabase user id
    (`cf:transcribe_provider:<uid>`). Hydrates on mount via
    `supabase.auth.getUser()`, writes on every change. Guarded by try/catch
    so disabled localStorage falls back to the default silently.
  - Extended `friendlyError()` so any `cf_jobs.error` starting with
    `audioshake_` or `whisperx_` is surfaced raw plus the hint
    "try the other provider and re-submit." The existing error banner in
    both `idle` and `polling` paths renders the result.
  - Fixed stepper to include the `lyrics_fixed` stage (T4.5 lyric-fix step
    shipped earlier today). Added `"lyrics_fixed"` to the `JobStatus`
    union, added a stepper row, and shifted downstream indices in
    `STAGE_ORDER` so the canonical chain
    `pending → ingested → decomposed → transcribed → lyrics_fixed → cast → rendering → done`
    is handled.

## Why

Backend landed 2026-04-23: `cf_jobs.transcribe_provider` column (NOT NULL,
default `'audioshake'`, CHECK on the two literal strings) +
`content-factory-generate` reads it from the POST body. UI needed a picker
so operators choose AudioShake (better quality) vs WhisperX (free) per job
with cost visible at the selection point. No auto-fallback — failures are
loud so the operator picks the remedy.

## What was tested

- `npx tsc --noEmit` — clean.
- No runtime verification from inside Claude Code; see browser section.

## What to verify in browser

1. Load `/label/content-factory` — dropdown renders with two options in the
   order above. Default selection is AudioShake.
2. Select AudioShake, submit a sombr TikTok. In Supabase SQL editor:
   ```sql
   SELECT id, transcribe_provider, status, created_at
   FROM cf_jobs ORDER BY created_at DESC LIMIT 1;
   ```
   Expect `transcribe_provider = 'audioshake'`. Stepper walks
   `ingested → decomposed → transcribed → lyrics_fixed → cast → rendering → done`.
3. Reload, switch to WhisperX, submit a different sombr clip. Same SQL
   check — expect `transcribe_provider = 'whisperx'`. Stepper walks the
   same chain. WhisperX server is up at
   `https://transcribe.soulbound.work/transcribe`.
4. Refresh the page — dropdown retains last selection (localStorage).
5. Loud-failure path: to test without breaking prod, temporarily edit a
   `cf_jobs` row to `status = 'error'`, `error = 'audioshake_task_400'`
   via SQL and re-poll; confirm the UI renders
   `audioshake_task_400 — try the other provider and re-submit.`

## While I was in here

Items I fixed without asking:

- Added `lyrics_fixed` stage to the stepper. The backend was already
  emitting it, but the UI union didn't list it, so `STAGE_ORDER[status]`
  was `undefined` for that tick and the stepper silently de-highlighted.

Items worth considering next, ranked by operator impact:

1. **Make the cost copy config-driven.** "~11¢/clip" is baked into the
   option label. When AudioShake pricing changes, the UI lies. Move to a
   `src/config/contentFactory.ts` export and have the dropdown read from
   it. ~15 min.
2. **Show the provider on the in-progress card.** Right now after submit
   you see artist + ref URL, but not which provider is running — if the
   job errors you have to remember what you picked. Surface
   `transcribe_provider` from the status endpoint and render a small tag
   next to the elapsed/cost block. Requires backend to include the field
   in the status response (it already reads the column, just needs to
   pass it through). ~20 min frontend + 1 line backend.
3. **Recent-jobs list on the same page.** Operators re-check their own
   past jobs constantly — a "Your last 10" strip below the form (handle,
   provider, status, cost, final URL if done) would kill the need to jump
   to Supabase studio. Scope: 1 query on `cf_jobs` filtered by
   `created_by = auth.uid()`, React Query keyed by user id.
4. **Per-provider cost running-total for the label.** Sum of
   `cost_cents` grouped by `transcribe_provider` for the last 30 days,
   shown once in a header. Tells ops whether they're burning AudioShake
   credits faster than they realize.
5. **Copy-job-as-curl developer affordance.** For debugging provider
   issues — a "copy curl" button on the error card that dumps the exact
   POST that produced the failure. Cheap, high leverage during the next
   provider outage.
