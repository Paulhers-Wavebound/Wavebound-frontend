# Fan-brief on-demand pipeline — production hardening

## Why

Earlier in this session we caught a real production-shaped bug: an Addison Raé
job completed at 07:33 UTC but ten placeholders sat at "Queued — worker picks
up within 60s." for two hours because Realtime missed the UPDATE. We fixed it
with a SUBSCRIBED catch-up + 15s polling fallback + visibility-change refetch
in `ContentFactoryV2.tsx`. That closed the immediate hang.

This pass addresses everything else a senior engineer would flag in a
pre-prod review of the on-demand fan-brief flow:

- **A.** Refresh resilience — a hard refresh during a 4-min run no longer
  loses the placeholders, the per-job toast, or the partial-count message.
- **B.** Stale-job timeout — placeholders flip to red after 20 min so a
  crashed worker can't strand the UI.
- **1.** POST request gets a 15s `AbortController` timeout; `try/catch/finally`
  guarantees `isCreating` re-enables on any failure path.
- **2.** `fetchAndReconcileJob` no longer swallows errors silently. After 3
  consecutive read failures the placeholders fail with a refresh prompt.
- **3.** Realtime subscribe-error statuses (`CHANNEL_ERROR`, `TIMED_OUT`,
  `CLOSED`) are logged so degraded WS connections show up in DevTools.
  Polling already covers correctness.
- **4.** Reconcile is idempotent — a `settledJobsRef` set blocks the
  Realtime + poll + visibility-refetch triple from triple-toasting and
  re-mutating the queue on terminal state.
- **5.** Every terminal-state `setQueue` first checks that a generating
  placeholder still exists for the job; concurrent reconciles become no-ops.
- **6.** `approvedBriefsQuery` now refetches every 30s and the merge effect
  patches existing items by `fanBriefId` instead of skipping them — so a
  brief approved 30s ago picks up its `renderedClipUrl` (and any
  `modified_hook` updates) without a page refresh.
- **7.** `BriefViewerModal` handles `<video>` `onError`. A 404 on the
  storage bucket / CORS / codec rejection swaps in a fallback panel with the
  YouTube source CTA instead of leaving the user on a black frame.
- **8.** `handleCreate` retries once on 401 after `supabase.auth.refreshSession()`.
  If the retry also 401s, the toast tells the user to log out and back in
  rather than the generic "Request failed (401)".
- **9.** `produced_brief_ids` is parsed defensively (`Array.isArray` + filter
  to strings) instead of cast and prayed for.
- **10.** Channel cleanup logs a warning at unmount if anything's left in
  `channelsRef` — that's a leak signal worth seeing.

## What changed

- `src/pages/label/ContentFactoryV2.tsx`
  - New `activeJobsQuery` (`useQuery`) pulling in-flight `fan_brief_jobs`
    rows for the label, capped to 10 jobs created within the last hour.
  - New effect that prepends `requested_count` placeholders per job whose
    `fanBriefJobId` isn't already in the queue.
  - `approvedBriefsQuery`: `staleTime: 30_000`, `refetchInterval: 30_000`.
  - Merge effect: two-pass — patch existing items by `fanBriefId` (renderedClipUrl,
    sourceUrl, thumbnailUrl, title only when changed), then prepend new
    briefs.
  - `reconcileJobUpdate`: defensive parse of `produced_brief_ids`, 20-min
    stale-job timeout at the top, idempotent terminal check via
    `settledJobsRef`, race-guarded terminal `setQueue` branches.
  - `fetchAndReconcileJob`: selects `created_at` (so the timeout check
    works), tracks per-job consecutive errors via `jobErrorCountsRef`, fails
    placeholders after 3 strikes.
  - Subscribe callback logs non-`SUBSCRIBED` statuses.
  - Unmount-only cleanup effect now logs if it finds anything to drain.
- `src/components/content-factory-v2/CreateView.tsx`
  - `handleCreate`: extracted `postOnce(accessToken)` helper using
    `AbortController` with a 15s timeout. 401 path runs `refreshSession()`
    and retries once before surfacing failure.
