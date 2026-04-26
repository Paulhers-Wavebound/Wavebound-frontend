# 2026-04-24 — Fan-brief on-demand: frontend wire-up

## What changed

Hooked the Content Factory v2 fan-brief wizard to the new backend endpoint Paul shipped this morning. "Create" now POSTs to `fan-briefs-generate-on-demand`, gets back a `jobId`, drops N placeholder cards into the Review queue, and Realtime-reconciles them as the four-stage pipeline progresses on Hetzner.

**Before:** wizard's Create button bulk-approved pre-existing pending briefs (filter, then UPDATE status='approved'). Disabled when 0 matching briefs.

**After:** wizard's Create button triggers a fresh pipeline run. No dependency on pre-seeded briefs — the wizard works from a cold start.

## Files modified

- `src/components/content-factory-v2/types.ts`
  - `QueueStatus` extended: `"generating" | "pending" | "scheduled" | "failed"`.
  - `QueueItem` gets `fanBriefJobId`, `jobIndex`, `jobStage`, `jobError` for in-flight tracking.

- `src/components/content-factory-v2/CreateView.tsx`
  - Dropped `pendingBriefsQuery` (and `BRIEFS_SELECT`, `pendingBriefsQueryKey`, `useQuery`, `useQueryClient`, `FanBrief` import). The wizard no longer reads from `fan_briefs` at all — it only POSTs.
  - Dropped `livePendingBriefs`, `usingLiveBriefs`, `filteredBriefs`, `totalMatches` and the in-memory filter logic.
  - `handleCreate` rewritten: gets the user's session JWT, POSTs `{ labelId, artistHandle, source, count }` to `/functions/v1/fan-briefs-generate-on-demand`, surfaces 429 / 403 / 400 errors as toasts with friendly copy.
  - On 202 response, hands `{ jobId, count, artistHandle, source }` to the parent via the new `onCreateJob` prop (renamed from `onBulkCreate`), which builds the placeholders.
  - Wizard gating flipped from `usingLiveBriefs` (had pending briefs in DB) → `labelId` (has a label scope). Mock fallback only fires for Paul-only sessions.
  - Helper text + Field labels updated: no more "(M available)" / "No matching briefs yet" — the wizard always works.
  - `handleGenerate` + `buildMockTitle` simplified: dropped the live-brief branch since live briefs no longer flow through that path.

- `src/pages/label/ContentFactoryV2.tsx`
  - `handleBulkCreate` replaced with `handleCreateJob({ jobId, count, artistHandle, source })` that builds N placeholder QueueItems with `status='generating'`, `fanBriefJobId`, `jobIndex 0..N-1`, and prepends them to the queue.
  - Added the Realtime reconciliation effect. A `useRef<Map<string, RealtimeChannel>>` tracks one channel per in-flight `jobId`. The effect re-runs on queue changes, subscribes to newly-active jobs, and tears down channels for jobs that have settled.
  - `reconcileJobUpdate(jobId, row)` handles each `UPDATE` event:
    - `discovering | mining | synthesizing` → updates `jobStage` text on every placeholder for that job.
    - `complete` with briefs → fetches `fan_briefs` rows in `produced_brief_ids`, swaps each placeholder by `jobIndex` for a real "pending" QueueItem (with the brief's hook + handle), drops surplus placeholders if the pipeline produced fewer briefs than requested.
    - `complete` with zero briefs → flips placeholders to `status='failed'` with a friendly message.
    - `failed` → flips placeholders to `status='failed'` with `error_message`.
  - Unmount cleanup removes every channel.
  - Added `statusFallbackLabel(status)` for friendly stage copy when the worker hasn't set `current_stage` yet.

- `src/components/content-factory-v2/ReviewView.tsx`
  - `tabItems` filter expanded: the Pending sub-tab now surfaces `pending | generating | failed` in one list. (Scheduled sub-tab unchanged.) Pending count badge reflects the same union.
  - `reviewTab` state narrowed to `"pending" | "scheduled"` — no standalone tabs for generating/failed.
  - QueueCard re-rendered for the three pending sub-states:
    - **Generating**: spinner thumb, accent left-border, `Generating` chip, jobStage text below the title with a small spinner, no Approve / Tune buttons (kill becomes "Cancel").
    - **Failed**: red triangle thumb, red left-border, `Failed` chip, error text in red, no Approve, kill becomes "Dismiss".
    - **Pending** (real briefs): unchanged from before.

## Frontend ↔ backend contract

The contract Paul published in `wavebound-backend/docs/features/fan-briefs-on-demand.md`, mirrored here:

```
POST  /functions/v1/fan-briefs-generate-on-demand
Bearer <session JWT>
{ labelId, artistHandle, source: "live_performance" | "podcasts", count: 1..20 }
→ 202 { jobId, status: "queued" }

Realtime: fan_brief_jobs (filter id=eq.<jobId>) UPDATE events
  status:               queued → discovering → mining → synthesizing → complete | failed
  current_stage:        human-readable progress label
  produced_brief_ids:   uuid[] (set on complete)
  error_message:        string | null (set on failed)
```

Briefs land at `status='approved'` (NOT pending) — the wizard's intent replaces the pending-review step. So when the frontend reconciles a placeholder it flips it to `pending` _in the QueueItem sense_ (factory-v2's review-tab ready-to-schedule state), not `pending` in the fan_briefs table.

## What was tested

