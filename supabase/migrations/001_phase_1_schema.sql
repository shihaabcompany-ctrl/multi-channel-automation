create extension if not exists "pgcrypto";

create type user_role as enum ('super_admin', 'company_owner', 'company_staff');
create type company_status as enum ('active', 'suspended');
create type company_plan as enum ('free', 'starter', 'pro', 'enterprise');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan company_plan not null default 'free',
  status company_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  role user_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_company_null check (
    (role = 'super_admin' and company_id is null)
    or
    (role in ('company_owner', 'company_staff') and company_id is not null)
  )
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contact_has_email_or_phone check (
    email is not null or phone is not null
  )
);

create table contact_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(company_id, name)
);

create table contact_group_members (
  group_id uuid not null references contact_groups(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (group_id, contact_id)
);

create index companies_status_idx on companies(status);
create index users_company_id_idx on users(company_id);
create index users_email_idx on users(email);
create index contacts_company_id_idx on contacts(company_id);
create index contact_groups_company_id_idx on contact_groups(company_id);
create index contact_group_members_contact_id_idx on contact_group_members(contact_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_set_updated_at
before update on companies
for each row execute function set_updated_at();

create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

create trigger contacts_set_updated_at
before update on contacts
for each row execute function set_updated_at();

create trigger contact_groups_set_updated_at
before update on contact_groups
for each row execute function set_updated_at();