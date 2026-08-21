-- 바위게마을 1.3.9.19 : 운영진 후원금 회계 관리
create table if not exists public.donation_ledger (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income','expense')),
  title text not null,
  amount bigint not null check (amount > 0),
  occurred_on date not null default current_date,
  memo text,
  created_at timestamptz not null default now()
);
create index if not exists donation_ledger_date_idx on public.donation_ledger(occurred_on desc);
alter table public.donation_ledger enable row level security;
