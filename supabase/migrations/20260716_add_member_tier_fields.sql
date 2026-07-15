alter table public.members
  add column if not exists current_tier text,
  add column if not exists highest_tier text,
  add column if not exists average_tier text;
