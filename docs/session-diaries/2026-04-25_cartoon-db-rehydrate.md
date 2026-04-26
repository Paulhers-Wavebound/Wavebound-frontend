# 2026-04-25 — Cartoon DB-backed rehydrate

## What changed

- `src/components/content-factory-v2/cartoonReconciler.ts` — promoted the
  private `FAILED_STATUSES` set to exported `CARTOON_FAILED_STATUSES`, and
  the private `statusToErrorLabel` helper to exported `cartoonErrorLabel`.
  Added new exports: `CartoonScriptRow` (DB row type with embedded
  cartoon_videos), `deriveCartoonItemState(row)` (single source of truth
  for status/stage derivation), and `buildCartoonItemFromScript(row)`
  (DB row → fresh QueueItem). Updated the stale comment that claimed DB
  recovery wasn't viable — it now is.
- `src/pages/label/ContentFactoryV2.tsx` — added
  `recentCartoonScriptsQuery` (React Query, label-scoped, last 24h, max
  50 rows, refetched every 30s) plus a merge effect that:
  1. Patches existing cartoon items by `cartoonScriptId` (full update),
  2. Falls back to matching by `cartoonChatJobId` for items still in the
     script phase (so they upgrade to script-tracked without duplicating),
  3. Prepends fresh items via `buildCartoonItemFromScript` for any DB row
     the in-memory queue doesn't recognize — the recovery path.
- `docs/features/cartoon-create.md` — documented the new authoritative
  rehydrate path and updated the "Refresh during render" edge case.

## Why

User report: kicked off a cartoon for Addison Rae, the job ran fine on
the backend (`chat_jobs.beaa6af4…` complete, `cartoon_scripts.bab885cf…`
in `planning_images`), but no placeholder ever appeared in Review.
Cause: cartoon FE state was persisted only to localStorage. If HMR / a
hard refresh hits between the placeholder push and the SSE
`event: job_id` first frame (sub-second window), the snapshot is
persisted without `cartoonChatJobId` and the reconciler has no anchor
to read from. After Vite HMR (likely while I was editing files in
parallel) the placeholder vanished and never came back.

The fan-brief flow already had a DB rehydrate (`activeJobsQuery` against
`fan_brief_jobs`); cartoons didn't. `cartoon_scripts` does have
`label_id` and `source_chat_job_id`, so the same pattern applies. Now
implemented.

## What was tested

- `npx tsc --noEmit` — clean (exit 0).
- DB schema verified live: `cartoon_scripts` returns
  `cartoon_videos: {id,status,final_url} | array | null` via PostgREST
  embed (1:1 inferred for completed scripts, null for in-flight).
- Confirmed via service-role read against the live DB that the user's
  Addison Rae job is `planning_images` and the embed shape works.
- No runtime test in browser yet — Paul to verify.

## What to verify in browser

1. Open `/label/content-factory-v2?tab=create`. Within ~30s the
   in-flight Addison Rae cartoon should land in Review with the right
   stage pill (currently around the "images" stage).
2. Wait for the MP4 — `cartoon_scripts.bab885cf-178d-4aa3-ac76-c6de423ce9eb`
   should produce a `cartoon_videos.final_url`. Once it lands, the
   Review card flips to `pending` and the inline player works.
3. **The actual fix test:** kick off a fresh cartoon. While it's in the
   script phase, hit refresh. Within 30s the placeholder should reappear
   in Review. Repeat with HMR (save any file in the project) — same
   result.

## While I was in here

- The DB shows **two `cartoon_scripts` rows for the same
  `source_chat_job_id`** (`f903042d…` complete + `bab885cf…`
  rendering_images). That implies the cartoon-vo edge function got
  POSTed twice for the same chat_job. The in-process
  `cartoonReconcileLocksRef` is supposed to gate this, but the lock
  doesn't survive HMR or remount, and the backend doesn't appear to
  enforce uniqueness on `source_chat_job_id`. Worth a backend
  follow-up: a unique constraint on
  `cartoon_scripts.source_chat_job_id` (or upsert-on-conflict in the
  edge function) would close this. Adding to
  `docs/handoffs/backend-todo.md` is overkill for a single session,
  but it's a real concern and I'd recommend opening a Linear/issue.
- The cartoon merge effect respects locally-`scheduled` items (won't
  downgrade them to `pending` if the DB row says complete). It does
  **not** preserve locally-killed items that were removed from queue —
  if the user dismisses a cartoon and the DB row is still present, it
  comes back on next 30s poll. Could add a "dismissed cartoon ids"
  Set to suppress that, but the existing UX is "kill = remove from
  queue" so this might be desired. Flag for product review.
- `recentCartoonScriptsQuery` runs every 30s regardless of whether
  there are any in-flight cartoons. Given queries are cheap (label
  scoped, indexed by created_at) this is fine, but if Review-tab
  performance becomes a thing we can pause the refetch when no
  generating items are present.
- Same architectural gap exists for **link_video** runs (we just
  shipped that path) — `content_factory_jobs` is the analog table.
  Currently link_video uses sessionStorage which has the same race.
  Worth a `recentContentFactoryJobsQuery` follow-up to harden link_video
  the same way.
