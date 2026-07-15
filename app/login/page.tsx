export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <section className="card login">
      <h1>클랜원 로그인</h1>
      <p className="muted">운영진이 등록한 닉네임과 비밀번호를 사용하세요. 최초 비밀번호는 1234입니다.</p>
      <form className="form" action="/api/auth/login" method="post">
        <input name="nickname" placeholder="홈페이지 닉네임" required />
        <input name="password" type="password" placeholder="비밀번호" minLength={4} required />
        <label><input name="remember" type="checkbox" defaultChecked /> 자동 로그인</label>
        <button className="button primary">로그인</button>
      </form>
    </section>
  );
}
