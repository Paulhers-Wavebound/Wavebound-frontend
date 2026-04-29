-- artist_release_calendar
--
-- Structured upcoming-release intelligence for Content & Social Posting Window.
-- The AI brief writer remains the collector, but release dates are promoted out
-- of weekly_pulse JSON so humans can audit/correct them and cron can refresh
-- them without regenerating the full artist brief.

create table if not exists public.artist_release_calendar (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.labels(id) on delete cascade,
  artist_handle text not null,
  release_date date not null,
  title text,
  source_url text,
  source_type text check (
    source_type in ('web', 'tiktok_caption', 'latest_release', 'manual')
  ),
  evidence text,
  confidence text not null default 'medium' check (
    confidence in ('high', 'medium', 'low')
  ),
  status text not null default 'ai_detected' check (
    status in ('ai_detected', 'confirmed', 'dismissed', 'manual')
  ),
  detected_by text not null default 'generate-artist-focus',
  evidence_payload jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_release_calendar_handle_not_blank
    check (length(trim(artist_handle)) > 0)
);

create unique index if not exists artist_release_calendar_unique_release_idx
  on public.artist_release_calendar (label_id, artist_handle, release_date);

create index if not exists artist_release_calendar_label_date_idx
  on public.artist_release_calendar (label_id, release_date)
  where status in ('ai_detected', 'confirmed', 'manual');

create index if not exists artist_release_calendar_artist_idx
  on public.artist_release_calendar (label_id, artist_handle, release_date);

alter table public.artist_release_calendar enable row level security;

drop policy if exists "service role full access to artist release calendar"
  on public.artist_release_calendar;
create policy "service role full access to artist release calendar"
  on public.artist_release_calendar
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "label members can view release calendar"
  on public.artist_release_calendar;
create policy "label members can view release calendar"
  on public.artist_release_calendar
  for select
  to authenticated
  using (
    label_id in (
      select up.label_id
      from public.user_profiles up
      where up.user_id = auth.uid()
    )
  );

drop policy if exists "label members can update release calendar"
  on public.artist_release_calendar;
create policy "label members can update release calendar"
  on public.artist_release_calendar
  for update
  to authenticated
  using (
    label_id in (
      select up.label_id
      from public.user_profiles up
      where up.user_id = auth.uid()
    )
  )
  with check (
    label_id in (
      select up.label_id
      from public.user_profiles up
      where up.user_id = auth.uid()
    )
  );

drop policy if exists "label members can insert release calendar"
  on public.artist_release_calendar;
create policy "label members can insert release calendar"
  on public.artist_release_calendar
  for insert
  to authenticated
  with check (
    label_id in (
      select up.label_id
      from public.user_profiles up
      where up.user_id = auth.uid()
    )
  );

create or replace function public.touch_artist_release_calendar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists artist_release_calendar_touch_updated_at
  on public.artist_release_calendar;
create trigger artist_release_calendar_touch_updated_at
  before update on public.artist_release_calendar
  for each row
  execute function public.touch_artist_release_calendar_updated_at();

create or replace function public.trigger_upcoming_release_scan()
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  service_key text;
  request_id bigint;
begin
  select decrypted_secret
  into service_key
  from vault.decrypted_secrets
  where name = 'supabase_service_role_key'
  limit 1;

  if service_key is null then
    raise exception 'Missing vault secret supabase_service_role_key';
  end if;

  select net.http_post(
    url := 'https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/generate-artist-focus',
    body := jsonb_build_object(
      'batch', true,
      'release_scan_only', true
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key,
      'apikey', service_key
    ),
    timeout_milliseconds := 10000
  )
  into request_id;

  return request_id;
end;
$$;

do $$
begin
  perform cron.unschedule('daily-upcoming-release-scan');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'daily-upcoming-release-scan',
  '0 11 * * *',
  $$select public.trigger_upcoming_release_scan();$$
);
