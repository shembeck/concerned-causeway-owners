-- Run this in the Supabase SQL Editor for your project.
-- Then set CCO_SUPABASE.enabled = true in config.js with your project URL and anon key.

-- ── Proxy submissions (optional — not used; proxies are mailed/scanned only) ──

create table if not exists public.proxy_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_name_1 text not null,
  owner_name_2 text,
  units jsonb not null,
  signed_date date not null,
  printed_name text not null,
  phone text not null,
  email text not null,
  deed_note text,
  signature_path text not null
);

alter table public.proxy_submissions enable row level security;

drop policy if exists "Allow anonymous proxy insert" on public.proxy_submissions;
create policy "Allow anonymous proxy insert"
  on public.proxy_submissions
  for insert
  to anon
  with check (true);

insert into storage.buckets (id, name, public)
values ('proxy-signatures', 'proxy-signatures', false)
on conflict (id) do nothing;

drop policy if exists "Allow anonymous signature upload" on storage.objects;
create policy "Allow anonymous signature upload"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'proxy-signatures');

-- ── Zoom / in-person sessions ─────────────────────────────────────────────────

create table if not exists public.zoom_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text,
  session_type text not null default 'zoom' check (session_type in ('zoom', 'in_person')),
  starts_at timestamptz not null,
  zoom_url text,
  location text,
  is_featured boolean not null default false,
  is_active boolean not null default true
);

create index if not exists zoom_sessions_starts_at_idx on public.zoom_sessions (starts_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists zoom_sessions_updated_at on public.zoom_sessions;
create trigger zoom_sessions_updated_at
  before update on public.zoom_sessions
  for each row execute function public.set_updated_at();

-- Admin allowlist — add emails here, then create matching users in Supabase Auth.
create table if not exists public.admin_emails (
  email text primary key
);

insert into public.admin_emails (email) values
  ('info@causewayongullowners.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.zoom_sessions enable row level security;

drop policy if exists "Public can read active sessions" on public.zoom_sessions;
create policy "Public can read active sessions"
  on public.zoom_sessions
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins can insert sessions" on public.zoom_sessions;
create policy "Admins can insert sessions"
  on public.zoom_sessions
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update sessions" on public.zoom_sessions;
create policy "Admins can update sessions"
  on public.zoom_sessions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete sessions" on public.zoom_sessions;
create policy "Admins can delete sessions"
  on public.zoom_sessions
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can read all sessions" on public.zoom_sessions;
create policy "Admins can read all sessions"
  on public.zoom_sessions
  for select
  to authenticated
  using (public.is_admin());

-- Example session (optional — edit the date/link or delete after setup)
insert into public.zoom_sessions (title, description, session_type, starts_at, zoom_url, is_featured, is_active)
select
  'Owner Zoom Session — 7:00 PM CT',
  'Join fellow owners to learn more, ask questions, and hear the latest developments.',
  'zoom',
  '2026-06-17T00:00:00+00:00'::timestamptz,
  'https://us02web.zoom.us/j/88435142486?pwd=slNPLFtKuYIO002vaDyDIz34Ci0hqj.1',
  true,
  true
where not exists (select 1 from public.zoom_sessions);
