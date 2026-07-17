create extension if not exists pgcrypto;

create type public.member_role as enum ('member','staff');
create type public.activity_status as enum ('active','inactive');

create table public.members (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  riot_id text not null unique,
  puuid text unique,
  role public.member_role not null default 'member',
  password_hash text not null,
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  activity_status public.activity_status not null default 'active',
  activity_excluded boolean not null default false,
  activity_exclusion_reason text,
  last_clan_game_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.clan_rules (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.regular_match_results (
  id uuid primary key default gen_random_uuid(),
  team_a_name text not null,
  team_b_name text not null,
  team_a_sets integer not null default 0,
  team_b_sets integer not null default 0,
  winner_name text not null,
  played_at timestamptz not null default now()
);

create table public.activity_exclusions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.notices enable row level security;
alter table public.clan_rules enable row level security;
alter table public.regular_match_results enable row level security;
alter table public.activity_exclusions enable row level security;

-- 현재 앱은 서버 전용 service_role로 DB에 접근합니다.
-- 브라우저에서 직접 테이블을 읽거나 수정하지 않으므로 public 정책은 만들지 않습니다.


create table if not exists public.board_post_bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, member_id)
);

create index if not exists board_post_bookmarks_member_created_idx
  on public.board_post_bookmarks(member_id, created_at desc);

create index if not exists board_post_bookmarks_post_idx
  on public.board_post_bookmarks(post_id);

alter table public.board_post_bookmarks enable row level security;
