/*
  Sound canonical group RPCs

  Purpose:
  - Reduce frontend fan-out for merged Sound Intelligence views.
  - Return real group-level monitoring history by aggregating member snapshots.
  - Suggest likely duplicate sound IDs by ISRC, Spotify IDs, and normalized
    track/artist metadata.
*/

create or replace function public.can_access_label(p_label_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.user_profiles
    where user_profiles.user_id = auth.uid()
      and user_profiles.label_id = p_label_id
  )
  or exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'::public.app_role
  );
$$;

comment on function public.can_access_label(uuid) is
  'Returns true when the authenticated user can access the requested label.';

create or replace function public.get_sound_canonical_groups(p_label_id uuid)
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
    select
      sound_canonical_group_members.group_id,
      jsonb_agg(
        jsonb_build_object(
          'id', sound_canonical_group_members.id,
          'group_id', sound_canonical_group_members.group_id,
          'label_id', sound_canonical_group_members.label_id,
          'job_id', sound_canonical_group_members.job_id,
          'sound_id', sound_canonical_group_members.sound_id,
          'sound_url', sound_canonical_group_members.sound_url,
          'alias_label', sound_canonical_group_members.alias_label,
          'added_by', sound_canonical_group_members.added_by,
          'created_at', sound_canonical_group_members.created_at
        )
        order by sound_canonical_group_members.created_at
      ) as members,
      count(*)::integer as member_count,
      count(*) filter (where sound_intelligence_jobs.status = 'completed')::integer as completed_count,
      coalesce(sum(sound_intelligence_jobs.videos_analyzed), 0)::integer as videos_analyzed,
      coalesce(sum((sound_intelligence_results.analysis ->> 'total_views')::bigint), 0)::bigint as total_views
    from public.sound_canonical_group_members
    join public.sound_intelligence_jobs
      on sound_intelligence_jobs.id = sound_canonical_group_members.job_id
    left join public.sound_intelligence_results
      on sound_intelligence_results.job_id = sound_intelligence_jobs.id
    where sound_canonical_group_members.label_id = p_label_id
      and (select ok from accessible)
    group by sound_canonical_group_members.group_id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sound_canonical_groups.id,
        'label_id', sound_canonical_groups.label_id,
        'name', sound_canonical_groups.name,
        'artist_name', sound_canonical_groups.artist_name,
        'cover_url', sound_canonical_groups.cover_url,
        'primary_job_id', sound_canonical_groups.primary_job_id,
        'created_by', sound_canonical_groups.created_by,
        'created_at', sound_canonical_groups.created_at,
        'updated_at', sound_canonical_groups.updated_at,
        'members', coalesce(grouped_jobs.members, '[]'::jsonb),
        'summary', jsonb_build_object(
          'member_count', coalesce(grouped_jobs.member_count, 0),
          'completed_count', coalesce(grouped_jobs.completed_count, 0),
          'videos_analyzed', coalesce(grouped_jobs.videos_analyzed, 0),
          'total_views', coalesce(grouped_jobs.total_views, 0)
        )
      )
      order by sound_canonical_groups.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.sound_canonical_groups
  left join grouped_jobs on grouped_jobs.group_id = sound_canonical_groups.id
  where sound_canonical_groups.label_id = p_label_id
    and (select ok from accessible);
$$;

comment on function public.get_sound_canonical_groups(uuid) is
  'Returns merged Sound Intelligence groups with members and lightweight aggregate summary for one label.';

