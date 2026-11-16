alter table public.earned_badges add column if not exists is_favorite boolean not null default false;

drop policy if exists "earned_badges_update_own" on public.earned_badges;
create policy "earned_badges_update_own" on public.earned_badges
  for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "certificates_select_public" on public.certificates;
drop policy if exists "user_files_storage_select_public_certs" on storage.objects;
