-- 바위게마을 1.3.9.24
-- 1) 내전 공지
-- 2) 운영진 전용 회원 참고사항

create table if not exists public.match_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists match_notices_pinned_created_idx
on public.match_notices(is_pinned desc, created_at desc);

alter table public.match_notices enable row level security;

alter table public.members
  add column if not exists staff_note text;

-- staff_note는 서버의 운영진 전용 명단 설정 API에서만 조회/저장합니다.
-- 일반 명단/투표/경매/스네이크픽 API에는 이 컬럼을 포함하지 않습니다.
