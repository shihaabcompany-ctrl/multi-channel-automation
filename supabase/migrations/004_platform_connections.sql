create type platform_connection_platform as enum (
  'whatsapp',
  'instagram',
  'facebook',
  'linkedin'
);

create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  platform platform_connection_platform not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  expires_at timestamptz,
  external_account_id text not null,
  connected_account_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(company_id, platform)
);

create index platform_connections_company_id_idx
on platform_connections(company_id);

create trigger platform_connections_set_updated_at
before update on platform_connections
for each row execute function set_updated_at();

alter table platform_connections enable row level security;

create policy "service_role_full_access_platform_connections"
on platform_connections
for all
to service_role
using (true)
with check (true);
