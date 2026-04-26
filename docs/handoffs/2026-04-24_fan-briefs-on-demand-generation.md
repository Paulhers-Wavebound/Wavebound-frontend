# Task: build the on-demand fan-brief generation endpoint

**For the next Claude Code session inside `~/Projects/wavebound-backend`.**

## Skills to Invoke (before starting work)

**Core:**

- `/verification-before-completion` — this writes to prod and the frontend will be staring at it. Don't claim it works without exercising the endpoint end-to-end.
- `/systematic-debugging` — the four-script pipeline has many ways to silently produce zero rows. Diagnose upstream before retrying.

**On-demand:**

- `/supabase` — for the new `fan_brief_jobs` table + RLS.
- `/typescript-expert` — the wrapper edge function will compose four existing Deno scripts; aim for thin glue, not a rewrite.

## Why this exists

Frontend: `/label/content-factory-v2` → Create tab → **Fan brief edit** preset is a wizard (artist + source + clip count). The current "Create" CTA only _filters and bulk-approves pre-existing pending briefs_ — meaning if the CLI pipeline hasn't been run for that artist+source, the button is permanently disabled with "0 available".

Paul wants Create to actually _kick off_ the pipeline:

1. Frontend POSTs `{ labelId, artistHandle, source, count }`.
2. Backend goes to YouTube, discovers candidate videos, downloads/transcribes, mines fan-comment peaks, synthesizes briefs, and (eventually) renders clips.
3. Briefs land in `fan_briefs` and surface in the Review tab.

Today this only happens via the four CLI scripts in `scripts/fan-briefs/`, run by hand from the backend repo. We need a callable surface so the wizard can trigger them.

## What you're building

### 1. New table — `fan_brief_jobs`

A simple job tracker so the frontend can show progress and reconcile placeholders in the Review queue.

```sql
CREATE TABLE fan_brief_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id        uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  artist_handle   text NOT NULL,
  source          text NOT NULL CHECK (source IN ('live_performance', 'podcasts')),
  requested_count int  NOT NULL CHECK (requested_count BETWEEN 1 AND 20),
  status          text NOT NULL CHECK (status IN ('queued','discovering','mining','synthesizing','rendering','complete','failed')) DEFAULT 'queued',
  current_stage   text,                       -- human-readable label, e.g. "Fetching comments (3/12)"
  produced_brief_ids uuid[] DEFAULT '{}',     -- populated as briefs are inserted
  error_message   text,
  triggered_by    uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX fan_brief_jobs_label_status_idx ON fan_brief_jobs(label_id, status);

-- RLS: label users can SELECT their own label's jobs; only service_role writes.
ALTER TABLE fan_brief_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "label_users_select_own_jobs"
  ON fan_brief_jobs FOR SELECT
  USING (label_id IN (SELECT label_id FROM user_label_access WHERE user_id = auth.uid()));
```

(Adjust the user-access subquery to match whatever the existing `labels` RLS pattern uses — see `RLS pattern` below.)

### 2. New edge function — `fan-briefs-generate-on-demand`

```
POST  ${SUPABASE_URL}/functions/v1/fan-briefs-generate-on-demand
Auth: Bearer JWT (user's session token)
Body: { labelId, artistHandle, source: "live_performance" | "podcasts", count: 1..20 }
```

**Returns immediately** (do NOT block on the pipeline — it takes minutes):

```json
{ "jobId": "uuid", "status": "queued" }
```

Server flow:

