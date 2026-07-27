-- 바위게마을 Online Beta 1.3.8.36
-- 경매 선수 추가용 컬럼을 확실하게 생성하고 Supabase 스키마 캐시를 갱신합니다.

alter table public.auction_players
  add column if not exists main_line text,
  add column if not exists sub_line text,
  add column if not exists match_tier integer,
  add column if not exists note text;

comment on column public.auction_players.main_line is '경매 등록 당시 주라인';
comment on column public.auction_players.sub_line is '경매 등록 당시 부라인';
comment on column public.auction_players.match_tier is '경매 등록 당시 내전티어';
comment on column public.auction_players.note is '해당 경매에서 별도로 입력한 참고사항';

notify pgrst, 'reload schema';
