-- 바위게마을 Online Beta 1.3.8.32
-- 정기내전 클랜원별/라인별 KDA 및 승률 집계용 상세 기록

create table if not exists public.regular_match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_result_id uuid references public.regular_match_results(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  line text not null check (line in ('탑','정글','미드','원딜','서폿')),
  kills integer not null default 0 check (kills >= 0),
  deaths integer not null default 0 check (deaths >= 0),
  assists integer not null default 0 check (assists >= 0),
  is_win boolean not null default false,
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists regular_match_player_stats_member_idx
  on public.regular_match_player_stats(member_id, played_at desc);

create index if not exists regular_match_player_stats_member_line_idx
  on public.regular_match_player_stats(member_id, line, played_at desc);

alter table public.regular_match_player_stats enable row level security;
