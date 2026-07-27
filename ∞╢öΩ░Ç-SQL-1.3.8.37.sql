-- 바위게마을 Online Beta 1.3.8.37
-- 경매방별 내전티어 최소 입찰가 설정

alter table public.auction_rooms
  add column if not exists tier_min_bids jsonb not null
  default '{"1":300,"2":250,"3":200,"4":150,"5":100}'::jsonb;

update public.auction_rooms
set tier_min_bids = '{"1":300,"2":250,"3":200,"4":150,"5":100}'::jsonb
where tier_min_bids is null;

notify pgrst, 'reload schema';
