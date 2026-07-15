alter table public.members
  add column if not exists tier text not null default '언랭크',
  add column if not exists main_line text not null default '미정',
  add column if not exists sub_line text not null default '미정';
