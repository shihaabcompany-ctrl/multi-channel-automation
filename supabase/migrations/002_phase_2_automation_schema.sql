create type automation_status as enum (
  'draft',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

create type message_channel as enum (
  'email',
  'sms',
  'whatsapp',
  'instagram',
  'facebook',
  'linkedin'
);

create type message_status as enum (
  'pending',
  'sent',
  'failed'
);

create table automations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  media_urls text[] not null default '{}',
  message_text text not null,
  target_channels message_channel[] not null default '{}',
  contact_group_id uuid references contact_groups(id) on delete set null,
  scheduled_at timestamptz,
  recurrence text,
  status automation_status not null default 'draft',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages_log (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references automations(id) on delete set null,
  company_id uuid not null references companies(id) on delete cascade,
  channel message_channel not null,
  recipient text,
  status message_status not null default 'pending',
  error_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index automations_company_id_idx on automations(company_id);
create index automations_status_idx on automations(status);
create index automations_scheduled_at_idx on automations(scheduled_at);
create index automations_contact_group_id_idx on automations(contact_group_id);
create index messages_log_company_id_idx on messages_log(company_id);
create index messages_log_automation_id_idx on messages_log(automation_id);
create index messages_log_status_idx on messages_log(status);
create index messages_log_channel_idx on messages_log(channel);
create index messages_log_created_at_idx on messages_log(created_at);

create trigger automations_set_updated_at
before update on automations
for each row execute function set_updated_at();