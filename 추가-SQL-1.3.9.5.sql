-- 바위게마을 1.3.9.5 회원가입 승인 기능 DB 보완
-- 기존 회원 데이터는 유지하고, 없는 컬럼만 추가합니다.

alter table public.members add column if not exists approval_status text not null default 'approved';
alter table public.members add column if not exists rejection_reason text;
alter table public.members add column if not exists current_tier text not null default '미정';
alter table public.members add column if not exists highest_tier text not null default '미정';
alter table public.members add column if not exists match_tier integer;
alter table public.members add column if not exists main_line text not null default '미정';
alter table public.members add column if not exists sub_line text not null default '미정';
alter table public.members add column if not exists notes text;

alter table public.members drop constraint if exists members_approval_status_check;
alter table public.members add constraint members_approval_status_check
  check (approval_status in ('pending','approved','rejected'));

alter table public.members drop constraint if exists members_match_tier_check;
alter table public.members add constraint members_match_tier_check
  check (match_tier is null or match_tier between 1 and 5);

update public.members
set approval_status = 'approved'
where approval_status is null or btrim(approval_status) = '';

create index if not exists members_approval_status_idx
  on public.members(approval_status, created_at desc);