- `src/components/content-factory-v2/ReviewView.tsx`
  - `BriefViewerModal`: `videoError` state, `onError` handler, and a
    failure variant of the existing fallback panel ("Couldn't load the
    rendered clip — view source on YouTube"). State resets when
    `renderedClipUrl` changes so a re-render with a fresh URL gets one
    re-attempt.
  - Added `useRef` to the React import.

## What was tested

- `npx tsc --noEmit` clean.
- `npm run build` green (production bundle generated, only the existing
  three-vendor / index chunk-size warnings).

## What to verify in browser

The following all need Paul's eyes — most of them require a real on-demand
job or RPC fixture:

1. **Refresh resilience (A):** start a 5-brief @addisonre run → wait 30s →
   hard refresh → placeholders return with the right artist + count, stage
   text reflects current `current_stage`, and they reconcile to `pending`
   when the worker finishes.
2. **Stale-job timeout (B):** seed (or wait on) a `fan_brief_jobs` row at
   `status='queued'` whose `created_at` is >20 min old → open Review →
   placeholders flip to "Job timed out" within one poll cycle.
3. **POST timeout (1):** DevTools → Offline → click Create → toast within
   15s, button re-enables.
4. **3-strike fetch fail (2):** simulate (e.g., temporarily revoke RLS on
   `fan_brief_jobs`) → after ~45s the placeholders flip to "Job status
   unreachable".
5. **Idempotent toast (4):** start a real job → after the worker sets
   `status=complete`, switch tabs and back → only one "X briefs ready"
   toast.
6. **Live render refresh (6):** approve a brief whose render hasn't run
   yet → leave the tab open → when the render-worker writes
   `rendered_clip_url`, the modal picks it up on the next 30s tick (open
   the modal after to see it play, no refresh required).
7. **Video fallback (7):** in DevTools, intercept a `fan-brief-clips` URL
   with a 404 → the modal's fallback panel renders with the YouTube CTA.
8. **Regression:** `/label/fan-briefs` and `/label/content-factory` (v1)
   unchanged.

## Follow-ups also shipped this turn

After the initial 12 items, Paul asked for the remaining "while I was in here"
items.

### Cartoon path hardening

Subset of the same checklist applied to the cartoon Realtime flow:

- **45-min stale-cartoon timeout** in `fetchAndReconcileCartoonById` —
  cartoons take 15-20 min, so 45 minutes of no progress is a dead run. Marks
  the item failed with a friendly message instead of leaving the user on a
  stuck spinner.
- **Subscribe-error logging** on both cartoon channels (script-watch +
  chat-job-watch) — `console.warn` for `CHANNEL_ERROR` / `TIMED_OUT` /
  `CLOSED`. Polling already covers correctness.
- **`console.error` on supabase reads inside `reconcileCartoonItem`** —
  `chat_jobs`, `cartoon_scripts`, `cartoon_videos`. Previously silent.
- **Unmount drain warning** added to the cartoon cleanup effect to match
  the fan-brief side.

Skipped from the cartoon sweep (deliberately):

- **Idempotent reconcile via settled-set** — already structurally idempotent
  because `reconcileCartoonItem` early-returns when `item.status !== "generating"`.
  No toast at the reconcile call site, so no double-toast risk.
- **Defensive parse of array payloads** — no array columns in cartoon's
  reconciliation path.
- **3-strike fetch fail** — each stage has its own error path that flips
  the item to failed; piling another retry counter on top would obscure
  legitimate failures.

### Real handleApproveSchedule wired to fan_briefs

`handleApproveSchedule` now persists the schedule for fan-brief items:

- **Schema:** `fan_briefs` has no `scheduled_for` column and `'scheduled'`
  isn't a valid value of the `status` check constraint. Rather than
  migrate (out of scope for hardening), the slot is stashed in the existing
  `generation_context jsonb` field as `{ scheduled_for: <slot> }`.
- **Optimistic update + revert on backend failure.** Read existing
  `generation_context`, merge `scheduled_for`, write back via
  `supabase.from('fan_briefs').update(…)`. On error, the local QueueItem
  reverts to `pending` and a destructive toast surfaces the message.
- **Refresh resilience.** The `approvedBriefsQuery` now selects
  `generation_context` too. The merge effect adopts the persisted slot:
  patches existing items from `pending → scheduled` when the slot lands,
  and prepends fresh briefs at `status='scheduled'` directly when a row
  has a slot. Local kills aren't resurrected — only `pending` items adopt
  the persisted slot.
- **`FanBrief` type extended** in `src/types/fanBriefs.ts` with the typed
  `generation_context` shape.

The slot string itself is still the mock `mockScheduleSlot()` value
(`"Mon · 9:00 am"`-shaped). When the v1 release-cadence engine ships, swap
`mockScheduleSlot()` for the real one — the persistence path is the only
piece that needed to be real for refresh resilience to work.

## Items still deferred

- **The four LOW-severity audit items** from the plan (per the original
  scope decision): jobId-stale-after-settle window, kill-while-network-slow
  ordering, modal-stale-on-item-swap, labelId remount race. None
  user-visible today; revisit if anyone hits them.
- **v1 release-cadence engine.** `handleApproveSchedule` writes a mock
  slot string for now — actual scheduler integration is a separate ticket.
- **Migration to a real `scheduled_for` column on `fan_briefs`** with
  `scheduled` added to the status check constraint. Worth doing alongside
  the v1 scheduler so queries can `WHERE scheduled_for IS NOT NULL` instead
  of jsonb-extracting.
