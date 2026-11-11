alter table public.sessions
  add column if not exists type text not null default 'Sessão'
  check (type in ('Conversa', 'Masterclass', 'Sessão'));

-- Classifica as sessões já registradas pelo título.
update public.sessions set type = 'Conversa' where title ilike 'conversa%';
update public.sessions set type = 'Masterclass' where title ilike '%masterclass%';
