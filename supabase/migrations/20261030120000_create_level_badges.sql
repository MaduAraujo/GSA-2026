create table if not exists public.level_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  level smallint not null default 2 check (level > 0),
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists level_badges_user_id_idx on public.level_badges (user_id);

alter table public.level_badges enable row level security;

drop policy if exists "level_badges_select_own" on public.level_badges;
create policy "level_badges_select_own" on public.level_badges
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "level_badges_insert_own" on public.level_badges;
create policy "level_badges_insert_own" on public.level_badges
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "level_badges_delete_own" on public.level_badges;
create policy "level_badges_delete_own" on public.level_badges
  for delete to authenticated
  using ( (select auth.uid()) = user_id );
