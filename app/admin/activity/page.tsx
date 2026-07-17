import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireStaff();
  const db = getSupabaseAdmin();
  const { data: members } = await db.from("members").select("*").order("nickname");

  return (
    <section className="card">
      <h1>활동 관리</h1><div className="api-ready-badge">RIOT API 연동 준비 완료 · Riot ID 기준</div>
      <p className="muted">온라인 Beta 1에서는 상태와 제외 사유를 DB에 저장합니다. Riot API 승인 후 자동 활동 집계를 연결할 수 있도록 Riot ID와 마지막 클랜 게임 시각을 유지합니다.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>닉네임</th><th>Riot ID</th><th>상태</th><th>마지막 클랜 게임</th><th>제외 사유</th><th>관리</th></tr></thead>
          <tbody>{members?.map(m => <tr key={m.id}>
            <td>{m.nickname}</td><td>{m.riot_id}</td>
            <td><span className={`status ${m.activity_excluded ? "excluded" : m.activity_status}`}>{m.activity_excluded ? "제외" : m.activity_status === "active" ? "활동" : "비활동"}</span></td>
            <td>{m.last_clan_game_at ? new Date(m.last_clan_game_at).toLocaleDateString("ko-KR") : "-"}</td>
            <td>{m.activity_exclusion_reason || "-"}</td>
            <td>
              <form className="form" action={`/api/admin/members/${m.id}/activity`} method="post">
                <select name="status" defaultValue={m.activity_excluded ? "excluded" : m.activity_status}>
                  <option value="active">활동</option><option value="inactive">비활동</option><option value="excluded">제외</option>
                </select>
                <input name="reason" placeholder="제외 시 사유 필수" defaultValue={m.activity_exclusion_reason || ""} />
                <button className="button">저장</button>
              </form>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
