create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  role text not null default '',
  cohort text not null default '',
  university text not null default '',
  course text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  email text not null default '',
  linkedin_url text not null default '',
  github_url text not null default '',
  instagram_url text not null default '',
  goal_2026 text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ( (select auth.uid()) = id );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ( (select auth.uid()) = id );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- ---------------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  issuer text not null,
  issue_date date not null,
  category text not null,
  description text not null,
  file_data text,
  file_name text,
  file_type text,
  skills text[] not null default '{}',
  credential_url text,
  credential_id text,
  hours integer,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists certificates_user_id_idx on public.certificates (user_id);

alter table public.certificates enable row level security;

drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "certificates_insert_own" on public.certificates;
create policy "certificates_insert_own" on public.certificates
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "certificates_update_own" on public.certificates;
create policy "certificates_update_own" on public.certificates
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "certificates_delete_own" on public.certificates;
create policy "certificates_delete_own" on public.certificates
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- prompts
-- ---------------------------------------------------------------------------
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  prompt_text text not null,
  section text not null,
  description text,
  tags text[] not null default '{}',
  variables text[],
  recommended_model text not null,
  is_favorite boolean not null default false,
  usage_count integer not null default 0,
  last_used timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists prompts_user_id_idx on public.prompts (user_id);

alter table public.prompts enable row level security;

drop policy if exists "prompts_select_own" on public.prompts;
create policy "prompts_select_own" on public.prompts
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "prompts_insert_own" on public.prompts;
create policy "prompts_insert_own" on public.prompts
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "prompts_update_own" on public.prompts;
create policy "prompts_update_own" on public.prompts
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "prompts_delete_own" on public.prompts;
create policy "prompts_delete_own" on public.prompts
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  platform text not null,
  status text not null,
  category text not null,
  tone text not null,
  content text not null,
  prompt_used text,
  hashtags text[] not null default '{}',
  visual_idea text,
  scheduled_date date,
  published_url text,
  likes integer,
  comments integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx on public.posts (user_id);

alter table public.posts enable row level security;

drop policy if exists "posts_select_own" on public.posts;
create policy "posts_select_own" on public.posts
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- user_badges
-- ---------------------------------------------------------------------------
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index if not exists user_badges_user_id_idx on public.user_badges (user_id);

alter table public.user_badges enable row level security;

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own" on public.user_badges
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own" on public.user_badges
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );