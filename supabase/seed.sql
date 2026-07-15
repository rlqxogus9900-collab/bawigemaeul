-- 최초 운영진 계정의 password_hash는 앱 실행 후 별도 생성하거나 아래 setup 스크립트를 사용하세요.
insert into public.notices(title,content,is_pinned) values
('바위게마을 Online Beta 시작','운영용 홈페이지 기반 구축을 시작했습니다.',true);

insert into public.clan_rules(content,sort_order) values
('클랜원 간 기본적인 예의를 지켜주세요.',1),
('내전 참여 신청 후 무단 불참하지 마세요.',2),
('문제가 생기면 운영진 또는 신문고를 이용하세요.',3);

insert into public.regular_match_results(team_a_name,team_b_name,team_a_sets,team_b_sets,winner_name)
values ('A팀','B팀',2,1,'A팀');
