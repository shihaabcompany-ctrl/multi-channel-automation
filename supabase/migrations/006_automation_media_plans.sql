alter table automations
add column if not exists social_caption text,
add column if not exists media_items jsonb not null default '[]'::jsonb;
