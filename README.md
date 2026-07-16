# 바위게마을 Online Beta 1.3.7.3

## 추가
- 게시글 댓글 작성
- 본인 댓글 삭제
- 운영진 전체 댓글 삭제
- 게시글 작성자 댓글 배지
- 댓글 수 자동 집계
- 게시판 공개/운영진 전용 권한을 댓글에도 적용

## 기존 기능 유지
- 1.3.7.1 홈 화면 리뉴얼
- 게시글 작성·조회·수정·삭제·검색
- 운영진 고정글
- 명단 설정 계정 삭제
- 본인 계정 및 마지막 운영진 삭제 방지

## SQL 필요
Supabase SQL Editor에서 아래 파일을 한 번 실행하세요.

`supabase/migrations/20260717_add_board_comments.sql`

## 배포
- package-lock.json 제외
- .npmrc 제외
- package.json 및 의존성 변경 없음
