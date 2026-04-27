-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Styles table
create table styles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique
);

-- Artists table
create table artists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  bio text,
  avatar_url text,
  instagram text,
  created_at timestamptz default now()
);

-- Tattoos table
create table tattoos (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid references artists(id) on delete cascade,
  image_url text not null,
  width integer,
  height integer,
  title text,
  style text,
  tags text[] default '{}',
  view_count integer default 0,
  created_at timestamptz default now()
);

-- Views tracking table
create table views (
  id uuid primary key default uuid_generate_v4(),
  tattoo_id uuid references tattoos(id) on delete cascade,
  ip_hash text,
  viewed_at timestamptz default now()
);

-- Indexes for search performance
create index tattoos_artist_id_idx on tattoos(artist_id);
create index tattoos_style_idx on tattoos(style);
create index tattoos_created_at_idx on tattoos(created_at desc);

-- Seed default styles
insert into styles (name, slug) values
  ('傳統', 'traditional'),
  ('新傳統', 'neo-traditional'),
  ('幾何', 'geometric'),
  ('水彩', 'watercolor'),
  ('黑灰', 'black-grey'),
  ('日式', 'japanese'),
  ('寫實', 'realism'),
  ('點刺', 'dotwork'),
  ('細線', 'fine-line'),
  ('老派', 'old-school');

-- RLS Policies
alter table artists enable row level security;
alter table tattoos enable row level security;
alter table views enable row level security;
alter table styles enable row level security;

-- Public read access
create policy "Public read artists" on artists for select using (true);
create policy "Public read tattoos" on tattoos for select using (true);
create policy "Public read styles" on styles for select using (true);

-- Admin email whitelist. To add/remove admin: edit the array below and re-run this block.
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

-- Admin write access
create policy "Admin insert artists" on artists for insert with check (public.is_admin());
create policy "Admin update artists" on artists for update using (public.is_admin());
create policy "Admin delete artists" on artists for delete using (public.is_admin());

create policy "Admin insert tattoos" on tattoos for insert with check (public.is_admin());
create policy "Admin update tattoos" on tattoos for update using (public.is_admin());
create policy "Admin delete tattoos" on tattoos for delete using (public.is_admin());

create policy "Admin insert styles" on styles for insert with check (public.is_admin());
create policy "Admin update styles" on styles for update using (public.is_admin());
create policy "Admin delete styles" on styles for delete using (public.is_admin());

-- View-count writes: clients call the RPC; no direct insert policy on `views`.
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
