alter table public.board_categories
  add column if not exists is_visible boolean not null default true,
  add column if not exists access_level text not null default 'member';

alter table public.board_subcategories
  add column if not exists is_visible boolean not null default true,
  add column if not exists access_level text not null default 'member';

alter table public.board_categories
  drop constraint if exists board_categories_access_level_check;

alter table public.board_categories
  add constraint board_categories_access_level_check
  check (access_level in ('member', 'staff'));

alter table public.board_subcategories
  drop constraint if exists board_subcategories_access_level_check;

alter table public.board_subcategories
  add constraint board_subcategories_access_level_check
  check (access_level in ('member', 'staff'));