- `npx tsc --noEmit` — clean.
- `npm run build` — production build green (9.35s, no new warnings).
- Reasoned through state flows:
  - POST 202 → placeholders appear in Review with `Queued — worker picks up within 60s.` text.
  - Subsequent UPDATE events flip jobStage; user sees pipeline progress live.
  - Complete with 5 briefs → 5 placeholders swap to real cards with hook text.
  - Complete with 3 of 5 briefs → 3 swap, 2 placeholders drop, toast shows the partial count.
  - Failed → all placeholders for that job go red with error text.
  - Multiple concurrent jobs → independent channels, independent reconciliation.
  - Component unmount → all channels removed via the unmount effect.
  - 429 cooldown → friendly toast "Already running for this artist + source. Wait a minute and retry."

## What to verify in browser (Paul's eyes)

**Blocker:** ScrapeCreators is out of credits per Paul's note. Until topped up, every test job will fail at Stage 1 with "Looks like you're out of credits". That actually verifies the failed-state path end-to-end (POST → placeholder → Realtime → red card with the SC error message), but won't show the happy path.

After SC top-up:

1. **Columbia / scoped session** at `/label/content-factory-v2`:
   - Create tab → **Fan brief edit** preset → wizard appears (no longer requires existing pending briefs).
   - Pick `@alexwarren` (or any artist with podcast appearances) → **Podcasts** → 3 clips → **Create**.
   - Toast: `Discovering 3 podcast briefs for @alexwarren — pipeline runs 3–8 min.`
   - View flips to Review tab. 3 placeholder cards visible with spinner + "Queued — worker picks up within 60s."
   - ~60s later: stage text updates to "Finding videos and fetching fan comments…", then "Mining peak fan-comment moments…", then "Writing briefs (Claude Opus)…".
   - On complete: 3 cards transition to real briefs with hook text + handle, toast confirms `3 briefs ready`.
   - Click **Approve & schedule** on one — schedules normally as before.

2. **Failure path (no SC top-up needed to test this)**:
   - Same flow → wait ~3-5 min → cards flip to red with "Stage 1 failed (exit=…) Looks like you're out of credits".
   - Click **Dismiss** on one → card disappears from queue.

3. **Cooldown**:
   - Run a successful job for `@artistX, podcasts`.
   - Immediately re-trigger same `@artistX, podcasts` → 429 toast "Already running for this artist + source. Wait a minute and retry."
   - Same artist different source (`live_performance`) → succeeds (cooldown is per-tuple).

4. **Paul-only / no labelId**:
   - Fan brief preset → mock Select + textarea unchanged. Wizard does not appear.

5. **Regression sweep**:
   - Other Factory v2 presets (Short-form, Mini-doc, Sensational, Self-help, Tour recap, Link→video) unchanged.
   - `/label/fan-briefs` unchanged — still surfaces pending CLI-pipeline briefs with the existing approve/skip/modify path.
   - Review tab's Scheduled sub-tab unchanged.

## Decisions worth flagging

- **Placeholder reconciliation by jobIndex.** Each placeholder gets `jobIndex 0..N-1`; on complete we look up `produced_brief_ids[index]`. Surplus placeholders (when pipeline produced fewer briefs than requested) get dropped via `flatMap`. Alternative was to mark them failed individually, but a single `Generated 3 of 5 requested` toast is cleaner than 2 red cards in Review.
- **Pending sub-tab unifies generating/failed/pending.** Mental model: "I clicked Create, where are my briefs?" → Pending. Adding a third "In progress" sub-tab would have split attention. Color-coding handles the visual differentiation.
- **Cancel doesn't kill backend job.** Clicking "Cancel" on a generating placeholder removes the FE state but the worker keeps running. Briefs still land in `fan_briefs` at status='approved'; they're visible at `/label/fan-briefs` but no longer in the v2 queue. Acceptable for v1 — v1.5 could DELETE the `fan_brief_jobs` row to short-circuit (worker would need to check before each stage).
- **Queue is in-memory only.** v2 prototype state lives in React, not the DB. Browser refresh during an in-flight job loses the placeholders — the briefs still land in the DB and surface at `/label/fan-briefs`, but the user has to navigate there to see them. v1 needs a persistent queue table. Flagged for a future session.

## While I was in here — recommendations (ranked by impact)

1. **Persist queue to DB.** Right now a refresh mid-job orphans the placeholders. A `factory_v2_queue` table keyed on `(label_id, item_id)` would fix this and let oncall/mobile reach the same queue. Bigger refactor — ASK before pulling the thread.
2. **Wire Cancel to backend cancellation.** A `DELETE /functions/v1/fan-briefs-generate-on-demand?jobId=…` (or set `fan_brief_jobs.status='cancelled'` so the worker bails on next stage). Would also need a worker check between stages. ~1 hour of backend work + 5 LOC frontend.
3. **Global "in-flight jobs" badge.** Surface `Map<jobId, status>` in a top-level context so the user sees "2 jobs running" from any page. Pairs naturally with #1 (persistent queue → cross-page visibility). Defer.
4. **Job history list at `/label/admin/fan-briefs`** showing the last N jobs with their outcomes + costs. Useful once Paul wants to debug why a label's briefs are thin.
5. **Topbar empty-state on Create tab when there are zero artists in roster.** The wizard already handles the empty-roster case in the dropdown ("No artists in roster — see /label/admin to onboard"), but a friendlier banner above the preset cards would prevent confusion. ~10 LOC.
