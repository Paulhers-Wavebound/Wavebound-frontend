-- =============================================================================
-- Fan Account Briefs — Sprint 1 Schema Migration
-- Purpose: Create content_catalog, content_segments, fan_briefs tables,
--          segment_hybrid_search() RPC, and fan-briefs storage bucket.
-- Affected tables: content_catalog (new), content_segments (new), fan_briefs (new)
-- Dependencies: artist_intelligence, labels, user_profiles (all existing)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. content_catalog — discovered long-form source material (NO vectors)
-- ---------------------------------------------------------------------------
create table public.content_catalog (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.artist_intelligence(id) on delete cascade,
  artist_handle text not null,
  label_id uuid references public.labels(id),
  source_platform text not null check (source_platform in ('youtube', 'tiktok', 'instagram', 'podcast', 'other')),
  source_url text unique not null,
  video_id text,
  title text,
  description text,
  channel_name text,
  upload_date timestamptz,
  duration_seconds int,
  view_count bigint,
  transcript text,
  transcript_timestamps jsonb,
  transcript_source text,
  metadata jsonb default '{}',
  is_processed boolean default false,
  processed_at timestamptz,
  created_at timestamptz default now()
);
comment on table public.content_catalog is 'Discovered long-form source material (YouTube interviews, podcasts, fan cams) with transcripts. Deduped via source_url UNIQUE. No vectors — queried by artist_handle, platform, date.';

-- Indexes
create index idx_cc_artist on public.content_catalog(artist_handle);
create index idx_cc_label on public.content_catalog(label_id);
create index idx_cc_platform on public.content_catalog(source_platform);
create index idx_cc_processed on public.content_catalog(is_processed) where is_processed = false;
create unique index idx_cc_video on public.content_catalog(source_platform, video_id) where video_id is not null;

-- RLS
alter table public.content_catalog enable row level security;

