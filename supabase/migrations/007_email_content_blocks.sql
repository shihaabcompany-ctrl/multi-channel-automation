alter table automations
add column if not exists email_content_blocks jsonb not null default '[]'::jsonb;
