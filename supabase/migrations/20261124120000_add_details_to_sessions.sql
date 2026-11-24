alter table public.sessions
  add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  add column if not exists notes text,
  add column if not exists past_session_id text;
