-- content_social_cadence_metrics
--
-- Shared cadence truth for Content & Social surfaces. Roster metrics are the
-- freshest source for posting frequency/recency, while tiktok_video_summary
-- carries long-lived aggregate context. This view exposes the derived cadence
-- category and whether the summary row has drifted.

create or replace view public.content_social_cadence_metrics as
with roster as (
  select distinct on (
      r.label_id,
      lower(regexp_replace(r.artist_handle, '^@', ''))
    )
    r.label_id,
    r.artist_handle,
    r.artist_name,
    lower(regexp_replace(r.artist_handle, '^@', '')) as normalized_artist_handle,
    r.days_since_last_post,
    r.posting_freq_7d,
    r.posting_freq_30d,
    r.last_post_date,
    case
      when r.posting_freq_7d is null
       and r.posting_freq_30d is null
       and r.days_since_last_post is null
        then null
      else public.derive_tiktok_posting_cadence(
        r.posting_freq_7d,
        r.posting_freq_30d,
        r.days_since_last_post
      )
    end as posting_cadence
  from public.roster_dashboard_metrics r
  order by
    r.label_id,
    lower(regexp_replace(r.artist_handle, '^@', '')),
    r.last_post_date desc nulls last,
    r.computed_at desc nulls last
),
dna as (
  select distinct on (
      lower(regexp_replace(d.artist_handle, '^@', ''))
    )
    lower(regexp_replace(d.artist_handle, '^@', '')) as normalized_artist_handle,
    d.entity_id,
    d.artist_handle as dna_artist_handle
  from public.artist_content_dna d
  order by
    lower(regexp_replace(d.artist_handle, '^@', '')),
    d.videos_analyzed desc nulls last,
    d.entity_id
)
select
  r.label_id,
  r.artist_handle,
  r.artist_name,
  r.normalized_artist_handle,
  d.entity_id,
  d.dna_artist_handle,
  r.posting_freq_7d,
  r.posting_freq_30d,
  r.days_since_last_post,
  r.last_post_date,
  r.posting_cadence,
  s.posting_cadence as summary_posting_cadence,
  s.days_since_last_post as summary_days_since_last_post,
  s.consistency_score,
  (
    s.entity_id is not null
    and (
      s.posting_cadence is distinct from r.posting_cadence
      or s.days_since_last_post is distinct from r.days_since_last_post
    )
  ) as has_drift
from roster r
left join dna d
  on d.normalized_artist_handle = r.normalized_artist_handle
left join public.tiktok_video_summary s
  on s.entity_id = d.entity_id;

grant select on public.content_social_cadence_metrics to authenticated;
grant select on public.content_social_cadence_metrics to service_role;
