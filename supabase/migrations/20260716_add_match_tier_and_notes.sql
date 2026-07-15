alter table public.members
  add column if not exists match_tier integer,
  add column if not exists reference_note text;

alter table public.members
  drop constraint if exists members_match_tier_check;

alter table public.members
  add constraint members_match_tier_check
  check (match_tier is null or match_tier between 1 and 5);
