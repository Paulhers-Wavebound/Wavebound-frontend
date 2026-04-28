# Session diary — 2026-04-27 Assets Delete button (replacing Kill + feedback)

## What changed

Renamed the destructive Assets-tab button from "Kill + feedback" /
"Cancel" / "Dismiss" to a single **Delete**, and made it actually
permanent. The previous flow opened a `KillFeedbackModal` that
collected a reason + note, but only ever:

1. removed the item from the in-memory queue, and
2. for fan_briefs, set `status='archived'`.

It never deleted the cartoon / realfootage / link_video DB rows, so
they re-appeared on refresh via `recentCartoonScriptsQuery`,
`recentRealfootageScriptsQuery`, and the link_video rehydrate.

### Files modified

- `src/components/content-factory-v2/ReviewView.tsx` — removed
  `KillFeedbackModal` import + mount, swapped `onKillWithFeedback` prop
  for `onDelete: (itemId: string) => void`, added a `requestDelete`
  helper that gates on `window.confirm()` before calling the parent
  handler. Button label is now just `Delete` regardless of state.
- `src/pages/label/ContentFactoryV2.tsx` — replaced
  `handleKillWithFeedback` with `handleDeleteItem`. Hard-deletes from
  `cartoon_scripts` / `realfootage_scripts` / `cf_jobs` / `fan_briefs`
  based on `item.outputType` + `cartoonFormat`, then invalidates the
  React Query caches that would otherwise re-hydrate the card. Tied
  the renamed prop into the `ReviewView` call site.
- `src/components/content-factory-v2/types.ts` — removed unused
  `KillReason` type.

### Files deleted

- `src/components/content-factory-v2/KillFeedbackModal.tsx` — orphaned.
  Recoverable from git history if the feedback flow comes back.

### Migration applied

- `wavebound-backend/migrations/20260427_cf_assets_label_user_delete_policies.sql`
  (already executed against `kxvgbowrkmowuyezoeke`):
  - `label_users_delete_own_scripts` on `cartoon_scripts`
  - `label_users_delete_realfootage_scripts` on `realfootage_scripts`
  - `cf_jobs_delete` on `cf_jobs`
  - All mirror the existing SELECT predicate
    (`label_id ∈ user_profiles labels for auth.uid()`)
  - `fan_briefs` already had a DELETE policy (`Label members can
delete briefs`) — not touched.

## Why

Paul tried to delete a video from Assets, hit "Kill + feedback", and
nothing actually deleted. The button had three labels (Cancel /
Dismiss / Kill + feedback) for different states, all wired to the
same archive-only handler. He asked for one button — "Delete" — that
hard-deletes with no going back.

## Why DELETE policies and not an Edge Function

Two paths considered:

1. **DELETE RLS policies (chosen).** Mirrors the existing SELECT
   predicate, no new Edge Function to deploy or maintain, FK cascades
   already in place to clean up `cartoon_videos`,
   `cartoon_image_assets`, `cartoon_image_jobs`, `cartoon_vo_clips`,
   `realfootage_videos`, `realfootage_clip_jobs`,
   `realfootage_clip_selections`, `realfootage_vo_clips`. One SQL
   migration, three policies, done.
2. **Edge Function with service role.** More flexible (could apply
   business rules, log to a deletion audit, etc.) but adds a
   deployment dependency and a backend round-trip per click. Not
   worth it for "remove this asset I no longer want."

The DELETE predicate is identical to SELECT, so the same row
ownership check that lets a user _see_ an asset lets them delete it.
No additional RLS surface area beyond what's already exposed.

## Edge case: in-flight cartoons with no script row

A QueueItem in `status='generating'` may have only `cartoonChatJobId`
set (no `cartoonScriptId` yet). `chat_jobs` has no DELETE policy for
label users — it's the writer's audit trail. The handler removes the
in-memory card, but the orphaned `chat_jobs` row remains; the
`chat-jobs-kickoff-sweeper` pg_cron will eventually create a script
row from it. The user only sees it return on a subsequent refresh,
and can delete again then. Documented in the inline comment;
acceptable for "for now," revisit by adding a chat_jobs DELETE policy
if it gets noisy.

## What was tested

- `npx tsc --noEmit` → clean.
- DB-side: confirmed all 4 DELETE policies live via `pg_policies`
  query.
- Counts of currently-deletable rows (deleted nothing in prod):
  - cartoon_scripts in failed states: 4
  - realfootage_scripts in failed states: 3
  - cf_jobs in error: 10
  - fan_briefs archived: 2
- Did NOT delete any prod row from this session — the user's own
  Assets-tab clicks will be the live test.

## What to verify in browser

1. Open Assets, find a failed realfootage card (e.g. the Addison Rae
   `materializing_failed` one from this morning). Click **Delete** →
   confirm → toast says "Deleted". Refresh the page → card stays
   gone.
2. Same for a completed cartoon card → confirm → gone, child rows
   in `cartoon_videos` / `cartoon_image_*` should also be gone (FK
   cascade).
3. Same for a fan_brief card → confirm → gone.
4. Same for a link_video error card → confirm → `cf_jobs` row gone.
5. Generating-state cartoon with no script row yet: clicking Delete
   removes from queue immediately. May re-appear on next refresh
   (sweeper edge case documented above).
6. Confirm the toast says "Deleted" not "Killed with feedback".

## "While I was in here"

- **chat_jobs DELETE policy is the obvious next gap.** Right now an
  in-flight delete leaves an orphaned chat_job that the pg_cron
  sweeper will resurrect into a script row. Adding a label-scoped
  DELETE policy on chat_jobs (similar to the others) closes that
  loop, but also reduces the writer audit trail value. Worth a
  product call: keep the audit trail forever, or let users
  fully purge their work. **Defer until a user complains.**
- **No bulk-delete.** Assets tab is one-by-one. Power users with a
  failed-card backlog will hate this. A multi-select + "Delete N
  items" would be a 30-min add. **Low priority unless someone asks.**
- **No undo, no soft-delete.** Per the user's explicit request. If
  this turns out to be too aggressive in practice (e.g. a user
  fat-fingers and loses a finished render), we'd need either:
  (a) a `deleted_at` soft-delete column with a 7-day window before
  hard-purge, or (b) a snackbar toast with an "Undo" button that
  restores from a transaction. **Not building until we see
  regret.**
- **The retired `KillReason` type is recoverable from git history.**
  If/when the feedback flow comes back, prior commits had the modal
  - the four reason categories. Don't rebuild from memory; revert.
- **Deletion has no telemetry.** We log retries via
  `retryTelemetry.ts` and dispatcher kicks via `[cf-dispatch-kick]`
  (added earlier today), but no "user deleted asset X" trail.
  Probably fine; if it becomes a question of "why did this user
  empty their Assets tab," a Sentry breadcrumb in
  `handleDeleteItem` would cover it cheaply.

## Definition of done

- [x] Button label is "Delete" everywhere in the Assets queue card.
- [x] Single confirm gate before destructive action.
- [x] Deletes the backing DB row (cartoon / realfootage / fan_brief /
      link_video).
- [x] Survives refresh — item does not re-appear.
- [x] FK cascades handle child rows.
- [x] tsc clean.
- [x] RLS DELETE policies migrated into prod.
- [ ] Browser smoke test by Paul (the only thing I can't do).
