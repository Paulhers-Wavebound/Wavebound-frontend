/*
  Sound duplicate suggestion decisions and high-confidence roster auto-merge

  Purpose:
  - Let users dismiss or snooze duplicate sound suggestions so low-confidence
    candidates do not keep resurfacing.
  - Add an explicit RPC for auto-merging high-confidence roster-only matches
    by ISRC or Spotify IDs.
*/

create table if not exists public.sound_duplicate_candidate_decisions (
  id uuid primary key default gen_random_uuid(),
  label_id uuid not null references public.labels (id) on delete cascade,
  match_type text not null,
  match_key text not null,
  status text not null,
  snoozed_until timestamp with time zone,
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint sound_duplicate_candidate_decisions_status_check
    check (status in ('dismissed', 'snoozed')),
  constraint sound_duplicate_candidate_decisions_key_not_empty
    check (length(trim(match_key)) > 0),
  constraint sound_duplicate_candidate_decisions_unique
    unique (label_id, match_type, match_key)
);

comment on table public.sound_duplicate_candidate_decisions is
  'Per-label decisions for Sound Intelligence duplicate suggestions, used to dismiss or temporarily snooze candidate merges.';

create index if not exists sound_duplicate_candidate_decisions_label_status_idx
  on public.sound_duplicate_candidate_decisions (label_id, status, snoozed_until);

alter table public.sound_duplicate_candidate_decisions enable row level security;

create policy "Label members can read sound duplicate decisions"
on public.sound_duplicate_candidate_decisions
for select
to authenticated
using (public.can_access_label(label_id));

create policy "Label members can create sound duplicate decisions"
on public.sound_duplicate_candidate_decisions
for insert
to authenticated
with check (public.can_access_label(label_id));

create policy "Label members can update sound duplicate decisions"
on public.sound_duplicate_candidate_decisions
for update
to authenticated
using (public.can_access_label(label_id))
with check (public.can_access_label(label_id));

create policy "Label members can delete sound duplicate decisions"
on public.sound_duplicate_candidate_decisions
for delete
to authenticated
using (public.can_access_label(label_id));

create or replace function public.touch_sound_duplicate_candidate_decision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists sound_duplicate_candidate_decisions_touch_updated_at
  on public.sound_duplicate_candidate_decisions;

create trigger sound_duplicate_candidate_decisions_touch_updated_at
before update on public.sound_duplicate_candidate_decisions
for each row
execute function public.touch_sound_duplicate_candidate_decision();

