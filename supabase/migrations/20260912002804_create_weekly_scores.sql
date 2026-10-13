create table if not exists public.weekly_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  points integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weekly_scores_user_id_idx on public.weekly_scores (user_id);

alter table public.weekly_scores enable row level security;

drop policy if exists "weekly_scores_select_own" on public.weekly_scores;
create policy "weekly_scores_select_own" on public.weekly_scores
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "weekly_scores_insert_own" on public.weekly_scores;
create policy "weekly_scores_insert_own" on public.weekly_scores
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "weekly_scores_update_own" on public.weekly_scores;
create policy "weekly_scores_update_own" on public.weekly_scores
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "weekly_scores_delete_own" on public.weekly_scores;
create policy "weekly_scores_delete_own" on public.weekly_scores
  for delete to authenticated
  using ( (select auth.uid()) = user_id );;
