-- 바위게마을 1.3.8.4 경매 팀장 정보 / 티어 보정
alter table auction_rooms
  add column if not exists tier_balance_enabled boolean not null default true,
  add column if not exists tier_bonus_per_tier integer not null default 100;

alter table auction_teams
  add column if not exists captain_match_tier integer,
  add column if not exists captain_average_tier text,
  add column if not exists base_budget integer not null default 1000,
  add column if not exists tier_bonus integer not null default 0,
  add column if not exists starting_budget integer not null default 1000;

update auction_teams
set base_budget = coalesce(base_budget, budget, 1000),
    starting_budget = coalesce(starting_budget, budget, 1000),
    tier_bonus = coalesce(tier_bonus, 0);
