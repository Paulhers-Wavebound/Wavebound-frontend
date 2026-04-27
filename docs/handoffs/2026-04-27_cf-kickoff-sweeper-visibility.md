# Backend handoff — Content Factory kickoff sweeper visibility

**Repo:** `wavebound-backend`
**Stack:** Postgres + pg_cron, Supabase Edge Functions
**Estimated effort:** ~1 hr. One log table + sweeper modification + one RLS policy. Frontend debug panel is in-flight in this repo and waits on the schema.

---

## Background

A pg_cron job `chat-jobs-kickoff-sweeper` was added today (`migrations/20260427_chat_jobs_kickoff_sweeper.sql`, wavebound-backend). Every 60s it scans `chat_jobs` for completed `cartoon_writer` rows that have no downstream `cartoon_scripts` / `realfootage_scripts` row and POSTs `chat_job_id` to `/functions/v1/content-factory-vo-dispatch`. Acts as a guarantee that the chain still fires within ≤1 min even when the user closes the tab or the frontend's Realtime drops the writer-completion event.

The problem: this sweeper is invisible. When the pipeline mysteriously self-heals (or fails to), there's no audit trail. Right now you'd only know it ran by tailing edge function logs and matching timestamps. Next time a job gets stuck for an hour, the first question is "is the sweeper even running?" — and there's no fast answer.

## What to ship on the backend

### 1. Log table `cf_kickoff_sweeper_runs`

```sql
create table public.cf_kickoff_sweeper_runs (
  id            uuid primary key default gen_random_uuid(),
  ran_at        timestamptz not null default now(),
  -- Number of orphan writer completions the sweep noticed. 0 = no work.
  orphans_found int not null default 0,
  -- Of those, how many got a successful POST to vo-dispatch.
  dispatched    int not null default 0,
  -- Per-job outcome detail. Compact JSON per row for the UI:
  --   [{"chat_job_id": "...", "status": "dispatched"|"failed", "error": "..."}]
  details       jsonb,
  -- Sweep wall-clock duration in milliseconds. Helps catch slow scans
  -- if the orphan query starts taking too long.
  duration_ms   int,
  created_at    timestamptz not null default now()
);

create index cf_kickoff_sweeper_runs_ran_at_idx
  on public.cf_kickoff_sweeper_runs (ran_at desc);
```

### 2. RLS policy — read-only for label users

The frontend reads this from the label dashboard (debug panel). Service-role still writes; label users read all rows but write nothing.

```sql
alter table public.cf_kickoff_sweeper_runs enable row level security;

create policy "label users read sweeper runs"
on public.cf_kickoff_sweeper_runs
for select
to authenticated
using ( true );  -- All label users see all rows. Not sensitive.

-- No insert/update/delete policies — service_role bypasses RLS for the
-- sweeper itself, no other path needs write access.
```

### 3. Sweeper writes a log row each run

Modify the existing `chat-jobs-kickoff-sweeper` pg_cron function (or whatever the implementation actually looks like — handoff didn't get the source). Each invocation should:

- Record start timestamp
- Run the existing orphan-detection query
- POST to vo-dispatch for each orphan, capturing per-row status
- Insert a single `cf_kickoff_sweeper_runs` row with `orphans_found`, `dispatched`, `details`, `duration_ms`

If the sweep finds zero orphans, still insert a row with `orphans_found=0`. The UI uses "no row in last 5 min" as a sweeper-down signal — silent runs need to log too.

### 4. Realtime publication (optional but nice)

`alter publication supabase_realtime add table public.cf_kickoff_sweeper_runs;` so the frontend debug panel can update live without a 30s poll. Not blocking — the panel can poll if Realtime isn't wired up.

## Frontend debug panel (will land in wavebound-frontend after schema is live)

The plan: an unobtrusive "Pipeline" status row in `/label/factory?tab=create` (admin-only, behind the existing `IS_ADMIN` flag if it exists, otherwise gated to `palsundsbo` until we ship a feature flag). Shape:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Pipeline · last sweeper run 23s ago · 1 orphan dispatched · 412ms      │
│  Recent (5): [✓ 0 orphans · 1m]  [✓ 1 dispatched · 2m]  [✗ 1 failed · 3m]│
└────────────────────────────────────────────────────────────────────────┘
```

Reads from `cf_kickoff_sweeper_runs` ordered by `ran_at desc limit 5`. Click a "failed" pill → drawer with the `details` JSON. No real intelligence — just exposing what's already happening.

## Acceptance

- `select * from cf_kickoff_sweeper_runs order by ran_at desc limit 5` returns one row per minute with sensible `orphans_found` / `dispatched` / `duration_ms` values.
- A label user (anon JWT) can `select` from the table but not `insert`.
- Sweep failures (e.g. dispatcher returns 500) are captured in `details.status='failed'` rather than swallowed.

## Notes / context

- Don't add a foreign key from `details.chat_job_id` to `chat_jobs.id` — the JSONB shape is loose on purpose; FKs in JSONB are PG-impossible anyway.
- Keep `details` compact — the panel renders 5 rows max. If a sweep dispatches 20 orphans (pathological case), still write all 20 in the JSON; a 20-element array is fine.
- 14-day retention via a cron `delete from cf_kickoff_sweeper_runs where ran_at < now() - interval '14 days'` is a reasonable second pass after this lands. Not urgent — the table will accumulate ~1440 rows/day, still negligible after a year.
