-- 바위게마을 1.3.9.21 : 스네이크 픽
create table if not exists public.snake_draft_settings (
  id integer primary key default 1 check (id = 1),
  team_count integer not null default 2 check (team_count between 2 and 4),
  current_pick integer not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.snake_draft_settings(id, team_count, current_pick)
values (1,2,0)
on conflict (id) do nothing;

create table if not exists public.snake_draft_teams (
  team_no integer primary key check (team_no between 1 and 4),
  name text not null,
  updated_at timestamptz not null default now()
);
insert into public.snake_draft_teams(team_no,name) values
(1,'A팀'),(2,'B팀'),(3,'C팀'),(4,'D팀')
on conflict (team_no) do nothing;

create table if not exists public.snake_draft_players (
  member_id uuid primary key references public.members(id) on delete cascade,
  team_no integer references public.snake_draft_teams(team_no) on delete set null,
  pick_order integer,
  added_at timestamptz not null default now()
);

create index if not exists snake_draft_players_team_idx on public.snake_draft_players(team_no);
alter table public.snake_draft_settings enable row level security;
alter table public.snake_draft_teams enable row level security;
alter table public.snake_draft_players enable row level security;
