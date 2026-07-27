-- 바위게마을 온라인 베타 1.3.8.55
-- Supabase SQL Editor에서 1회 실행하세요.

alter table public.auction_rooms
  add column if not exists auction_duration_seconds integer not null default 15;

update public.auction_rooms
set auction_duration_seconds = 15
where auction_duration_seconds is null;

alter table public.auction_rooms
  drop constraint if exists auction_rooms_duration_check;

alter table public.auction_rooms
  add constraint auction_rooms_duration_check
  check (auction_duration_seconds between 5 and 300);
