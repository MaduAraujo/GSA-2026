create table if not exists public.earned_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists earned_badges_user_id_idx on public.earned_badges (user_id);

alter table public.earned_badges enable row level security;

drop policy if exists "earned_badges_select_own" on public.earned_badges;
create policy "earned_badges_select_own" on public.earned_badges
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "earned_badges_insert_own" on public.earned_badges;
create policy "earned_badges_insert_own" on public.earned_badges
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "earned_badges_delete_own" on public.earned_badges;
create policy "earned_badges_delete_own" on public.earned_badges
  for delete to authenticated
  using ( (select auth.uid()) = user_id );
