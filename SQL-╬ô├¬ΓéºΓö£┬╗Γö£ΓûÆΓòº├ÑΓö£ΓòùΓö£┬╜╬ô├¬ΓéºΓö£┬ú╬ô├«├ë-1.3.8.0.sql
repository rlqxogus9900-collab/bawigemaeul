-- 바위게마을 1.3.8.0 실시간 경매 1차
create extension if not exists pgcrypto;

create table if not exists auction_rooms (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references board_polls(id) on delete set null,
  title text not null default '정기내전 실시간 경매',
  status text not null default 'ready' check (status in ('ready','live','finished')),
  starting_budget integer not null default 1000 check (starting_budget >= 0),
  bid_step integer not null default 10 check (bid_step > 0),
  current_player_id uuid,
  current_bid integer not null default 0,
  current_team_id uuid,
  created_by uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auction_teams (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references auction_rooms(id) on delete cascade,
  name text not null,
  captain_member_id uuid references members(id) on delete set null,
  captain_nickname text not null,
  budget integer not null default 1000 check (budget >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(room_id, captain_member_id)
);

create table if not exists auction_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references auction_rooms(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  nickname text not null,
  status text not null default 'waiting' check (status in ('waiting','nominated','sold','unsold')),
  sold_team_id uuid references auction_teams(id) on delete set null,
  sold_price integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(room_id, member_id)
);

alter table auction_rooms
  drop constraint if exists auction_rooms_current_player_id_fkey;
alter table auction_rooms
  add constraint auction_rooms_current_player_id_fkey
  foreign key (current_player_id) references auction_players(id) on delete set null;

alter table auction_rooms
  drop constraint if exists auction_rooms_current_team_id_fkey;
alter table auction_rooms
  add constraint auction_rooms_current_team_id_fkey
  foreign key (current_team_id) references auction_teams(id) on delete set null;

create table if not exists auction_bids (
  id bigserial primary key,
  room_id uuid not null references auction_rooms(id) on delete cascade,
  player_id uuid not null references auction_players(id) on delete cascade,
  team_id uuid not null references auction_teams(id) on delete cascade,
  amount integer not null check (amount >= 0),
  bidder_member_id uuid references members(id) on delete set null,
  bidder_nickname text not null,
  created_at timestamptz not null default now()
);

create index if not exists auction_rooms_status_idx on auction_rooms(status);
create index if not exists auction_teams_room_idx on auction_teams(room_id);
create index if not exists auction_players_room_status_idx on auction_players(room_id,status);
create index if not exists auction_bids_room_created_idx on auction_bids(room_id,created_at desc);

alter table auction_rooms enable row level security;
alter table auction_teams enable row level security;
alter table auction_players enable row level security;
alter table auction_bids enable row level security;
