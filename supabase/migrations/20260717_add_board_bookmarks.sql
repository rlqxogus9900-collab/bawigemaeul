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