create or replace function public.get_sound_group_detail(
  p_group_id uuid,
  p_label_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with accessible as (
    select public.can_access_label(p_label_id) as ok
  ),
  target_group as (
    select *
    from public.sound_canonical_groups
    where id = p_group_id
      and label_id = p_label_id
      and (select ok from accessible)
  ),
  member_rows as (
    select
      sound_canonical_group_members.id,
      sound_canonical_group_members.group_id,
      sound_canonical_group_members.label_id,
      sound_canonical_group_members.job_id,
      sound_canonical_group_members.sound_id,
      sound_canonical_group_members.sound_url,
      sound_canonical_group_members.alias_label,
      sound_canonical_group_members.added_by,
      sound_canonical_group_members.created_at,
      sound_intelligence_jobs.track_name,
      sound_intelligence_jobs.artist_name,
      sound_intelligence_jobs.album_name,
      sound_intelligence_jobs.cover_url,
      sound_intelligence_jobs.status,
      sound_intelligence_jobs.videos_scraped,
      sound_intelligence_jobs.videos_analyzed,
      sound_intelligence_jobs.created_at as job_created_at,
      sound_intelligence_jobs.completed_at,
      sound_intelligence_jobs.last_refresh_at,
      sound_intelligence_jobs.refresh_count,
      sound_intelligence_jobs.source,
      sound_intelligence_jobs.artist_handle,
      sound_intelligence_jobs.tracking_expires_at,
      sound_intelligence_jobs.user_count,
      sound_intelligence_jobs.monitoring_interval,
      sound_intelligence_jobs.last_monitored_at,
      sound_intelligence_jobs.intensive_since,
      sound_intelligence_jobs.spike_format,
      sound_intelligence_jobs.spotify_id,
      sound_intelligence_jobs.spotify_track_id,
      sound_intelligence_jobs.isrc,
      sound_intelligence_results.analysis
    from public.sound_canonical_group_members
    join public.sound_intelligence_jobs
      on sound_intelligence_jobs.id = sound_canonical_group_members.job_id
    left join public.sound_intelligence_results
      on sound_intelligence_results.job_id = sound_intelligence_jobs.id
    where sound_canonical_group_members.group_id = p_group_id
      and sound_canonical_group_members.label_id = p_label_id
      and (select ok from accessible)
  )
  select case
    when not exists (select 1 from target_group) then null
    else jsonb_build_object(
      'group', (
        select jsonb_build_object(
          'id', target_group.id,
          'label_id', target_group.label_id,
          'name', target_group.name,
          'artist_name', target_group.artist_name,
          'cover_url', target_group.cover_url,
          'primary_job_id', target_group.primary_job_id,
          'created_by', target_group.created_by,
          'created_at', target_group.created_at,
          'updated_at', target_group.updated_at
        )
        from target_group
      ),
      'members', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'member', jsonb_build_object(
                'id', member_rows.id,
                'group_id', member_rows.group_id,
                'label_id', member_rows.label_id,
                'job_id', member_rows.job_id,
                'sound_id', member_rows.sound_id,
                'sound_url', member_rows.sound_url,
                'alias_label', member_rows.alias_label,
                'added_by', member_rows.added_by,
                'created_at', member_rows.created_at
              ),
              'entry', jsonb_build_object(
                'job_id', member_rows.job_id,
                'sound_id', member_rows.sound_id,
                'cover_url', member_rows.cover_url,
                'track_name', member_rows.track_name,
                'artist_name', member_rows.artist_name,
                'album_name', member_rows.album_name,
                'status', member_rows.status,
                'videos_scraped', coalesce(member_rows.videos_scraped, 0),
                'videos_analyzed', coalesce(member_rows.videos_analyzed, 0),
                'created_at', member_rows.job_created_at,
                'completed_at', member_rows.completed_at,
                'last_refresh_at', member_rows.last_refresh_at,
                'refresh_count', coalesce(member_rows.refresh_count, 0),
                'monitoring', case
                  when member_rows.monitoring_interval is null then null
                  else jsonb_build_object(
                    'monitoring_interval', member_rows.monitoring_interval,
                    'last_monitored_at', member_rows.last_monitored_at,
                    'next_check_at', case
                      when member_rows.monitoring_interval = 'intensive'
                        then member_rows.last_monitored_at + interval '15 minutes'
                      when member_rows.monitoring_interval = 'standard'
                        then member_rows.last_monitored_at + interval '3 hours'
                      else null
                    end,
                    'spike_format', member_rows.spike_format,
                    'intensive_since', member_rows.intensive_since
                  )
                end,
                'summary', case
                  when member_rows.analysis is null then null
                  else jsonb_build_object(
                    'engagement_rate', coalesce((member_rows.analysis ->> 'avg_share_rate')::numeric, 0),
                    'share_rate', coalesce((member_rows.analysis ->> 'actual_share_rate')::numeric, null),
                    'winner_format', member_rows.analysis #>> '{winner,format}',
                    'winner_multiplier', coalesce((member_rows.analysis #>> '{winner,multiplier}')::numeric, 0),
                    'total_views', coalesce((member_rows.analysis ->> 'total_views')::bigint, 0),
                    'velocity_status', member_rows.analysis ->> 'status',
                    'peak_day', member_rows.analysis ->> 'peak_day',
                    'format_count', jsonb_array_length(coalesce(member_rows.analysis -> 'formats', '[]'::jsonb)),
                    'videos_analyzed', coalesce((member_rows.analysis ->> 'videos_analyzed')::integer, 0)
                  )
                end,
                'artist_handle', member_rows.artist_handle,
                'source', coalesce(member_rows.source, 'manual'),
                'tracking_expires_at', member_rows.tracking_expires_at
              ),
              'analysis', member_rows.analysis,
              'monitoring', case
                when member_rows.monitoring_interval is null then null
                else jsonb_build_object(
                  'monitoring_interval', member_rows.monitoring_interval,
                  'last_monitored_at', member_rows.last_monitored_at,
                  'next_check_at', case
                    when member_rows.monitoring_interval = 'intensive'
                      then member_rows.last_monitored_at + interval '15 minutes'
                    when member_rows.monitoring_interval = 'standard'
                      then member_rows.last_monitored_at + interval '3 hours'
                    else null
                  end,
                  'spike_format', member_rows.spike_format,
                  'intensive_since', member_rows.intensive_since
                )
              end
            )
            order by member_rows.created_at
          )
          from member_rows
        ),
        '[]'::jsonb
      )
    )
  end;
