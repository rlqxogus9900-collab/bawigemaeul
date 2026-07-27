-- 1.3.8.27 Riot API 활동 자동 집계용 컬럼
alter table public.members add column if not exists riot_puuid text;
alter table public.members add column if not exists riot_sync_status text not null default 'not_synced';
alter table public.members add column if not exists riot_sync_error text;
alter table public.members add column if not exists last_riot_sync_at timestamptz;
alter table public.members add column if not exists last_game_at timestamptz;

create index if not exists members_riot_puuid_idx on public.members(riot_puuid);
create index if not exists members_last_game_at_idx on public.members(last_game_at desc);
