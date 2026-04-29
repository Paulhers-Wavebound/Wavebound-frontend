/*
  Sound canonical groups

  Purpose:
  - Let label users merge multiple TikTok sound IDs under one monitored sound.
  - Preserve each raw sound_intelligence_jobs row so filters and audits can still
    isolate an individual TikTok sound ID.

  Affected objects:
  - public.sound_canonical_groups
  - public.sound_canonical_group_members
  - public.update_sound_canonical_group_updated_at()
*/

create table if not exists public.sound_canonical_groups (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.labels (id) on delete cascade,
  name text not null,
  artist_name text,
  cover_url text,
  primary_job_id uuid references public.sound_intelligence_jobs (id) on delete set null,
  created_by uuid default auth.uid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint sound_canonical_groups_name_not_empty
    check (length(trim(name)) > 0)
);

comment on table public.sound_canonical_groups is
  'Canonical monitored sounds that group multiple TikTok sound IDs for one underlying song.';

create table if not exists public.sound_canonical_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.sound_canonical_groups (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  job_id uuid not null references public.sound_intelligence_jobs (id) on delete cascade,
  sound_id text not null,
  sound_url text not null,
  alias_label text,
  added_by uuid default auth.uid(),
  created_at timestamp with time zone not null default now(),
  constraint sound_canonical_group_members_sound_id_not_empty
    check (length(trim(sound_id)) > 0),
  constraint sound_canonical_group_members_sound_url_not_empty
    check (length(trim(sound_url)) > 0),
  constraint sound_canonical_group_members_unique_sound
    unique (group_id, sound_id),
  constraint sound_canonical_group_members_unique_job
    unique (group_id, job_id)
);

comment on table public.sound_canonical_group_members is
  'Individual TikTok sound IDs and analysis jobs attached to a canonical monitored sound.';

create index if not exists sound_canonical_groups_label_updated_idx
  on public.sound_canonical_groups (label_id, updated_at desc);

create index if not exists sound_canonical_group_members_group_idx
  on public.sound_canonical_group_members (group_id, created_at);

create index if not exists sound_canonical_group_members_label_sound_idx
  on public.sound_canonical_group_members (label_id, sound_id);

create unique index if not exists sound_canonical_group_members_one_group_per_label_job_idx
  on public.sound_canonical_group_members (label_id, job_id);

create or replace function public.update_sound_canonical_group_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_group_id uuid;
begin
  target_group_id := case
    when tg_op = 'DELETE' then old.group_id
    else new.group_id
  end;

  update public.sound_canonical_groups
  set updated_at = now()
  where id = target_group_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists sound_canonical_group_members_touch_group
  on public.sound_canonical_group_members;

create trigger sound_canonical_group_members_touch_group
after insert or update or delete on public.sound_canonical_group_members
for each row
execute function public.update_sound_canonical_group_updated_at();

alter table public.sound_canonical_groups enable row level security;
alter table public.sound_canonical_group_members enable row level security;

create policy "Label members can read sound groups"
on public.sound_canonical_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_groups.label_id
  )
);

create policy "Label members can create sound groups"
on public.sound_canonical_groups
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_groups.label_id
  )
);

create policy "Label members can update sound groups"
on public.sound_canonical_groups
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_groups.label_id
  )
)
with check (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_groups.label_id
  )
);

create policy "Label members can delete sound groups"
on public.sound_canonical_groups
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_groups.label_id
  )
);

create policy "Label members can read sound group members"
on public.sound_canonical_group_members
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_group_members.label_id
  )
);

create policy "Label members can create sound group members"
on public.sound_canonical_group_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_group_members.label_id
  )
  and exists (
    select 1
    from public.sound_canonical_groups
    where sound_canonical_groups.id = sound_canonical_group_members.group_id
      and sound_canonical_groups.label_id = sound_canonical_group_members.label_id
  )
  and exists (
    select 1
    from public.sound_intelligence_jobs
    where sound_intelligence_jobs.id = sound_canonical_group_members.job_id
      and sound_intelligence_jobs.label_id = sound_canonical_group_members.label_id
  )
);

create policy "Label members can update sound group members"
on public.sound_canonical_group_members
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_group_members.label_id
  )
)
with check (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_group_members.label_id
  )
  and exists (
    select 1
    from public.sound_canonical_groups
    where sound_canonical_groups.id = sound_canonical_group_members.group_id
      and sound_canonical_groups.label_id = sound_canonical_group_members.label_id
  )
  and exists (
    select 1
    from public.sound_intelligence_jobs
    where sound_intelligence_jobs.id = sound_canonical_group_members.job_id
      and sound_intelligence_jobs.label_id = sound_canonical_group_members.label_id
  )
);

create policy "Label members can delete sound group members"
on public.sound_canonical_group_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = sound_canonical_group_members.label_id
  )
);
