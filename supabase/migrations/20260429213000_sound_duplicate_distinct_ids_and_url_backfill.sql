/*
  Sound duplicate cleanup

  Purpose:
  - Canonicalize stored TikTok sound URLs from /music/-<id> to /music/<id>.
  - Ensure duplicate suggestions only surface when at least two distinct
    TikTok sound IDs are present.
*/

update public.sound_intelligence_jobs
set sound_url = 'https://www.tiktok.com/music/' || sound_id
where sound_id is not null
  and length(trim(sound_id)) > 0
  and sound_url is distinct from ('https://www.tiktok.com/music/' || sound_id);

update public.sound_canonical_group_members
set sound_url = 'https://www.tiktok.com/music/' || sound_id
where sound_id is not null
  and length(trim(sound_id)) > 0
  and sound_url is distinct from ('https://www.tiktok.com/music/' || sound_id);

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
      coalesce(
        sound_intelligence_jobs.sound_url,
        'https://www.tiktok.com/music/' || sound_intelligence_jobs.sound_id
      ) as sound_url,
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
      and length(trim(sound_intelligence_jobs.sound_id)) > 0
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
  one_job_per_sound_id as (
    select *
    from (
      select
        keyed.*,
        row_number() over (
          partition by match_type, match_key, sound_id
          order by total_views desc, updated_at desc
        ) as sound_rank
      from keyed
    ) ranked_sounds
    where sound_rank = 1
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
    from one_job_per_sound_id
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
  'Suggests unmerged Sound Intelligence jobs that likely represent the same underlying song, excluding dismissed or active snoozed candidates and requiring at least two distinct sound IDs.';
