alter table public.board_posts
  add column if not exists like_count integer not null default 0;

create table if not exists public.board_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, member_id)
);

create index if not exists board_post_likes_post_idx
  on public.board_post_likes (post_id);

create index if not exists board_post_likes_member_idx
  on public.board_post_likes (member_id);

alter table public.board_post_likes enable row level security;

create or replace function public.sync_board_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_post_id uuid;
begin
  affected_post_id := coalesce(new.post_id, old.post_id);

  update public.board_posts
  set like_count = (
    select count(*)::integer
    from public.board_post_likes
    where post_id = affected_post_id
  )
  where id = affected_post_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists board_post_likes_sync_count
  on public.board_post_likes;

create trigger board_post_likes_sync_count
after insert or delete on public.board_post_likes
for each row
execute function public.sync_board_post_like_count();

update public.board_posts post
set like_count = (
  select count(*)::integer
  from public.board_post_likes item
  where item.post_id = post.id
);
