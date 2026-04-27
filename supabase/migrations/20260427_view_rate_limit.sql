-- Rate-limited view tracking: same IP + tattoo dedup'd to once per hour.
-- Only callable by service_role (the /api/track-view route bridges client → RPC).

-- Replace the old version with one that takes ip_hash and dedups
create or replace function public.record_tattoo_view(tattoo_id uuid, ip_hash text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from views v
    where v.tattoo_id = record_tattoo_view.tattoo_id
      and v.ip_hash  = record_tattoo_view.ip_hash
      and v.viewed_at > now() - interval '1 hour'
  ) then
    return;
  end if;

  insert into views (tattoo_id, ip_hash) values (tattoo_id, ip_hash);
  update tattoos set view_count = view_count + 1 where id = tattoo_id;
end;
$$;

-- Lock down: only service role can call. Drop the old (uuid)-only signature too.
drop function if exists public.record_tattoo_view(uuid);
revoke all on function public.record_tattoo_view(uuid, text) from public, anon, authenticated;

create index if not exists views_tattoo_ip_time_idx
  on views (tattoo_id, ip_hash, viewed_at desc);

-- Schema drift fixes (these columns already exist in production but are missing
-- from schema.sql; add idempotently for parity).
alter table tattoos add column if not exists alt_text text;
alter table styles add column if not exists is_hidden boolean default false;
