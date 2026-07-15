import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ChangePasswordPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <section className="card login">
      <h1>새 비밀번호 설정</h1>
      <p className="muted">새 비밀번호는 4자 이상 입력하세요.</p>
      <form className="form" action="/api/auth/change-password" method="post">
        <input name="password" type="password" minLength={4} placeholder="새 비밀번호" required />
        <input name="confirm" type="password" minLength={4} placeholder="새 비밀번호 확인" required />
        <button className="button primary">비밀번호 변경</button>
      </form>
    </section>
  );
}
