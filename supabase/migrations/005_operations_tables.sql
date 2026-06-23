create table platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table inbox_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  channel message_channel not null,
  sender text not null,
  content text not null,
  status text not null default 'unread',
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index audit_logs_actor_user_id_idx on audit_logs(actor_user_id);
create index audit_logs_company_id_idx on audit_logs(company_id);
create index audit_logs_created_at_idx on audit_logs(created_at);
create index audit_logs_action_idx on audit_logs(action);

create index inbox_messages_company_id_idx on inbox_messages(company_id);
create index inbox_messages_channel_idx on inbox_messages(channel);
create index inbox_messages_status_idx on inbox_messages(status);
create index inbox_messages_received_at_idx on inbox_messages(received_at);

create trigger platform_settings_set_updated_at
before update on platform_settings
for each row execute function set_updated_at();

alter table platform_settings enable row level security;
alter table audit_logs enable row level security;
alter table inbox_messages enable row level security;

create policy "service_role_full_access_platform_settings"
on platform_settings
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_audit_logs"
on audit_logs
for all
to service_role
using (true)
with check (true);

create policy "service_role_full_access_inbox_messages"
on inbox_messages
for all
to service_role
using (true)
with check (true);
