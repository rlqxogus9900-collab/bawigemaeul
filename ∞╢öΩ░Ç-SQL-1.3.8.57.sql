create table if not exists public.site_settings (
  id text primary key default 'main',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, settings)
values ('main', '{"activity_days":7,"notice_notifications":true,"regular_match_notifications":true,"event_notifications":true,"homepage_popup":true}'::jsonb)
on conflict (id) do nothing;
