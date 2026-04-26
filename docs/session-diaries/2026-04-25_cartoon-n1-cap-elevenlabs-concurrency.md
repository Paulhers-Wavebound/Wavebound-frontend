# 2026-04-25 — Cartoon wizard N=1 cap (ElevenLabs concurrency)

## What changed

- `src/components/content-factory-v2/CartoonPanel.tsx` — `MAX_COUNT` lowered
  from 10 to 1. Inline comment explains why so the lift-condition is
  obvious. Cost-preview block now ends with a one-line user-visible note
  ("Single cartoon per run while we're on the ElevenLabs 5-concurrent
  tier").

## Why

Run #3 verification (after OpenAI top-up) made it to terminal cleanly on
Cartoon 1 (`0122bceb-…`, hook "EVERYONE LAUGHED AT ADDISON RAE",
[final mp4](https://f002.backblazeb2.com/file/creatomate-c8xg3hsxdu/734837ab-e954-4ab4-a253-4ece2df31f85.mp4)),
but Cartoon 2 (`72c36c0d-…`) failed with `vo_failed` /
`error_message: null` on `cartoon_scripts`.

Real cause was on `cartoon_vo_clips.error_message`:

```
ElevenLabs 429: concurrent_limit_exceeded
"maximum of 5 concurrent requests"
```

Each cartoon fires `RENDER_BATCH_SIZE = 5` parallel TTS requests
(see `wavebound-backend/edge-functions/content-factory-cartoon-vo.ts:24`).
Two cartoons = 10 concurrent = guaranteed 429s on the current ElevenLabs
plan. The function already retries 429s (3 attempts, 6s total backoff)
but the other cartoon keeps hammering during the backoff window so the
retries also 429. One failed clip → `failCount > 0` path → whole script
flips to `vo_failed`.

Capping the wizard at N=1 stops the contention at the source until one
of the real fixes lands.

## What was tested

- `npx tsc --noEmit` — clean.

## What to verify in browser

- Cartoon panel now shows only the "1" chip; cost preview reads "~$8 × 1
  = ~$8" with the concurrency note below.
- The existing in-flight cartoon (`0122bceb-…`) still renders correctly
  in Review through the inline player.

## Lift conditions

When one of the following lands, raise `MAX_COUNT` back to 10:

- ElevenLabs subscription upgraded to Pro tier (10 concurrent), OR
- `RENDER_BATCH_SIZE` lowered to 2 in
  `wavebound-backend/edge-functions/content-factory-cartoon-vo.ts` and
  the function redeployed (slows VO ~3× per cartoon but allows
  `2 cartoons × 2 concurrent = 4 ≤ 5`).

Either fix unblocks N>1; the wizard cap is only a guard rail, not a
load-bearing constraint.

## Open backend handoffs (related)

- `content-factory-cartoon-vo` has the same silent-failure bug yesterday's
  image worker had: it sets `cartoon_scripts.status='vo_failed'` without
  ever writing `cartoon_scripts.error_message` (the per-clip error is on
  `cartoon_vo_clips.error_message` only). Frontend reads the script row,
  so the failure reason is invisible. Mirror the image-worker fix
  pattern: aggregate the first/last failed clip's `error_message` and
  pass it as an `extra` field to the `vo_failed` update at
  `edge-functions/content-factory-cartoon-vo.ts:527`. Deferred since the
  N=1 cap removes the immediate failure mode.

## While I was in here, recommendations

1. ElevenLabs Pro at $99/mo is the cleanest unblocker if cartoons are a
   real product line — single payment lifts the cap permanently and lets
   the original N=10 wizard come back.
2. If cartoons stay experimental, the backend `RENDER_BATCH_SIZE = 2`
   change is free and supports N=2 reliably (just slower).
3. Consider a UI option to "queue more cartoons" that runs them
   sequentially client-side once N>1 is allowed again — sidesteps the
   provider-concurrency math entirely.
