create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  type text not null default 'system'
    check (type in ('notice', 'poll', 'comment', 'system')),
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_member_created_idx
  on public.notifications(member_id, created_at desc);

create index if not exists notifications_member_unread_idx
  on public.notifications(member_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "members can view own notifications"
  on public.notifications;

create policy "members can view own notifications"
  on public.notifications
  for select
  using (member_id = auth.uid());

drop policy if exists "members can update own notifications"
  on public.notifications;

create policy "members can update own notifications"
  on public.notifications
  for update
  using (member_id = auth.uid())
  with check (member_id = auth.uid());