1. Validate the JWT and confirm the user has access to `labelId`. Reject with 403 if not.
2. Confirm `artistHandle` exists in `artists` and its `label_id` matches the request. Reject with 400 if not.
3. Insert a `fan_brief_jobs` row with `status='queued'`, return `jobId` immediately.
4. Spawn the pipeline runner asynchronously (see "Async pattern" below — edge functions have a 60-150s wall clock so we can't run inline).

### 3. Pipeline runner

This is the meat. It composes the four existing scripts. Two options — pick whichever fits the existing infra:

**Option A — pg_cron-style queue worker** (preferred if there's already one running):

- The edge function only inserts the job row.
- A long-running worker (your existing cron host or a Supabase Scheduled Function with `pg_cron`) polls `fan_brief_jobs WHERE status='queued'`, claims one (with `SELECT … FOR UPDATE SKIP LOCKED`), runs the pipeline, updates status as it progresses.

**Option B — fire-and-forget shell exec from the edge function**:

- Edge function shells out to the four scripts via SSH or via a self-hosted runner with a webhook.
- Simpler but tighter coupling. Only do this if Option A's infra doesn't exist yet.

Given that today's pipeline already runs from a CLI host with all the env vars set, I lean Option A — register a Deno worker on that same host (or a `cron-fan-briefs-on-demand.sh` that runs every 30s and processes one queued job). Tell Paul which you picked and why.

#### Pipeline stages (from the existing scripts)

For `source='live_performance'`:

```bash
# Stage 1 — discover candidate live videos
deno run --allow-net --allow-env scripts/fan-briefs/discover-live.ts "$ARTIST_NAME" "@$ARTIST_HANDLE"
# UPDATE fan_brief_jobs SET status='discovering', current_stage='Finding live videos' …

# Stage 2 — fetch fan comments
deno run --allow-net --allow-env scripts/fan-briefs/fetch-comments.ts --artist $ARTIST_HANDLE
# UPDATE fan_brief_jobs SET current_stage='Fetching fan comments' …

# Stage 3 — mine peak signals (clusters → segments + peak_evidence)
deno run --allow-net --allow-env scripts/fan-briefs/mine-live-signals.ts --artist $ARTIST_HANDLE
# UPDATE fan_brief_jobs SET status='mining', current_stage='Finding peak moments' …

# Stage 4 — synthesize briefs (Claude Opus, writes fan_briefs rows)
# IMPORTANT: pass --count $REQUESTED_COUNT and --status approved (NOT pending) so the
# wizard's flow lands them straight in Review without a second approval step.
# If --count or --status flags don't exist yet, ADD them.
deno run --allow-net --allow-env scripts/fan-briefs/generate-briefs.ts \
  --artist $ARTIST_HANDLE \
  --content-type live_performance \
  --count $REQUESTED_COUNT \
  --status approved
# UPDATE fan_brief_jobs SET status='synthesizing', current_stage='Writing briefs' …
# Capture the inserted brief IDs and store in produced_brief_ids.

# Stage 5 (optional v1.5) — kick off render-clip.ts for each brief
# Out of scope for this handoff — render is still manual today. Just leave briefs at
# status='approved' and the existing render worker will pick them up if/when wired.
```

For `source='podcasts'`:

- Replace `discover-live.ts` with `discover.ts` (the original interview discovery script).
- Pass `--content-type interview` to `generate-briefs.ts` (the script joins on content_type to filter).
- Same `fetch-comments.ts` and `mine-live-signals.ts` apply — comment-driven peak detection works the same regardless of source.
- (`mine-live-signals.ts` is misnamed — confirm it works on interview-typed segments too. If it doesn't, that's a script bug worth fixing here since on-demand mode will surface it.)

#### Status transitions the runner must perform

```
queued → discovering → mining → synthesizing → complete   (happy path)
                                       ↓
                                     failed   (any stage errors → set error_message, status='failed')
```

Update `fan_brief_jobs.updated_at` on every transition (or set up a trigger). The frontend will Realtime-subscribe to this row.

### 4. Frontend contract — what we expect on the FE side

Frontend will:

1. POST to the endpoint, receive `jobId`.
2. Optimistically push N placeholder `QueueItem`s into the Review queue with `status='generating'` and a `fanBriefJobId` field linking back to the job.
3. Subscribe via Supabase Realtime to `fan_brief_jobs WHERE id=jobId` for live status updates, OR poll `GET /functions/v1/fan-briefs-job-status?jobId=…` every 5s as a fallback.
4. When `status='complete'`, swap each placeholder for the real brief by `produced_brief_ids[i]` lookup.
5. When `status='failed'`, mark the placeholders red with the `error_message`.

So please confirm whether Realtime is enabled on `fan_brief_jobs` (you'll need `ALTER PUBLICATION supabase_realtime ADD TABLE fan_brief_jobs;`). If not, I'll wire the polling path on the FE instead.

## RLS pattern to copy

The existing `fan_briefs` table is RLS-gated by `label_id`. Find that policy and mirror it for `fan_brief_jobs` so a user can only see jobs for labels they can access. The user-access table (`user_label_access` or whatever it's called) is the one the existing `fan_briefs` policies reference — copy the same subquery rather than reinventing.

## Required env vars on the runner host

Same as the four scripts today:

```
SUPABASE_SERVICE_KEY      (RLS bypass)
SCRAPECREATORS_API_KEY    (optional fallback exists)
GEMINI_API_KEY            (mine-live-signals.ts hook synthesis)
ANTHROPIC_API_KEY         (generate-briefs.ts → Opus)
```

If any are missing on the runner, add to its `~/.zshrc` or systemd unit env. Do not commit keys.

## Constraints & rules

1. **Cost ceiling per job ≈ $2–5** (same as the manual pipeline). The endpoint MUST reject if the same `(label_id, artist_handle, source)` has had a `status='complete'` job in the last 1 hour AND that job produced ≥1 brief — prevents the user from re-spamming the wizard. Return 429 with a friendly message; the FE will surface it.
2. **Rate-limit per label** — max 3 in-flight jobs (`status NOT IN ('complete','failed')`) per label_id. Return 429 with `{ retry_after_seconds }` if exceeded.
3. **Insert briefs at `status='approved'`, not `pending`.** The wizard skips the pending-review step intentionally — once you triggered Create, you committed. (See "Decision: skip pending stage" below.)
4. **Set `fan_briefs.created_via='factory_v2_on_demand'`** (or similar source enum) so Paul can analytically distinguish in-product creates from CLI creates. Add the column if it doesn't exist.
5. **Sequential pipeline only** — don't parallelize the four scripts. They depend on each other's writes.
6. **One job per row.** Don't batch multiple artists into one job; the worker should pick one job per tick.

## Decisions to confirm with Paul before merging

- **Skip pending stage on this path?** I'm proposing yes — the manual CLI pipeline writes `pending` for human review, but the wizard already framed the user's intent (artist + source + count) so the equivalent of "review" already happened. Briefs land at `approved` and the existing render pipeline picks them up. If Paul wants pending here too, change the `--status` flag and the wizard's optimistic UI.
- **What if discover finds 0 candidate videos?** Set `status='failed'`, `error_message='No live performances found for @<handle>. Try a different source or wait for the catalog to grow.'` Frontend will show the error inline. Do NOT silently complete with zero briefs.
- **What if mining finds N segments but N < requested count?** Insert what you have, set `status='complete'` with a note in `current_stage` like "Found 3 of 5 requested — fewer fan-driven peaks than expected." Frontend will display the count honestly.

## Verification (mandatory before claiming done)

### After table + endpoint deploy

```bash
# 1. Insert a job manually and observe it picked up
curl -sS -X POST "https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/fan-briefs-generate-on-demand" \
  -H "Authorization: Bearer $TEST_USER_JWT" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"labelId":"8cd63eb7-7837-4530-9291-482ea25ef365","artistHandle":"alexwarren","source":"podcasts","count":3}'

# Expect: 200 with { "jobId": "...", "status": "queued" }
```

### Watch the job progress

```sql
SELECT id, status, current_stage, produced_brief_ids, error_message, updated_at
  FROM fan_brief_jobs
 WHERE label_id = '8cd63eb7-7837-4530-9291-482ea25ef365'
 ORDER BY created_at DESC
 LIMIT 5;
```

Expect status transitions through `discovering → mining → synthesizing → complete` over 2–8 min.

### After complete

```sql
SELECT id, hook_text, content_type, status, created_via
  FROM fan_briefs
 WHERE id = ANY(
   SELECT unnest(produced_brief_ids)
     FROM fan_brief_jobs
    WHERE id = '<jobId>'
 );
```

Expect: row count == job's `requested_count` (or fewer with the explanation in `current_stage`), `status='approved'`, `content_type` matches the job's `source`.

### Negative tests

- Hit the endpoint with a `labelId` the JWT user doesn't own → 403.
- Hit it twice in 5 seconds for the same artist+source → second should 429 (or the 4th if your limit is 3 in-flight).
- Stop the pipeline mid-run (kill the worker) → row should land at `status='failed'` after a 10-min timeout, not stuck `synthesizing` forever. Add a watchdog if needed.

### Final smoke test

Post the jobId + verification SQL output back to Paul. He'll trigger from the wizard at `/label/content-factory-v2` and watch placeholders reconcile in Review. The frontend handoff to wire that up will land in a separate FE PR after this one ships.

## Out of scope for this handoff

- Render-clip orchestration (still CLI). The briefs will be `status='approved'` and the existing render worker should pick them up unchanged — confirm but don't extend.
- Per-label cost tracking / budget caps. We'll bolt on after we see real usage.
- Streaming progress to the frontend over WebSocket — Realtime row-level subscriptions are enough for v1.
- A retry button. If a job fails the user just hits Create again from the wizard.
- Job history UI on the label dashboard. Paul can read the table directly for now.

## When complete

1. Confirm the endpoint URL, the table schema, and the polling/realtime story in a reply to Paul.
2. Add a session diary in the backend repo: `docs/session-diaries/2026-04-XX_fan-briefs-on-demand-endpoint.md`.
3. Flag any of the "Decisions to confirm with Paul" items that you didn't explicitly resolve.
4. Tell the frontend session what query key / Realtime channel to subscribe to so the FE wire-up can start.

---

Questions before starting? Ask Paul. Otherwise: table → endpoint → worker → verify with the curl + SQL above.
