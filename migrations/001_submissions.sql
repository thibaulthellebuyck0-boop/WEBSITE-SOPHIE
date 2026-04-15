-- Run this in Supabase SQL Editor (Project → SQL) after creating the project.
-- Inzendingen worden alleen geschreven door de serverless functie met de service role key (RLS wordt daarbij omzeild).

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form text not null check (form in ('contact', 'recruit')),
  payload jsonb not null default '{}'::jsonb,
  source_ip text,
  created_at timestamptz not null default now()
);

create index if not exists submissions_form_created_idx on public.submissions (form, created_at desc);

alter table public.submissions enable row level security;

-- Geen INSERT/SELECT voor anon of authenticated: alleen backend met service role.
revoke all on table public.submissions from anon;
revoke all on table public.submissions from authenticated;
