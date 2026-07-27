-- 바위게마을 온라인 베타 1.3.8.42
-- 공지사항 이미지 첨부 기능

alter table public.notices
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

-- 기존 게시판 이미지 저장소를 공지 이미지에도 함께 사용합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'board-images',
  'board-images',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
