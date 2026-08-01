const errorMessages: Record<string, string> = {
  nickname_invalid: "홈페이지 닉네임은 2글자 이상 입력해 주세요.",
  password_invalid: "비밀번호는 4글자 이상이며 비밀번호 확인과 같아야 합니다.",
  riot_id_invalid: "Riot ID는 닉네임#태그 형식으로 입력해 주세요.",
  nickname_duplicate: "이미 사용 중인 홈페이지 닉네임입니다.",
  riot_id_duplicate: "이미 사용 중인 Riot ID입니다.",
  lookup_failed: "기존 회원 정보 확인에 실패했습니다. SQL 적용 여부를 확인해 주세요.",
  save_failed: "가입 신청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  invalid: "입력값을 다시 확인해 주세요.",
  duplicate: "이미 사용 중인 닉네임 또는 Riot ID입니다.",
  "1": "가입 신청 처리에 실패했습니다. 입력값과 기존 회원 정보를 확인해 주세요."
};

export default async function SignupPage({searchParams}:{searchParams:Promise<{error?:string;done?:string}>}) {
  const p = await searchParams;
  const errorMessage = p.error ? (errorMessages[p.error] || errorMessages["1"]) : null;
  return <section className="card login signup-card">
    <h1>클랜원 회원가입</h1>
    <p className="muted">신청 후 운영진 승인을 받아야 로그인할 수 있습니다.</p>
    {p.done&&<div className="flash">가입 신청이 완료되었습니다. 운영진 승인을 기다려 주세요.</div>}
    {errorMessage&&<div className="error">{errorMessage}</div>}
    <form className="form" action="/api/auth/signup" method="post">
      <label>홈페이지 닉네임<input name="nickname" required minLength={2}/></label>
      <label>비밀번호<input name="password" type="password" required minLength={4}/></label>
      <label>비밀번호 확인<input name="password_confirm" type="password" required minLength={4}/></label>
      <label>Riot ID<input name="riot_id" placeholder="닉네임#태그" required/></label>
      <div className="signup-grid">
        <label>현재 티어<select name="current_tier" defaultValue="미정"><option>미정</option><option>아이언</option><option>브론즈</option><option>실버</option><option>골드</option><option>플래티넘</option><option>에메랄드</option><option>다이아</option><option>마스터</option><option>그랜드마스터</option><option>챌린저</option></select></label>
        <label>최고 티어<select name="highest_tier" defaultValue="미정"><option>미정</option><option>아이언</option><option>브론즈</option><option>실버</option><option>골드</option><option>플래티넘</option><option>에메랄드</option><option>다이아</option><option>마스터</option><option>그랜드마스터</option><option>챌린저</option></select></label>
        <label>내전 티어<select name="match_tier" defaultValue=""><option value="">미정</option><option value="1">Ⅰ티어</option><option value="2">Ⅱ티어</option><option value="3">Ⅲ티어</option><option value="4">Ⅳ티어</option><option value="5">Ⅴ티어</option></select></label>
        <label>주라인<select name="main_line" defaultValue="미정"><option>미정</option><option>탑</option><option>정글</option><option>미드</option><option>원딜</option><option>서폿</option></select></label>
        <label>부라인<select name="sub_line" defaultValue="미정"><option>미정</option><option>탑</option><option>정글</option><option>미드</option><option>원딜</option><option>서폿</option></select></label>
      </div>
      <label>참고사항<textarea name="notes" placeholder="운영진에게 전달할 내용"/></label>
      <button className="button primary">가입 신청</button>
    </form>
    <a href="/login" className="muted">이미 계정이 있으면 로그인</a>
  </section>;
}
