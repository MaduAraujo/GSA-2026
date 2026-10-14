create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id text not null,
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table public.session_summaries enable row level security;

drop policy if exists "session_summaries_select_own" on public.session_summaries;
create policy "session_summaries_select_own" on public.session_summaries
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "session_summaries_insert_own" on public.session_summaries;
create policy "session_summaries_insert_own" on public.session_summaries
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "session_summaries_delete_own" on public.session_summaries;
create policy "session_summaries_delete_own" on public.session_summaries
  for delete to authenticated
  using ( (select auth.uid()) = user_id );
