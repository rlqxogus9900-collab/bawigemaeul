# 바위게마을 Online Beta 1.3.7.2

## 게시판
- 게시글 작성
- 게시글 상세 조회
- 작성자 본인 또는 운영진 수정·삭제
- 조회수 표시
- 제목·작성자 검색
- 운영진 고정글 등록

## 명단 설정
- 클랜원 카드에 삭제 버튼 추가
- 삭제 확인창
- 본인 계정 삭제 방지
- 마지막 운영진 계정 삭제 방지
- 삭제 즉시 명단에서 제거

## SQL
Supabase SQL Editor에서 아래 파일을 한 번 실행하세요.
`supabase/migrations/20260717_add_board_post_indexes.sql`

## 1.3.7.2 Fix
- Vercel에서 접근할 수 없는 내부 npm 주소가 들어간 package-lock.json 제거
- npm 공식 레지스트리 사용 설정 추가
- 게시판/명단 기능 코드는 기존 1.3.7.2와 동일
