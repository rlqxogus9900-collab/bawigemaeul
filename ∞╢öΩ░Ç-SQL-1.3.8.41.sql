-- 바위게마을 온라인 베타 1.3.8.41
-- 후원자 바위게 아이콘 선택값

alter table public.sponsors
  add column if not exists icon_key text not null default 'none';

alter table public.sponsors
  drop constraint if exists sponsors_icon_key_check;

alter table public.sponsors
  add constraint sponsors_icon_key_check
  check (icon_key in ('none', 'bronze', 'silver', 'gold', 'rainbow'));