$$;

comment on function public.get_sound_group_detail(uuid, uuid) is
  'Returns one merged sound group with member jobs, analysis JSON, summaries, and monitoring state.';

create or replace function public.get_sound_group_monitoring_history(
  p_group_id uuid,
  p_label_id uuid,
  p_hours integer default 24
)
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  with accessible as (
    select public.can_access_label(p_label_id) as ok
  ),
  member_jobs as (
    select job_id
    from public.sound_canonical_group_members
    where group_id = p_group_id
      and label_id = p_label_id
      and (select ok from accessible)
  ),
  raw_snapshots as (
    select
      date_trunc('hour', sound_monitoring_snapshots.captured_at) as captured_bucket,
      sound_monitoring_snapshots.*
    from public.sound_monitoring_snapshots
    join member_jobs on member_jobs.job_id = sound_monitoring_snapshots.job_id
    where sound_monitoring_snapshots.captured_at >= now() - make_interval(hours => greatest(p_hours, 1))
  ),
  bucket_totals as (
    select
      captured_bucket,
      min(id) as id,
      max(captured_at) as captured_at,
      sum(coalesce(user_count, 0))::integer as user_count,
      sum(coalesce(total_videos, 0))::integer as total_videos,
      sum(coalesce(total_views, 0))::bigint as total_views,
      sum(coalesce(total_likes, 0))::bigint as total_likes,
      sum(coalesce(total_comments, 0))::bigint as total_comments,
      sum(coalesce(total_shares, 0))::bigint as total_shares,
      sum(coalesce(new_videos_count, 0))::integer as new_videos_count
    from raw_snapshots
    group by captured_bucket
  ),
  format_flat as (
    select
      raw_snapshots.captured_bucket,
      format_stats.key as name,
      sum(coalesce((format_stats.value ->> 'count')::numeric, 0))::integer as count,
      sum(coalesce((format_stats.value ->> 'views')::numeric, 0))::bigint as views,
      sum(coalesce((format_stats.value ->> 'likes')::numeric, 0))::bigint as likes,
      sum(coalesce((format_stats.value ->> 'shares')::numeric, 0))::bigint as shares,
      sum(coalesce((format_stats.value ->> 'comments')::numeric, 0))::bigint as comments
    from raw_snapshots
    cross join lateral jsonb_each(raw_snapshots.format_stats) as format_stats(key, value)
    group by raw_snapshots.captured_bucket, format_stats.key
  ),
  format_json as (
    select
      captured_bucket,
      jsonb_object_agg(
        name,
        jsonb_build_object(
          'count', count,
          'views', views,
          'likes', likes,
          'shares', shares,
          'comments', comments,
          'engagement', case when views > 0 then round(((likes + shares + comments)::numeric / views::numeric) * 100, 2) else 0 end
        )
      ) as format_stats
    from format_flat
    group by captured_bucket
  ),
  niche_flat as (
    select
      raw_snapshots.captured_bucket,
      niche_stats.key as name,
      sum(coalesce((niche_stats.value ->> 'count')::numeric, 0))::integer as count,
      sum(coalesce((niche_stats.value ->> 'views')::numeric, 0))::bigint as views,
      sum(coalesce((niche_stats.value ->> 'likes')::numeric, 0))::bigint as likes
    from raw_snapshots
    cross join lateral jsonb_each(coalesce(raw_snapshots.niche_stats, '{}'::jsonb)) as niche_stats(key, value)
    group by raw_snapshots.captured_bucket, niche_stats.key
  ),
  niche_json as (
    select
      captured_bucket,
      jsonb_object_agg(
        name,
        jsonb_build_object('count', count, 'views', views, 'likes', likes)
      ) as niche_stats
    from niche_flat
    group by captured_bucket
  ),
  intent_flat as (
    select
      raw_snapshots.captured_bucket,
      intent_stats.key as name,
      sum(coalesce((intent_stats.value ->> 'count')::numeric, 0))::integer as count,
      sum(coalesce((intent_stats.value ->> 'views')::numeric, 0))::bigint as views,
      sum(coalesce((intent_stats.value ->> 'likes')::numeric, 0))::bigint as likes
    from raw_snapshots
    cross join lateral jsonb_each(coalesce(raw_snapshots.intent_stats, '{}'::jsonb)) as intent_stats(key, value)
    group by raw_snapshots.captured_bucket, intent_stats.key
  ),
  intent_json as (
    select
      captured_bucket,
      jsonb_object_agg(
        name,
        jsonb_build_object('count', count, 'views', views, 'likes', likes)
      ) as intent_stats
    from intent_flat
    group by captured_bucket
  ),
  snapshots as (
    select
      jsonb_build_object(
        'id', bucket_totals.id,
        'job_id', p_group_id,
        'sound_id', p_group_id::text,
        'captured_at', bucket_totals.captured_at,
        'user_count', bucket_totals.user_count,
        'total_videos', bucket_totals.total_videos,
        'total_views', bucket_totals.total_views,
        'total_likes', bucket_totals.total_likes,
        'total_comments', bucket_totals.total_comments,
        'total_shares', bucket_totals.total_shares,
        'new_videos_count', bucket_totals.new_videos_count,
        'format_stats', coalesce(format_json.format_stats, '{}'::jsonb),
        'niche_stats', coalesce(niche_json.niche_stats, '{}'::jsonb),
        'intent_stats', coalesce(intent_json.intent_stats, '{}'::jsonb)
      ) as snapshot,
      bucket_totals.captured_at,
      bucket_totals.total_views,
      bucket_totals.total_videos
    from bucket_totals
    left join format_json on format_json.captured_bucket = bucket_totals.captured_bucket
    left join niche_json on niche_json.captured_bucket = bucket_totals.captured_bucket
    left join intent_json on intent_json.captured_bucket = bucket_totals.captured_bucket
  ),
  first_last as (
    select
      (select total_views from snapshots order by captured_at asc limit 1) as first_views,
      (select total_views from snapshots order by captured_at desc limit 1) as last_views,
      (select total_videos from snapshots order by captured_at asc limit 1) as first_videos,
      (select total_videos from snapshots order by captured_at desc limit 1) as last_videos,
      extract(epoch from (
        (select captured_at from snapshots order by captured_at desc limit 1) -
        (select captured_at from snapshots order by captured_at asc limit 1)
      )) / 3600 as hours_span
  ),
  format_start_end as (
    select
      name,
      (array_agg(views order by captured_bucket asc))[1] as views_start,
      (array_agg(views order by captured_bucket desc))[1] as views_end,
      (array_agg(count order by captured_bucket asc))[1] as count_start,
      (array_agg(count order by captured_bucket desc))[1] as count_end
    from format_flat
    group by name
  ),
  format_growth as (
    select coalesce(
      jsonb_object_agg(
        name,
        jsonb_build_object(
          'views_start', views_start,
          'views_end', views_end,
          'views_delta', views_end - views_start,
          'growth_pct', case when views_start > 0 then round(((views_end - views_start)::numeric / views_start::numeric) * 100, 1) else 0 end,
          'count_start', count_start,
          'count_end', count_end
        )
      ),
      '{}'::jsonb
    ) as value
    from format_start_end
  )
  select jsonb_build_object(
    'snapshots', coalesce((select jsonb_agg(snapshot order by captured_at) from snapshots), '[]'::jsonb),
    'summary', jsonb_build_object(
      'snapshot_count', coalesce((select count(*) from snapshots), 0),
      'hours_span', coalesce((select hours_span from first_last), 0),
      'total_view_growth', coalesce((select last_views - first_views from first_last), 0),
      'total_video_growth', coalesce((select last_videos - first_videos from first_last), 0),
      'format_growth', (select value from format_growth)
    )
  );
