-- 바위게마을 1.3.9.1 회원가입 승인 시스템
alter table public.members add column if not exists approval_status text not null default 'approved';
alter table public.members add column if not exists rejection_reason text;

alter table public.members drop constraint if exists members_approval_status_check;
alter table public.members add constraint members_approval_status_check check (approval_status in ('pending','approved','rejected'));

update public.members set approval_status='approved' where approval_status is null or approval_status='';
create index if not exists members_approval_status_idx on public.members(approval_status, created_at desc);
