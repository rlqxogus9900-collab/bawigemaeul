-- 바위게마을 1.3.9.25 : 스네이크 픽 팀장 지정
alter table public.snake_draft_players
  add column if not exists is_captain boolean not null default false;

create index if not exists snake_draft_players_captain_idx
on public.snake_draft_players(is_captain, team_no);
