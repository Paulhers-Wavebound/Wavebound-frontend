-- Create content plans table
create table if not exists content_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  plan jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create content plan drafts table
create table if not exists content_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  draft jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user selected videos table
create table if not exists user_selected_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  video_id bigint not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table content_plans enable row level security;
alter table content_plan_drafts enable row level security;
alter table user_selected_videos enable row level security;

-- Create RLS policies for content_plans
create policy "cp read own" on content_plans for select using (user_id = auth.uid());
create policy "cp insert own" on content_plans for insert with check (user_id = auth.uid());
create policy "cp update own" on content_plans for update using (user_id = auth.uid());
create policy "cp delete own" on content_plans for delete using (user_id = auth.uid());

-- Create RLS policies for content_plan_drafts
create policy "drafts read own" on content_plan_drafts for select using (user_id = auth.uid());
create policy "drafts insert own" on content_plan_drafts for insert with check (user_id = auth.uid());
create policy "drafts update own" on content_plan_drafts for update using (user_id = auth.uid());
create policy "drafts delete own" on content_plan_drafts for delete using (user_id = auth.uid());

-- Create RLS policies for user_selected_videos
create policy "usv read own" on user_selected_videos for select using (user_id = auth.uid());
create policy "usv insert own" on user_selected_videos for insert with check (user_id = auth.uid());
create policy "usv delete own" on user_selected_videos for delete using (user_id = auth.uid());

-- Create robust distinct genres function
create or replace function get_distinct_genres()
returns table(genre text)
language sql as $$
with g as (
  select case
    when trim(genre) like '[%' then jsonb_array_elements_text(genre::jsonb)
    else regexp_split_to_table(genre, '\\s*/\\s*|\\s*,\\s*')
  end as tag
  from tiktok_videos_all
)
select distinct trim(tag) as genre
from g
where coalesce(trim(tag),'') <> '';
$$;

-- Create robust distinct sub-genres function
create or replace function get_distinct_sub_genres()
returns table(sub_genre text)
language sql as $$
with s as (
  select case
    when trim(sub_genre) like '[%' then jsonb_array_elements_text(sub_genre::jsonb)
    else regexp_split_to_table(sub_genre, '\\s*/\\s*|\\s*,\\s*')
  end as tag
  from tiktok_videos_all
)
select distinct trim(tag) as sub_genre
from s
where coalesce(trim(tag),'') <> '';
$$;