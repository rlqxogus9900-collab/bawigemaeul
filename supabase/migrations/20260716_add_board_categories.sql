create table if not exists public.board_categories(id uuid primary key default gen_random_uuid(),name text not null,icon text not null default '💬',sort_order integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.board_subcategories(id uuid primary key default gen_random_uuid(),category_id uuid not null references public.board_categories(id) on delete restrict,name text not null,description text,sort_order integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.board_posts(id uuid primary key default gen_random_uuid(),subcategory_id uuid not null references public.board_subcategories(id) on delete restrict,title text not null,content text not null default '',author_member_id uuid references public.members(id) on delete set null,author_nickname text not null,is_pinned boolean not null default false,view_count integer not null default 0,comment_count integer not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.board_categories enable row level security;alter table public.board_subcategories enable row level security;alter table public.board_posts enable row level security;

insert into public.board_categories(name,icon,sort_order) select * from (values ('공지','📢',10),('내전','🏆',20),('커뮤니티','💬',30),('이벤트','🎉',40),('운영','🙋',50)) v(name,icon,sort_order)
where not exists(select 1 from public.board_categories c where c.name=v.name);

insert into public.board_subcategories(category_id,name,description,sort_order)
select c.id,x.name,x.description,x.sort_order from public.board_categories c join (values
('공지','공지사항','클랜의 중요 공지를 확인합니다.',10),('공지','업데이트','홈페이지 및 운영 변경사항을 확인합니다.',20),
('내전','정기내전','정기내전 모집, 일정과 결과를 확인합니다.',10),('내전','경매내전','경매내전 모집과 결과를 확인합니다.',20),('내전','대회','클랜 대회와 외부 대회 관련 글을 확인합니다.',30),
('커뮤니티','자유게시판','클랜원끼리 자유롭게 이야기합니다.',10),('커뮤니티','질문게시판','게임과 클랜 운영 관련 질문을 나눕니다.',20),('커뮤니티','공략게시판','챔피언과 포지션 공략을 공유합니다.',30),
('이벤트','이벤트','클랜 이벤트 안내를 확인합니다.',10),('이벤트','후기','이벤트와 모임 후기를 공유합니다.',20),
('운영','건의사항','클랜 운영에 대한 의견을 남깁니다.',10),('운영','신고(익명)','익명 신고와 제보를 위한 게시판입니다.',20)
) x(category_name,name,description,sort_order) on c.name=x.category_name
where not exists(select 1 from public.board_subcategories s where s.category_id=c.id and s.name=x.name);
