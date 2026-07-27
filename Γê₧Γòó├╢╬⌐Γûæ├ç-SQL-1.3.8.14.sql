-- 바위게마을 Online Beta 1.3.8.14
-- 바위게 신문고 테이블 생성/보강

create extension if not exists pgcrypto;

create table if not exists public.whistle_reports (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'other' check (category in ('suggestion','bug','report','other')),
  title text not null,
  content text not null,
  image_url text,
  is_anonymous boolean not null default true,
  display_name text,
  author_member_id uuid references public.members(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','reviewing','completed')),
  staff_reply text,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whistle_reports add column if not exists category text not null default 'other';
alter table public.whistle_reports add column if not exists title text not null default '제목 없음';
alter table public.whistle_reports add column if not exists content text not null default '';
alter table public.whistle_reports add column if not exists image_url text;
alter table public.whistle_reports add column if not exists is_anonymous boolean not null default true;
alter table public.whistle_reports add column if not exists display_name text;
alter table public.whistle_reports add column if not exists author_member_id uuid references public.members(id) on delete set null;
alter table public.whistle_reports add column if not exists status text not null default 'pending';
alter table public.whistle_reports add column if not exists staff_reply text;
alter table public.whistle_reports add column if not exists answered_at timestamptz;
alter table public.whistle_reports add column if not exists created_at timestamptz not null default now();
alter table public.whistle_reports add column if not exists updated_at timestamptz not null default now();

create index if not exists whistle_reports_created_at_idx on public.whistle_reports(created_at desc);
create index if not exists whistle_reports_status_idx on public.whistle_reports(status);

alter table public.whistle_reports enable row level security;
-- 홈페이지 서버는 SUPABASE_SERVICE_ROLE_KEY를 사용하므로 별도 공개 정책 없이 안전하게 동작합니다.
