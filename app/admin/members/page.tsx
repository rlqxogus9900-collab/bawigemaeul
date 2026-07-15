import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  await requireStaff();
  const db = getSupabaseAdmin();
  const { data: members } = await db.from("members").select("*").order("created_at", { ascending: false });

  return (
    <>
      <section className="card">
        <h2>신입 클랜원 등록</h2>
        <form className="form" action="/api/admin/members" method="post">
          <input name="nickname" placeholder="홈페이지 닉네임" required />
          <input name="riot_id" placeholder="Riot ID 예: 바위게#KR1" required />
          <select name="role"><option value="member">클랜원</option><option value="staff">운영진</option></select>
          <button className="button primary">초기 비밀번호 1234로 등록</button>
        </form>
      </section>
      <section className="card" style={{marginTop:14}}>
        <h2>클랜원 명단</h2>
        <div className="table-wrap">
          <table><thead><tr><th>닉네임</th><th>Riot ID</th><th>권한</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>{members?.map(m => <tr key={m.id}>
            <td>{m.nickname}</td><td>{m.riot_id}</td><td>{m.role === "staff" ? "운영진" : "클랜원"}</td><td>{m.is_active ? "활성" : "비활성"}</td>
            <td className="actions">
              <form action={`/api/admin/members/${m.id}/reset-password`} method="post"><button className="button">비밀번호 1234 초기화</button></form>
              <form action={`/api/admin/members/${m.id}/delete`} method="post"><button className="button danger">삭제</button></form>
            </td>
          </tr>)}</tbody></table>
        </div>
      </section>
    </>
  );
}
