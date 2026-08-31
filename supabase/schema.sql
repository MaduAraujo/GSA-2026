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

alter table public.prompts add column if not exists shared_docs text[];

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
-- prompt_docs — document library uploaded to test alongside prompts
-- ---------------------------------------------------------------------------
create table if not exists public.prompt_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  file_path text,
  file_data text,
  file_type text not null,
  file_size integer,
  created_at timestamptz not null default now()
);

-- migrating from inline base64 (file_data) to Supabase Storage (file_path);
-- keep file_data nullable so old rows already saved as base64 keep working
alter table public.prompt_docs add column if not exists file_path text;
alter table public.prompt_docs alter column file_data drop not null;

create index if not exists prompt_docs_user_id_idx on public.prompt_docs (user_id);

alter table public.prompt_docs enable row level security;

drop policy if exists "prompt_docs_select_own" on public.prompt_docs;
create policy "prompt_docs_select_own" on public.prompt_docs
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "prompt_docs_insert_own" on public.prompt_docs;
create policy "prompt_docs_insert_own" on public.prompt_docs
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "prompt_docs_delete_own" on public.prompt_docs;
create policy "prompt_docs_delete_own" on public.prompt_docs
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- storage: prompt-docs bucket — large file uploads for the Documentos library
-- (up to 1GB per file; files are private, scoped by a "<user_id>/..." path)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('prompt-docs', 'prompt-docs', false, 1073741824)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists "prompt_docs_storage_select_own" on storage.objects;
create policy "prompt_docs_storage_select_own" on storage.objects
  for select to authenticated
  using ( bucket_id = 'prompt-docs' and (select auth.uid())::text = (storage.foldername(name))[1] );

drop policy if exists "prompt_docs_storage_insert_own" on storage.objects;
create policy "prompt_docs_storage_insert_own" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'prompt-docs' and (select auth.uid())::text = (storage.foldername(name))[1] );

drop policy if exists "prompt_docs_storage_delete_own" on storage.objects;
create policy "prompt_docs_storage_delete_own" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'prompt-docs' and (select auth.uid())::text = (storage.foldername(name))[1] );

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

-- ---------------------------------------------------------------------------
-- challenges
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default '',
  status text not null default 'Pendente',
  deadline date,
  link text,
  points integer,
  result text,
  result_image text,
  result_link text,
  result_platform text,
  linked_post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.challenges add column if not exists result text;
alter table public.challenges add column if not exists result_image text;
alter table public.challenges add column if not exists result_link text;
alter table public.challenges add column if not exists result_platform text;
alter table public.challenges add column if not exists linked_post_id uuid references public.posts (id) on delete set null;

create index if not exists challenges_user_id_idx on public.challenges (user_id);

alter table public.challenges enable row level security;

drop policy if exists "challenges_select_own" on public.challenges;
create policy "challenges_select_own" on public.challenges
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "challenges_insert_own" on public.challenges;
create policy "challenges_insert_own" on public.challenges
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "challenges_update_own" on public.challenges;
create policy "challenges_update_own" on public.challenges
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "challenges_delete_own" on public.challenges;
create policy "challenges_delete_own" on public.challenges
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- gallery_photos — photos related to the program (welcome kit, events, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  image_data text not null,
  caption text not null default '',
  category text not null default '',
  taken_at date,
  created_at timestamptz not null default now()
);

create index if not exists gallery_photos_user_id_idx on public.gallery_photos (user_id);

alter table public.gallery_photos enable row level security;

drop policy if exists "gallery_photos_select_own" on public.gallery_photos;
create policy "gallery_photos_select_own" on public.gallery_photos
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "gallery_photos_insert_own" on public.gallery_photos;
create policy "gallery_photos_insert_own" on public.gallery_photos
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "gallery_photos_update_own" on public.gallery_photos;
create policy "gallery_photos_update_own" on public.gallery_photos
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "gallery_photos_delete_own" on public.gallery_photos;
create policy "gallery_photos_delete_own" on public.gallery_photos
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- profiles: public portfolio sharing
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists is_public boolean not null default false;
alter table public.profiles add column if not exists public_slug text unique;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select to anon
  using ( is_public = true );

drop policy if exists "certificates_select_public" on public.certificates;
create policy "certificates_select_public" on public.certificates
  for select to anon
  using (
    exists (
      select 1 from public.profiles p
      where p.id = certificates.user_id and p.is_public = true
    )
  );

-- ---------------------------------------------------------------------------
-- chat_sessions / chat_messages 
-- ---------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx on public.chat_sessions (user_id);

alter table public.chat_sessions enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own" on public.chat_sessions
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own" on public.chat_sessions
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own" on public.chat_sessions
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own" on public.chat_sessions
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender text not null check (sender in ('user', 'gemini')),
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own" on public.chat_messages
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own" on public.chat_messages
  for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ---------------------------------------------------------------------------
-- push_subscriptions — Web Push endpoints for real (app-closed) notifications
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated
  using ( (select auth.uid()) = user_id );