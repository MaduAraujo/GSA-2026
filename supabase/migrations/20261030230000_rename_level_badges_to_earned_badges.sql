-- Badges are attached as they are earned, not per program level.
alter table public.level_badges rename to earned_badges;
alter table public.earned_badges drop column if exists level;
alter index if exists public.level_badges_user_id_idx rename to earned_badges_user_id_idx;
alter table public.earned_badges rename constraint level_badges_pkey to earned_badges_pkey;
alter table public.earned_badges rename constraint level_badges_user_id_fkey to earned_badges_user_id_fkey;

alter policy "level_badges_select_own" on public.earned_badges rename to "earned_badges_select_own";
alter policy "level_badges_insert_own" on public.earned_badges rename to "earned_badges_insert_own";
alter policy "level_badges_delete_own" on public.earned_badges rename to "earned_badges_delete_own";
