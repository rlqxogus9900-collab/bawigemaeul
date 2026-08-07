import SponsorNickname from "@/app/components/SponsorNickname";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireStaff();
  const db = getSupabaseAdmin();
  const [{ data: members }, { data: vacations }] = await Promise.all([
    db.from("members").select("*").order("nickname"),
    db.from("member_vacations").select("member_id,start_date,end_date,reason")
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const activeVacations = new Map((vacations || [])
    .filter(v => v.end_date >= today)
    .map(v => [v.member_id, v]));

  return (
    <section className="card">
      <h1>활동 관리</h1>
      <p className="muted">온라인 Beta 1에서는 상태와 제외 사유를 DB에 저장합니다. Riot API 승인 후 자동 활동 집계 작업을 연결합니다.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>닉네임</th><th>Riot ID</th><th>상태</th><th>마지막 클랜 게임</th><th>제외 사유</th><th>관리</th></tr></thead>
          <tbody>{members?.map(m => <tr key={m.id}>
            <td><SponsorNickname nickname={m.nickname} /></td><td>{m.riot_id}</td>
            <td>{activeVacations.has(m.id)
              ? <span className="status vacation">🏖️ 휴가중</span>
              : <span className={`status ${m.activity_excluded ? "excluded" : m.activity_status}`}>{m.activity_excluded ? "제외" : m.activity_status === "active" ? "활동" : "비활동"}</span>}
              {activeVacations.has(m.id) && <small>{activeVacations.get(m.id)?.start_date} ~ {activeVacations.get(m.id)?.end_date}<br/>{activeVacations.get(m.id)?.reason}</small>}</td>
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
