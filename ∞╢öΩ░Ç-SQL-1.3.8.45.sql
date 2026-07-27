-- 바위게마을 온라인 베타 1.3.8.45
-- 후원 아이콘을 홈페이지 닉네임에 정확히 연결

alter table public.sponsors
  add column if not exists sponsor_nickname text;

update public.sponsors
set sponsor_nickname = display_name
where sponsor_nickname is null or btrim(sponsor_nickname) = '';
