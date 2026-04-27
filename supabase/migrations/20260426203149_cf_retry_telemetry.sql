-- cf_retry_telemetry — one row per Retry-button click in Content Factory v2.
-- Lets us see which output_types fail repeatedly, attribute ElevenLabs /
-- Replicate spend to retried items, and detect dead-on-arrival pipelines.
--
-- Frontend writer: src/components/content-factory-v2/retryTelemetry.ts
-- Cap: 3 attempts (RETRY_MAX in src/components/content-factory-v2/types.ts).

create table if not exists public.cf_retry_telemetry (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  user_id         uuid references auth.users(id) on delete set null,
  item_id         text not null,
  output_type     text not null,
  original_error  text,
  attempt         smallint not null check (attempt between 1 and 10)
);

create index if not exists cf_retry_telemetry_created_at_idx
  on public.cf_retry_telemetry (created_at desc);

create index if not exists cf_retry_telemetry_user_id_idx
  on public.cf_retry_telemetry (user_id, created_at desc);

alter table public.cf_retry_telemetry enable row level security;

-- Authenticated users can append their own retry attempts; nobody can update
-- or delete from the client. Reads are admin-only — analysis goes through
-- service_role from a notebook or scheduled job.
drop policy if exists "insert own retry telemetry" on public.cf_retry_telemetry;
create policy "insert own retry telemetry"
  on public.cf_retry_telemetry for insert
  to authenticated
  with check (user_id = auth.uid());
