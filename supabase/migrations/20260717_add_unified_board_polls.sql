alter table public.board_posts
  add column if not exists post_type text not null default 'normal'
  check (post_type in ('normal', 'poll'));

create table if not exists public.board_polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.board_posts(id) on delete cascade,
  poll_type text not null default 'general'
    check (poll_type in ('general', 'regular_match')),
  allow_multiple boolean not null default false,
  match_at timestamptz,
  vote_deadline timestamptz,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  is_auction_source boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.board_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.board_polls(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  vote_count integer not null default 0
);

create table if not exists public.board_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.board_polls(id) on delete cascade,
  option_id uuid not null references public.board_poll_options(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_nickname text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, option_id, member_id)
);

create table if not exists public.board_poll_captains (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.board_polls(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_nickname text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, member_id)
);

create index if not exists board_poll_options_poll_idx
  on public.board_poll_options (poll_id, sort_order);

create index if not exists board_poll_votes_poll_member_idx
  on public.board_poll_votes (poll_id, member_id);

create index if not exists board_poll_captains_poll_idx
  on public.board_poll_captains (poll_id);

alter table public.board_polls enable row level security;
alter table public.board_poll_options enable row level security;
alter table public.board_poll_votes enable row level security;
alter table public.board_poll_captains enable row level security;

create or replace function public.sync_board_poll_option_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_option_id uuid;
begin
  affected_option_id := coalesce(new.option_id, old.option_id);

  update public.board_poll_options
  set vote_count = (
    select count(*)::integer
    from public.board_poll_votes
    where option_id = affected_option_id
  )
  where id = affected_option_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists board_poll_votes_sync_count
  on public.board_poll_votes;

create trigger board_poll_votes_sync_count
after insert or delete on public.board_poll_votes
for each row
execute function public.sync_board_poll_option_count();
