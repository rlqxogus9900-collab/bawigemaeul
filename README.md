# 바위게마을 Online Beta 1

온라인 운영용 첫 기반 프로젝트입니다.

## 포함 기능
- Next.js App Router
- Supabase PostgreSQL
- 자체 닉네임 로그인
- HttpOnly 쿠키 자동 로그인
- 운영진/클랜원 권한
- 초기 비밀번호 1234
- 최초 로그인 비밀번호 변경
- 운영진 클랜원 등록/삭제/비밀번호 초기화
- 활동/비활동/제외 상태 및 제외 사유
- 홈 공지/규칙/최근 정기내전 결과

## 1. Supabase SQL 실행
Supabase → SQL Editor → New query에서:
1. `supabase/schema.sql`
2. `supabase/seed.sql`
순서로 실행합니다.

## 2. 환경변수
`.env.example`을 `.env.local`로 복사한 뒤 값을 입력합니다.

- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SESSION_SECRET (32자 이상 랜덤 문자열)

중요: `SUPABASE_SERVICE_ROLE_KEY`는 절대 GitHub에 공개하지 마세요.

## 3. 설치/실행
```bash
npm install
npm run dev
```

## 4. 최초 운영진 생성
`.env.local` 설정 후:
```bash
node scripts/create-first-staff.mjs "바위게" "바위게#KR1"
```
초기 비밀번호는 `1234`입니다.

## 5. Vercel
GitHub 저장소를 Vercel에서 Import한 뒤 같은 환경변수 3개를 등록하고 Deploy합니다.

## 다음 Beta
- 게시판/댓글
- 익명 신문고
- 일정
- 명예의 전당
- 실시간 경매
- Riot API 자동 활동 집계
