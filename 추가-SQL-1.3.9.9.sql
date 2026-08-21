-- 바위게마을 1.3.9.9 : 휴가 등록 안정화
-- 이미 테이블이 있어도 안전하게 다시 실행할 수 있습니다.

create table if not exists public.member_vacations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null,
  memo text,
  created_at timestamptz not null default now()
);

alter table public.member_vacations
  add column if not exists member_id uuid,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists reason text,
  add column if not exists memo text,
  add column if not exists created_at timestamptz default now();

create index if not exists member_vacations_member_idx
  on public.member_vacations(member_id);
create index if not exists member_vacations_period_idx
  on public.member_vacations(start_date,end_date);

alter table public.member_vacations enable row level security;
