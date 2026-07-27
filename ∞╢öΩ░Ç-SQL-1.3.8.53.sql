-- 1.3.8.53 정기내전 / 대회 기록 분류
alter table public.regular_match_results
  add column if not exists match_type text not null default 'regular_match';

update public.regular_match_results
set match_type = 'regular_match'
where match_type is null or trim(match_type) = '';

create index if not exists regular_match_results_match_type_idx
  on public.regular_match_results(match_type);
