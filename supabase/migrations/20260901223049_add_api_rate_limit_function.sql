create table if not exists public.api_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);

alter table public.api_rate_limits enable row level security;

create or replace function public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_window_seconds integer,
  p_max_requests integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.api_rate_limits (user_id, window_start, request_count)
  values (p_user_id, now(), 1)
  on conflict (user_id) do update
    set request_count = case
          when public.api_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then 1
          else public.api_rate_limits.request_count + 1
        end,
        window_start = case
          when public.api_rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
            then now()
          else public.api_rate_limits.window_start
        end
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.check_and_increment_rate_limit(uuid, integer, integer) from public;
grant execute on function public.check_and_increment_rate_limit(uuid, integer, integer) to service_role;
;