create or replace function public.upsert_sound_duplicate_candidate_decision(
  p_label_id uuid,
  p_match_type text,
  p_match_key text,
  p_status text,
  p_snoozed_until timestamp with time zone default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  decision_row public.sound_duplicate_candidate_decisions;
  normalized_status text := lower(trim(p_status));
begin
  if not public.can_access_label(p_label_id) then
    raise exception 'Not authorized for label %', p_label_id
      using errcode = '42501';
  end if;

  if normalized_status not in ('dismissed', 'snoozed') then
    raise exception 'Invalid duplicate candidate decision status: %', p_status
      using errcode = '22023';
  end if;

  insert into public.sound_duplicate_candidate_decisions (
    label_id,
    match_type,
    match_key,
    status,
    snoozed_until
  )
  values (
    p_label_id,
    p_match_type,
    p_match_key,
    normalized_status,
    case
      when normalized_status = 'snoozed'
        then coalesce(p_snoozed_until, now() + interval '7 days')
      else null
    end
  )
  on conflict (label_id, match_type, match_key)
  do update set
    status = excluded.status,
    snoozed_until = excluded.snoozed_until
  returning * into decision_row;

  return to_jsonb(decision_row);
end;
$$;

comment on function public.upsert_sound_duplicate_candidate_decision(uuid, text, text, text, timestamp with time zone) is
  'Dismisses or snoozes one Sound Intelligence duplicate suggestion for the current label.';

create or replace function public.get_sound_duplicate_candidates(p_label_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with accessible as (
    select public.can_access_label(p_label_id) as ok
  ),
  grouped_jobs as (
    select distinct job_id
    from public.sound_canonical_group_members
    where label_id = p_label_id
  ),
  eligible_jobs as (
    select
      sound_intelligence_jobs.id,
      sound_intelligence_jobs.sound_id,
      sound_intelligence_jobs.sound_url,
      sound_intelligence_jobs.track_name,
      sound_intelligence_jobs.artist_name,
      sound_intelligence_jobs.cover_url,
      sound_intelligence_jobs.spotify_id,
      sound_intelligence_jobs.spotify_track_id,
      sound_intelligence_jobs.isrc,
      sound_intelligence_jobs.updated_at,
      sound_intelligence_jobs.status,
      coalesce(sound_intelligence_jobs.source, 'manual') as source,
      coalesce((sound_intelligence_results.analysis ->> 'total_views')::bigint, 0) as total_views,
      lower(regexp_replace(coalesce(sound_intelligence_jobs.track_name, ''), '[^a-z0-9]+', '', 'g')) as normalized_track,
      lower(regexp_replace(coalesce(sound_intelligence_jobs.artist_name, ''), '[^a-z0-9]+', '', 'g')) as normalized_artist
    from public.sound_intelligence_jobs
    left join public.sound_intelligence_results
      on sound_intelligence_results.job_id = sound_intelligence_jobs.id
    where sound_intelligence_jobs.label_id = p_label_id
      and sound_intelligence_jobs.sound_id is not null
      and not exists (
        select 1
        from grouped_jobs
        where grouped_jobs.job_id = sound_intelligence_jobs.id
      )
      and (select ok from accessible)
  ),
  keyed as (
    select 'isrc' as match_type, 0.98::numeric as confidence, isrc as match_key, *
    from eligible_jobs
    where isrc is not null and length(trim(isrc)) > 0
    union all
    select 'spotify_track_id' as match_type, 0.96::numeric as confidence, spotify_track_id as match_key, *
    from eligible_jobs
    where spotify_track_id is not null and length(trim(spotify_track_id)) > 0
    union all
    select 'spotify_id' as match_type, 0.92::numeric as confidence, spotify_id as match_key, *
    from eligible_jobs
    where spotify_id is not null and length(trim(spotify_id)) > 0
    union all
    select
      'title_artist' as match_type,
      0.74::numeric as confidence,
      normalized_track || ':' || normalized_artist as match_key,
      *
    from eligible_jobs
    where length(normalized_track) >= 3
      and length(normalized_artist) >= 2
  ),
  candidates as (
    select
      match_type,
      confidence,
      match_key,
      count(*)::integer as job_count,
      count(*) filter (where source = 'auto_discovery')::integer as roster_job_count,
      bool_and(source = 'auto_discovery') as all_roster,
      array_agg(id order by total_views desc, updated_at desc) as job_ids,
      array_agg(sound_id order by total_views desc, updated_at desc) as sound_ids,
      array_agg(sound_url order by total_views desc, updated_at desc) as sound_urls,
      array_agg(source order by total_views desc, updated_at desc) as sources,
      (array_agg(track_name order by total_views desc, updated_at desc))[1] as track_name,
      (array_agg(artist_name order by total_views desc, updated_at desc))[1] as artist_name,
      (array_agg(cover_url order by total_views desc, updated_at desc))[1] as cover_url,
      sum(total_views)::bigint as total_views
    from keyed
    group by match_type, confidence, match_key
    having count(*) >= 2
  ),
  filtered_decisions as (
    select
      label_id,
      match_type,
      match_key
    from public.sound_duplicate_candidate_decisions
    where label_id = p_label_id
      and (
        status = 'dismissed'
        or (status = 'snoozed' and coalesce(snoozed_until, now()) > now())
      )
  ),
  ranked as (
    select
      candidates.*,
      row_number() over (
        partition by array_to_string(job_ids, ',')
        order by confidence desc, total_views desc
      ) as dedupe_rank
    from candidates
    where not exists (
      select 1
      from filtered_decisions
      where filtered_decisions.label_id = p_label_id
        and filtered_decisions.match_type = candidates.match_type
        and filtered_decisions.match_key = candidates.match_key
    )
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'match_type', match_type,
        'confidence', confidence,
        'match_key', match_key,
        'job_count', job_count,
        'roster_job_count', roster_job_count,
        'all_roster', all_roster,
        'can_auto_merge', all_roster and match_type in ('isrc', 'spotify_track_id', 'spotify_id'),
        'job_ids', job_ids,
        'sound_ids', sound_ids,
        'sound_urls', sound_urls,
        'sources', sources,
        'track_name', track_name,
        'artist_name', artist_name,
        'cover_url', cover_url,
        'total_views', total_views
      )
      order by confidence desc, total_views desc
    ),
    '[]'::jsonb
  )
  from ranked
  where dedupe_rank = 1;
$$;

comment on function public.get_sound_duplicate_candidates(uuid) is
  'Suggests unmerged Sound Intelligence jobs that likely represent the same underlying song, excluding dismissed or active snoozed candidates.';

