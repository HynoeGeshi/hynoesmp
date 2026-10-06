-- Private server-owned Ask Hynoe knowledge artifact.
create table if not exists public.site_help_knowledge (
  id boolean primary key default true check (id),
  index_json jsonb not null,
  source_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_help_knowledge enable row level security;
revoke all on public.site_help_knowledge from public, anon, authenticated;
grant select, insert, update on public.site_help_knowledge to service_role;
