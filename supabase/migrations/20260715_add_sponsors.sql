create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  memo text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;

-- 앱은 서버의 service_role 키로 접근하므로 public 정책은 만들지 않습니다.
