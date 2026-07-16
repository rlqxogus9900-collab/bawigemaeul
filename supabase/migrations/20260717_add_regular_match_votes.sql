create table if not exists public.regular_match_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  match_at timestamptz,
  vote_deadline timestamptz,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regular_match_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.regular_match_events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_nickname text not null,
  choice text not null default 'undecided'
    check (choice in ('attending', 'absent', 'undecided')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create table if not exists public.regular_match_captains (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.regular_match_events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_nickname text not null,
  team_name text,
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create index if not exists regular_match_events_created_idx
  on public.regular_match_events (created_at desc);

create index if not exists regular_match_votes_event_choice_idx
  on public.regular_match_votes (event_id, choice);

create index if not exists regular_match_captains_event_idx
  on public.regular_match_captains (event_id);

alter table public.regular_match_events enable row level security;
alter table public.regular_match_votes enable row level security;
alter table public.regular_match_captains enable row level security;
