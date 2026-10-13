create table if not exists public.hosted_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  date date not null,
  duration_minutes integer not null default 60 check (duration_minutes in (30, 45, 60)),
  format text,
  location text,
  notes text,
  participants integer check (participants is null or participants >= 0),
  checklist_done text[] not null default '{}',
  validation_done text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hosted_events_user_id_idx on public.hosted_events (user_id);

alter table public.hosted_events enable row level security;

drop policy if exists "hosted_events_select_own" on public.hosted_events;
create policy "hosted_events_select_own" on public.hosted_events
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "hosted_events_insert_own" on public.hosted_events;
create policy "hosted_events_insert_own" on public.hosted_events
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "hosted_events_update_own" on public.hosted_events;
create policy "hosted_events_update_own" on public.hosted_events
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "hosted_events_delete_own" on public.hosted_events;
create policy "hosted_events_delete_own" on public.hosted_events
  for delete to authenticated
  using ( (select auth.uid()) = user_id );