create policy "Label members can view their content catalog"
  on public.content_catalog
  for select
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can insert content catalog"
  on public.content_catalog
  for insert
  to authenticated
  with check (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can update content catalog"
  on public.content_catalog
  for update
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  )
  with check (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can delete content catalog"
  on public.content_catalog
  for delete
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Service role full access to content_catalog"
  on public.content_catalog
  for all
  to service_role
  using (true)
  with check (true);


-- ---------------------------------------------------------------------------
-- 2. content_segments — key moments with vectors for hybrid RAG search
-- ---------------------------------------------------------------------------
create table public.content_segments (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid references public.content_catalog(id) on delete cascade,
  artist_handle text not null,
  label_id uuid,
  start_seconds numeric not null,
  end_seconds numeric not null,
  duration_seconds numeric generated always as (end_seconds - start_seconds) stored,
  speaker text,
  transcript_excerpt text not null,
  moment_summary text not null,
  moment_type text,
  fan_potential_score int default 0 check (fan_potential_score between 0 and 100),
  visual_description text,
  visual_confirmed boolean default false,

  -- Clip extraction
  clip_storage_path text,
  clip_storage_url text,
  clip_extracted_at timestamptz,

  -- RAG infrastructure
  content text not null,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(768),

  metadata jsonb default '{}',
  created_at timestamptz default now()
);
comment on table public.content_segments is 'Key moments extracted from content_catalog via two-stage analysis (Claude transcript + Gemini video). Core RAG table with 768-dim embeddings and full-text search for hybrid retrieval.';

-- Indexes
create index idx_cs_artist on public.content_segments(artist_handle);
create index idx_cs_label on public.content_segments(label_id);
create index idx_cs_catalog on public.content_segments(catalog_id);
create index idx_cs_score on public.content_segments(fan_potential_score desc);
create index idx_cs_type on public.content_segments(moment_type);
create index idx_cs_fts on public.content_segments using gin (fts);
create index idx_cs_embedding on public.content_segments using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

-- RLS
alter table public.content_segments enable row level security;

create policy "Label members can view their content segments"
  on public.content_segments
  for select
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can insert content segments"
  on public.content_segments
  for insert
  to authenticated
  with check (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can update content segments"
  on public.content_segments
  for update
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  )
  with check (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can delete content segments"
  on public.content_segments
  for delete
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Service role full access to content_segments"
  on public.content_segments
  for all
  to service_role
  using (true)
  with check (true);


-- ---------------------------------------------------------------------------
-- 3. fan_briefs — final AI-generated brief output
-- ---------------------------------------------------------------------------
create table public.fan_briefs (
  id uuid primary key default gen_random_uuid(),
  artist_handle text not null,
  artist_id uuid references public.artist_intelligence(id),
  label_id uuid references public.labels(id),
  segment_id uuid references public.content_segments(id),

  -- Brief content
  hook_text text not null,
  caption text,
  format_recommendation text not null,
  platform_recommendation text[],
  sound_pairing text,
  why_now text not null,
  confidence_score int default 0 check (confidence_score between 0 and 100),

  -- Source reference
  source_url text,
  source_title text,
  timestamp_start numeric,
  timestamp_end numeric,
  youtube_timestamp_url text,

  -- Extracted clip
  clip_storage_path text,
  clip_storage_url text,
  clip_duration_seconds numeric,

  -- Workflow
  status text default 'pending' check (status in ('pending', 'approved', 'skipped', 'modified', 'posted', 'archived')),
  approved_by uuid,
  approved_at timestamptz,
  modified_hook text,
  posted_url text,

  -- Metadata
  generation_context jsonb default '{}',
  created_at timestamptz default now()
);
comment on table public.fan_briefs is 'AI-generated fan account content briefs. One row per brief suggestion. Status workflow: pending → approved → posted → tracked. Dedup via artist_handle + source_url + timestamp proximity + 7-day window.';

-- Indexes
create index idx_fb_artist on public.fan_briefs(artist_handle);
create index idx_fb_label on public.fan_briefs(label_id);
create index idx_fb_status on public.fan_briefs(status);
create index idx_fb_created on public.fan_briefs(created_at desc);
create index idx_fb_score on public.fan_briefs(confidence_score desc);
create index idx_fb_dedup on public.fan_briefs(artist_handle, source_url, timestamp_start, created_at);

-- RLS
alter table public.fan_briefs enable row level security;

create policy "Label members can view their briefs"
  on public.fan_briefs
  for select
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can insert briefs"
  on public.fan_briefs
  for insert
  to authenticated
  with check (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can update brief status"
  on public.fan_briefs
  for update
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  )
  with check (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Label members can delete briefs"
  on public.fan_briefs
  for delete
  to authenticated
  using (
    label_id in (select label_id from public.user_profiles where user_id = (select auth.uid()))
  );

create policy "Service role full access to fan_briefs"
  on public.fan_briefs
  for all
  to service_role
  using (true)
  with check (true);


-- ---------------------------------------------------------------------------
-- 4. segment_hybrid_search() — RPC for hybrid semantic + full-text search
-- ---------------------------------------------------------------------------
create or replace function public.segment_hybrid_search(
  query_text text,
  query_embedding vector(768),
  p_artist_handle text default null,
  p_label_id uuid default null,
  p_moment_type text default null,
  match_count int default 20,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns setof public.content_segments
language sql
stable
security invoker
set search_path = 'public'
as $$
  with full_text as (
    select
      id,
      row_number() over (order by ts_rank_cd(fts, websearch_to_tsquery(query_text)) desc) as rank_ix
    from
      public.content_segments
    where
      fts @@ websearch_to_tsquery(query_text)
      and (p_artist_handle is null or artist_handle = p_artist_handle)
      and (p_label_id is null or label_id = p_label_id)
      and (p_moment_type is null or moment_type = p_moment_type)
    order by rank_ix
    limit least(match_count, 50) * 2
  ),
  semantic as (
    select
      id,
      row_number() over (order by embedding <=> query_embedding) as rank_ix
    from
      public.content_segments
    where
      embedding is not null
      and (p_artist_handle is null or artist_handle = p_artist_handle)
      and (p_label_id is null or label_id = p_label_id)
      and (p_moment_type is null or moment_type = p_moment_type)
    order by rank_ix
    limit least(match_count, 50) * 2
  )
  select public.content_segments.*
  from full_text
  full outer join semantic on full_text.id = semantic.id
  join public.content_segments on coalesce(full_text.id, semantic.id) = public.content_segments.id
  order by
    coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
    coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight desc
  limit least(match_count, 50);
$$;
comment on function public.segment_hybrid_search is 'Hybrid search (RRF fusion of BM25 full-text + cosine vector similarity) over content_segments. Same pattern as artist_hybrid_search.';


-- ---------------------------------------------------------------------------
-- 5. Supabase Storage bucket: fan-briefs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fan-briefs',
  'fan-briefs',
  false,
  52428800,  -- 50MB max
  array['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/mp4', 'image/jpeg', 'image/png']
);

-- Storage RLS: label members can read clips for their label's artists
create policy "Label members can view fan brief clips"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'fan-briefs'
  );

create policy "Service role can upload fan brief clips"
  on storage.objects
  for insert
  to service_role
  with check (
    bucket_id = 'fan-briefs'
  );

create policy "Service role can update fan brief clips"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'fan-briefs')
  with check (bucket_id = 'fan-briefs');

create policy "Service role can delete fan brief clips"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'fan-briefs');