$$;

comment on function public.get_sound_group_monitoring_history(uuid, uuid, integer) is
  'Aggregates member sound monitoring snapshots into one group-level monitoring history payload.';

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
      array_agg(id order by total_views desc, updated_at desc) as job_ids,
      array_agg(sound_id order by total_views desc, updated_at desc) as sound_ids,
      array_agg(sound_url order by total_views desc, updated_at desc) as sound_urls,
      (array_agg(track_name order by total_views desc, updated_at desc))[1] as track_name,
      (array_agg(artist_name order by total_views desc, updated_at desc))[1] as artist_name,
      (array_agg(cover_url order by total_views desc, updated_at desc))[1] as cover_url,
      sum(total_views)::bigint as total_views
    from keyed
    group by match_type, confidence, match_key
    having count(*) >= 2
  ),
  ranked as (
    select
      *,
      row_number() over (
        partition by array_to_string(job_ids, ',')
        order by confidence desc, total_views desc
      ) as dedupe_rank
    from candidates
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'match_type', match_type,
        'confidence', confidence,
        'match_key', match_key,
        'job_count', job_count,
        'job_ids', job_ids,
        'sound_ids', sound_ids,
        'sound_urls', sound_urls,
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
  'Suggests unmerged Sound Intelligence jobs that likely represent the same underlying song.';
