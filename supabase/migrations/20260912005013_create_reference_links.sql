create table if not exists public.reference_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  shared_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reference_links_user_id_idx on public.reference_links (user_id);

alter table public.reference_links enable row level security;

drop policy if exists "reference_links_select_own" on public.reference_links;
create policy "reference_links_select_own" on public.reference_links
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "reference_links_insert_own" on public.reference_links;
create policy "reference_links_insert_own" on public.reference_links
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "reference_links_update_own" on public.reference_links;
create policy "reference_links_update_own" on public.reference_links
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "reference_links_delete_own" on public.reference_links;
create policy "reference_links_delete_own" on public.reference_links
  for delete to authenticated
  using ( (select auth.uid()) = user_id );;
