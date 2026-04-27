-- Replace broad "any authenticated user" RLS policies with an admin-email whitelist.
-- To add or remove an admin: edit the array below and re-run this CREATE OR REPLACE block.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = any (
      array['clown1138@gmail.com', 'yykoart@gmail.com']
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- artists
drop policy if exists "Auth insert artists" on artists;
drop policy if exists "Auth update artists" on artists;
drop policy if exists "Auth delete artists" on artists;
create policy "Admin insert artists" on artists for insert with check (public.is_admin());
create policy "Admin update artists" on artists for update using (public.is_admin());
create policy "Admin delete artists" on artists for delete using (public.is_admin());

-- tattoos
drop policy if exists "Auth insert tattoos" on tattoos;
drop policy if exists "Auth update tattoos" on tattoos;
drop policy if exists "Auth delete tattoos" on tattoos;
create policy "Admin insert tattoos" on tattoos for insert with check (public.is_admin());
create policy "Admin update tattoos" on tattoos for update using (public.is_admin());
create policy "Admin delete tattoos" on tattoos for delete using (public.is_admin());

-- views: only allow inserts via the record_tattoo_view RPC (security definer),
-- not direct table writes from clients.
drop policy if exists "Public insert views" on views;
drop policy if exists "Allow anonymous inserts" on views;

create or replace function public.record_tattoo_view(tattoo_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into views (tattoo_id) values (tattoo_id);
  update tattoos set view_count = view_count + 1 where id = tattoo_id;
end;
$$;

revoke all on function public.record_tattoo_view(uuid) from public;
grant execute on function public.record_tattoo_view(uuid) to anon, authenticated;

-- styles: lock writes to admins (currently no write policy exists, but be explicit)
drop policy if exists "Admin insert styles" on styles;
drop policy if exists "Admin update styles" on styles;
drop policy if exists "Admin delete styles" on styles;
create policy "Admin insert styles" on styles for insert with check (public.is_admin());
create policy "Admin update styles" on styles for update using (public.is_admin());
create policy "Admin delete styles" on styles for delete using (public.is_admin());

-- Make increment_view_count callable from client (anon + authenticated) so view
-- counting still works after the views-insert policy is removed.
revoke all on function public.increment_view_count(uuid) from public;
grant execute on function public.increment_view_count(uuid) to anon, authenticated;
