create index if not exists board_posts_subcategory_created_idx
  on public.board_posts (subcategory_id, created_at desc);

create index if not exists board_posts_title_search_idx
  on public.board_posts using gin (to_tsvector('simple', title));
