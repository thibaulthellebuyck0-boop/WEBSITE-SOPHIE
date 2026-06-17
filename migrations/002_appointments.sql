-- Run in Supabase SQL Editor (na 001_submissions.sql).
-- Afspraken + contactinzendingen voor /admin-afspraken.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  email text,
  telefoon text,
  datum text,
  tijdstip text,
  onderwerp text not null default '',
  bron text not null default 'website',
  bericht text,
  gemeente text,
  rol text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists appointments_created_idx on public.appointments (created_at desc);
create index if not exists appointments_datum_idx on public.appointments (datum, tijdstip);

alter table public.appointments enable row level security;

revoke all on table public.appointments from anon;
revoke all on table public.appointments from authenticated;
