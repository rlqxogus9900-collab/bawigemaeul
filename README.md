# 바위게마을 Online Beta 1.3.8.8

## 변경 사항
- 15초 제한시간이 0초가 되면 현재 선수를 자동으로 유찰 처리
- 중복 자동 유찰 방지
- 기존 유찰 애니메이션 및 방송 화면 동기화 유지

## SQL
추가 SQL 없음.

※ 자동 유찰은 관리자가 팀장 전용 경매 진행 화면을 열어둔 상태에서 작동합니다.


## 1.3.8.8 변경사항
- 코인토스 탭 실제 기능 활성화
- 웃는/우는 바위게 앞뒤 면 구분
- 50:50 무작위 결과 및 회전 애니메이션
- 최근 결과 10건 표시 및 초기화
- 추가 SQL 없음

## 1.3.8.22 - 최적화 및 Riot API 연동 준비

1. 배포 환경 변수에 `RIOT_API_KEY`를 서버 전용으로 등록합니다. 절대로 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.
2. 한국 서버 기본값은 `RIOT_PLATFORM_REGION=kr`, `RIOT_ROUTING_REGION=asia`입니다.
3. 연결 확인: `/api/riot/health`
4. Riot ID → PUUID: `/api/riot/account?gameName=이름&tagLine=태그`
5. 최근 경기 ID: `/api/riot/matches?puuid=PUUID&count=10`
6. 경기 상세: `/api/riot/match/MATCH_ID`

개발용 키는 24시간마다 만료될 수 있으므로 테스트 단계에서만 사용하고, 실제 운영 전 프로덕션 키로 교체하세요.
