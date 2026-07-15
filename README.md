# 바위게마을 Online Beta 1.3.4

## 변경
- 현재 롤 티어 대신 경매용 `내전 티어` 사용
- 내전 티어는 1~5티어 또는 미정
- 참고사항 칸 추가
- 참고사항 검색 지원
- 내전 티어별 필터 추가
- 운영진이 내전 티어·라인·참고사항을 일괄 저장
- 향후 경매 선수 명단과 바로 연결할 수 있는 구조

## SQL 필요
Supabase SQL Editor에서 아래 파일 내용을 한 번 실행하세요.

`supabase/migrations/20260716_add_match_tier_and_notes.sql`
