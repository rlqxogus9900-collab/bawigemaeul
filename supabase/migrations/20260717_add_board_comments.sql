create table if not exists public.board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  author_member_id uuid references public.members(id) on delete set null,
  author_nickname text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_comments_post_created_idx
  on public.board_comments (post_id, created_at asc);

alter table public.board_comments enable row level security;

create or replace function public.sync_board_post_comment_count()
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
  set comment_count = (
    select count(*)::integer
    from public.board_comments
    where post_id = affected_post_id
  )
  where id = affected_post_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists board_comments_sync_count on public.board_comments;

create trigger board_comments_sync_count
after insert or delete on public.board_comments
for each row
execute function public.sync_board_post_comment_count();

update public.board_posts post
set comment_count = (
  select count(*)::integer
  from public.board_comments comment
  where comment.post_id = post.id
);