create or replace function public.auto_merge_high_confidence_sound_duplicates(
  p_label_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  candidate jsonb;
  candidate_job_ids uuid[];
  usable_job_count integer;
  all_jobs_roster boolean;
  primary_job record;
  new_group_id uuid;
  created_count integer := 0;
  created_groups jsonb := '[]'::jsonb;
begin
  if not public.can_access_label(p_label_id) then
    raise exception 'Not authorized for label %', p_label_id
      using errcode = '42501';
  end if;

  for candidate in
    select value
    from jsonb_array_elements(public.get_sound_duplicate_candidates(p_label_id)) as candidates(value)
    where (value ->> 'can_auto_merge')::boolean is true
  loop
    select array_agg(value::uuid)
    into candidate_job_ids
    from jsonb_array_elements_text(candidate -> 'job_ids') as job_ids(value);

    select
      count(*)::integer,
      coalesce(bool_and(coalesce(sound_intelligence_jobs.source, 'manual') = 'auto_discovery'), false)
    into usable_job_count, all_jobs_roster
    from public.sound_intelligence_jobs
    where sound_intelligence_jobs.label_id = p_label_id
      and sound_intelligence_jobs.id = any(candidate_job_ids)
      and not exists (
        select 1
        from public.sound_canonical_group_members
        where sound_canonical_group_members.label_id = p_label_id
          and sound_canonical_group_members.job_id = sound_intelligence_jobs.id
      );

    if usable_job_count < 2 or not all_jobs_roster then
      continue;
    end if;

    select
      sound_intelligence_jobs.id,
      sound_intelligence_jobs.track_name,
      sound_intelligence_jobs.artist_name,
      sound_intelligence_jobs.cover_url
    into primary_job
    from public.sound_intelligence_jobs
    left join public.sound_intelligence_results
      on sound_intelligence_results.job_id = sound_intelligence_jobs.id
    where sound_intelligence_jobs.label_id = p_label_id
      and sound_intelligence_jobs.id = any(candidate_job_ids)
    order by
      coalesce((sound_intelligence_results.analysis ->> 'total_views')::bigint, 0) desc,
      sound_intelligence_jobs.updated_at desc
    limit 1;

    insert into public.sound_canonical_groups (
      label_id,
      name,
      artist_name,
      cover_url,
      primary_job_id
    )
    values (
      p_label_id,
      coalesce(
        nullif(trim(coalesce(primary_job.track_name, '') || case
          when primary_job.artist_name is not null and length(trim(primary_job.artist_name)) > 0
            then ' - ' || primary_job.artist_name
          else ''
        end), ''),
        'Merged roster sound'
      ),
      primary_job.artist_name,
      primary_job.cover_url,
      primary_job.id
    )
    returning id into new_group_id;

    insert into public.sound_canonical_group_members (
      group_id,
      label_id,
      job_id,
      sound_id,
      sound_url,
      alias_label
    )
    select
      new_group_id,
      p_label_id,
      sound_intelligence_jobs.id,
      sound_intelligence_jobs.sound_id,
      coalesce(
        sound_intelligence_jobs.sound_url,
        'https://www.tiktok.com/music/' || sound_intelligence_jobs.sound_id
      ),
      sound_intelligence_jobs.track_name
    from public.sound_intelligence_jobs
    left join public.sound_intelligence_results
      on sound_intelligence_results.job_id = sound_intelligence_jobs.id
    where sound_intelligence_jobs.label_id = p_label_id
      and sound_intelligence_jobs.id = any(candidate_job_ids)
      and sound_intelligence_jobs.sound_id is not null
      and not exists (
        select 1
        from public.sound_canonical_group_members
        where sound_canonical_group_members.label_id = p_label_id
          and sound_canonical_group_members.job_id = sound_intelligence_jobs.id
      )
    order by
      coalesce((sound_intelligence_results.analysis ->> 'total_views')::bigint, 0) desc,
      sound_intelligence_jobs.updated_at desc;

    created_count := created_count + 1;
    created_groups := created_groups || jsonb_build_array(
      jsonb_build_object(
        'group_id', new_group_id,
        'match_type', candidate ->> 'match_type',
        'match_key', candidate ->> 'match_key',
        'job_count', usable_job_count,
        'name', coalesce(primary_job.track_name, 'Merged roster sound')
      )
    );
  end loop;

  return jsonb_build_object(
    'created_count', created_count,
    'groups', created_groups
  );
end;
$$;

comment on function public.auto_merge_high_confidence_sound_duplicates(uuid) is
  'Creates canonical sound groups for unmerged roster-only duplicate candidates matched by ISRC or Spotify IDs.';
