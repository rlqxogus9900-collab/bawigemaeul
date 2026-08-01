export default async function SignupPage({searchParams}:{searchParams:Promise<{error?:string;done?:string}>}){
  const p=await searchParams;
  return <section className="card login" style={{maxWidth:760}}>
    <h1>클랜원 회원가입</h1>
    <p className="muted">신청 후 운영진 승인을 받으면 로그인할 수 있습니다.</p>
    {p.done&&<div className="flash">가입 신청이 완료되었습니다. 운영진 승인을 기다려 주세요.</div>}
    {p.error&&<div className="error">입력값 또는 중복된 닉네임·Riot ID를 확인하세요.</div>}
    <form className="form" action="/api/auth/signup" method="post">
      <label>홈페이지 닉네임<input name="nickname" required minLength={2} maxLength={30}/></label>
      <label>비밀번호<input name="password" type="password" required minLength={4}/></label>
      <label>비밀번호 확인<input name="password_confirm" type="password" required minLength={4}/></label>
      <label>Riot ID<input name="riot_id" placeholder="닉네임#태그" required/></label>
      <div className="form-grid-2">
        <label>현재 티어<select name="current_tier" defaultValue="미정"><option>미정</option><option>아이언</option><option>브론즈</option><option>실버</option><option>골드</option><option>플래티넘</option><option>에메랄드</option><option>다이아</option><option>마스터</option><option>그랜드마스터</option><option>챌린저</option></select></label>
        <label>내전 티어<select name="match_tier" defaultValue="미정"><option>미정</option><option>아이언</option><option>브론즈</option><option>실버</option><option>골드</option><option>플래티넘</option><option>에메랄드</option><option>다이아</option><option>마스터</option></select></label>
        <label>주라인<select name="main_line" defaultValue="미정"><option>미정</option><option>탑</option><option>정글</option><option>미드</option><option>원딜</option><option>서폿</option></select></label>
        <label>부라인<select name="sub_line" defaultValue="미정"><option>미정</option><option>탑</option><option>정글</option><option>미드</option><option>원딜</option><option>서폿</option></select></label>
      </div>
      <label>참고사항<textarea name="notes" rows={3} placeholder="운영진에게 전달할 내용"/></label>
      <button className="button primary">가입 신청</button>
    </form>
    <p className="muted" style={{marginTop:16}}><a href="/login">이미 계정이 있으면 로그인</a></p>
  </section>
}
