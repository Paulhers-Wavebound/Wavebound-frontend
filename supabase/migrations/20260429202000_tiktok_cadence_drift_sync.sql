-- tiktok_cadence_drift_sync
--
-- Keep tiktok_video_summary cadence fields aligned with the fresher roster
-- metrics that power Content & Social triage. This prevents stale categorical
-- cadence labels from contradicting the roster table and expanded cadence tile.

create or replace function public.derive_tiktok_posting_cadence(
  freq_7d double precision,
  freq_30d double precision,
  days_since integer
)
returns text
language sql
immutable
as $$
  select case
    when greatest(coalesce(freq_7d, 0), coalesce(freq_30d, 0)) >= 5
      then 'daily'
    when greatest(coalesce(freq_7d, 0), coalesce(freq_30d, 0)) >= 1
      then 'regular'
    when greatest(coalesce(freq_7d, 0), coalesce(freq_30d, 0)) >= 0.5
      then 'sporadic'
    when days_since > 21
      then 'dormant'
    else 'inactive'
  end;
$$;

create or replace view public.tiktok_cadence_drift_check as
with target as (
  select distinct on (s.entity_id)
    s.entity_id,
    d.artist_handle,
    s.posting_cadence as current_posting_cadence,
    public.derive_tiktok_posting_cadence(
      r.posting_freq_7d,
      r.posting_freq_30d,
      r.days_since_last_post
    ) as expected_posting_cadence,
    s.days_since_last_post as current_days_since_last_post,
    r.days_since_last_post as expected_days_since_last_post,
    r.posting_freq_7d,
    r.posting_freq_30d,
    r.last_post_date
  from public.tiktok_video_summary s
  join public.artist_content_dna d on d.entity_id = s.entity_id
  join public.roster_dashboard_metrics r
    on lower(regexp_replace(r.artist_handle, '^@', '')) =
       lower(regexp_replace(d.artist_handle, '^@', ''))
  where r.posting_freq_7d is not null
     or r.posting_freq_30d is not null
     or r.days_since_last_post is not null
  order by s.entity_id, r.last_post_date desc nulls last, r.label_id
)
select *
from target
where current_posting_cadence is distinct from expected_posting_cadence
   or current_days_since_last_post is distinct from expected_days_since_last_post;

create or replace function public.refresh_tiktok_cadence_from_roster()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  with target as (
    select distinct on (s.entity_id)
      s.entity_id,
      r.days_since_last_post as expected_days_since_last_post,
      public.derive_tiktok_posting_cadence(
        r.posting_freq_7d,
        r.posting_freq_30d,
        r.days_since_last_post
      ) as expected_posting_cadence
    from public.tiktok_video_summary s
    join public.artist_content_dna d on d.entity_id = s.entity_id
    join public.roster_dashboard_metrics r
      on lower(regexp_replace(r.artist_handle, '^@', '')) =
         lower(regexp_replace(d.artist_handle, '^@', ''))
    where r.posting_freq_7d is not null
       or r.posting_freq_30d is not null
       or r.days_since_last_post is not null
    order by s.entity_id, r.last_post_date desc nulls last, r.label_id
  ),
  updated as (
    update public.tiktok_video_summary s
    set
      posting_cadence = target.expected_posting_cadence,
      days_since_last_post = target.expected_days_since_last_post
    from target
    where s.entity_id = target.entity_id
      and (
        s.posting_cadence is distinct from target.expected_posting_cadence
        or s.days_since_last_post is distinct from target.expected_days_since_last_post
      )
    returning 1
  )
  select count(*) into updated_count
  from updated;

  return coalesce(updated_count, 0);
end;
$$;

do $$
begin
  perform cron.unschedule('daily-tiktok-cadence-drift-sync');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'daily-tiktok-cadence-drift-sync',
  '20 11 * * *',
  $$select public.refresh_tiktok_cadence_from_roster();$$
);
