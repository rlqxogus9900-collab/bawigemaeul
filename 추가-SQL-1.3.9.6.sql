-- 바위게마을 1.3.9.6 : 휴가 신청
create table if not exists public.member_vacations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null,
  memo text,
  created_at timestamptz not null default now(),
  constraint member_vacations_date_check check (end_date >= start_date)
);
create index if not exists member_vacations_member_idx on public.member_vacations(member_id);
create index if not exists member_vacations_period_idx on public.member_vacations(start_date,end_date);
alter table public.member_vacations enable row level security;
