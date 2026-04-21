# 2026-04-14 — Stuck "Super" synthesis job + frontend stall-detection fix

## What changed

- `src/pages/label/SoundIntelligenceOverview.tsx` — `fetchList` now seeds the
  per-job stall clock (`progressSnapshots` ref) from `entry.created_at`
  instead of `Date.now()` on first observation. Means a job already stuck
  before the client loads is flagged immediately rather than after 15 min
  of browser-open time.
- `docs/handoffs/backend-todo.md` — added two entries:
  1. WF-SI-3 silent failure on job `54671540-e2cc-45ca-aebf-5e7439421d1c`
     ("Super" by bb trickz, 827 videos).
  2. `list-sound-analyses` should include `updated_at` in the response so
     the frontend can seed the stall clock from real server progress time.

## Why

Paul spotted the "Super" sound in the Sound Intelligence Processing section
showing `SYNTHESIZING… · 827 / 827 analyzed · Started 9h ago`. The UI was
still spinning with no warning.

Diagnosis (confirmed against Supabase):

- `sound_intelligence_jobs` row: `status='synthesizing'`, `videos_analyzed=827`,
  `completed_at=null`, `error_log=[]`, `updated_at=08:38:37 UTC` (no server
  progress for 8½ hours).
- `sound_intelligence_results` row for this job: **does not exist** → the
  synthesis code path never wrote its INSERT.
- Fired `/webhook/wf-si-3-synthesize` manually once at 17:23 UTC. The `Update
Synthesizing` n8n node ran (updated_at bumped) but the workflow then
  silently aborted again — no results row, no error log, no status change.
- Confirmed this is not a size issue: larger jobs (972, 970, 958 videos)
  completed cleanly on 2026-04-10. Something in the synthesis code path is
  crashing for this specific dataset and WF-SI-3 has no error trigger to
  surface it.

Two separate problems:

1. **Backend** — WF-SI-3 is a black hole for silent failures. Backend session
   needs n8n execution history to see the actual crash line. Documented in
   `backend-todo.md` with the exact job ID and a proposed hardening (wrap
   `Synthesize Analysis` in try/catch → `status='failed'` + `error_log`).
2. **Frontend** — even if we fix the backend, the UI never surfaced the
   stall. `progressSnapshots` was using `Date.now()` as the baseline on first
   observation, so a 9h-stuck job looked like a 0-second-old one to the stall
   detector until the user left the tab open for 15 min. Fixed by seeding
   from `entry.created_at`. A follow-up when the backend exposes `updated_at`
   will make this even more accurate (swap the seed to `updated_at`).

## What was tested

- `npx tsc --noEmit` — clean.
- Verified the current DB state end-to-end via direct REST API queries
  against `sound_intelligence_jobs`, `sound_intelligence_videos`, and
  `sound_intelligence_results`.
- Fired the n8n synthesize webhook twice during the session to confirm the
  failure is reproducible, not a one-off.

## What to verify in browser

- Load `/label/sound-intelligence` with the stuck Super job still present.
  The Processing card should now flip to "Possibly stalled" with the red
  border + Retry button visible, instead of showing a green spinner. (Once
  the backend workflow is fixed and the job is retried successfully, the
  card will go away normally.)
- Optional: verify a freshly-created job (newly submitted sound) still shows
  the normal spinner for its first few minutes before flagging as stalled.

## While I was in here

1. **(Not done — flagged for backend)** WF-SI-3 needs a top-level error
   trigger or try/catch around `Synthesize Analysis`. Silent failure with
   empty `error_log` is the reason Paul had to eyeball this at all.
2. **(Not done — flagged for backend)** `list-sound-analyses` should include
   `updated_at` so the stall clock can be seeded from real server progress
   time instead of `created_at`.
3. **(Recommend)** Add a "last refreshed" timestamp to the Processing card
   itself — right now the only time string is `Started {timeAgo(created_at)}`,
   which is unhelpful after a retry. Showing something like
   `Last progress {timeAgo(updated_at)}` (once the backend exposes it) would
   make the stall obvious at a glance.
4. **(Recommend)** Audit all three Processing-status cards (`scraping`,
   `classifying`, `synthesizing`) for consistent error-surface behavior.
   Right now if any n8n stage silently aborts, the frontend just shows a
   spinner until the user manually clicks Retry. A scheduled "janitor" job
   that flips stuck jobs (>30 min with no updated_at change) to `failed`
   server-side would let the existing failed-state UI take over.
5. **(Recommend)** Consider a `refreshing_since` column on
   `sound_intelligence_jobs` so refresh stall detection works differently
   from first-run detection. Refreshing with existing data is cheaper and
   expected to be fast — a 3-minute stall threshold makes sense for that
   path but not for the first synthesis of a 900-video job.
