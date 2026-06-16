-- Run this in the Supabase SQL Editor for your project.
-- Then set CCO_SUBMIT.enabled = true in config.js with your project URL and anon key.

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

-- No public read access — only service role / dashboard can view submissions.

insert into storage.buckets (id, name, public)
values ('proxy-signatures', 'proxy-signatures', false)
on conflict (id) do nothing;

drop policy if exists "Allow anonymous signature upload" on storage.objects;
create policy "Allow anonymous signature upload"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'proxy-signatures');
