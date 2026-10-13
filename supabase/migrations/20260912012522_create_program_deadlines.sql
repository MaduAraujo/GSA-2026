create table if not exists public.program_deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  date date not null,
  category text not null default 'Outro',
  notes text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists program_deadlines_user_id_idx on public.program_deadlines (user_id);

alter table public.program_deadlines enable row level security;

drop policy if exists "program_deadlines_select_own" on public.program_deadlines;
create policy "program_deadlines_select_own" on public.program_deadlines
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "program_deadlines_insert_own" on public.program_deadlines;
create policy "program_deadlines_insert_own" on public.program_deadlines
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "program_deadlines_update_own" on public.program_deadlines;
create policy "program_deadlines_update_own" on public.program_deadlines
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "program_deadlines_delete_own" on public.program_deadlines;
create policy "program_deadlines_delete_own" on public.program_deadlines
  for delete to authenticated
  using ( (select auth.uid()) = user_id );;
