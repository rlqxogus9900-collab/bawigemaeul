import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminVacationsPage() {
  await requireStaff();
  const db = getSupabaseAdmin();
  const [{ data }, { data: members }] = await Promise.all([
    db.from("member_vacations")
      .select("id,member_id,start_date,end_date,reason,memo,created_at,members(nickname,riot_id)")
      .order("created_at", { ascending: false }),
    db.from("members")
      .select("id,nickname,riot_id")
      .eq("is_active", true)
      .order("nickname", { ascending: true })
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return <div className="admin-functional-page">
    <section className="card vacation-form-card">
      <div className="dashboard-head"><div><span>STAFF ONLY</span><h1>휴가 직접 등록</h1><p className="muted">운영진이 클랜원을 선택해 휴가를 수기로 등록할 수 있습니다.</p></div></div>
      <form action="/api/admin/vacations" method="post" className="form vacation-form">
        <label>클랜원
          <select name="member_id" required defaultValue="">
            <option value="" disabled>클랜원 선택</option>
            {(members || []).map((m: any) => <option key={m.id} value={m.id}>{m.nickname}{m.riot_id ? ` · ${m.riot_id}` : ""}</option>)}
          </select>
        </label>
        <div className="vacation-date-grid">
          <label>시작일<input type="date" name="start_date" required /></label>
          <label>종료일<input type="date" name="end_date" required /></label>
        </div>
        <label>휴가 사유<input name="reason" required placeholder="예: 여행, 개인 일정" /></label>
        <label>메모<textarea name="memo" rows={3} placeholder="선택 입력" /></label>
        <button className="button primary" type="submit">휴가 등록</button>
      </form>
    </section>

    <section className="card">
      <div className="dashboard-head"><div><span>VACATION MANAGEMENT</span><h2>휴가 관리</h2></div></div>
      <div className="table-wrap"><table><thead><tr><th>클랜원</th><th>기간</th><th>상태</th><th>사유</th><th>메모</th><th>관리</th></tr></thead>
      <tbody>{(data || []).map((v: any) => {
        const active = v.start_date <= today && v.end_date >= today;
        const status = active ? "🏖️ 휴가중" : v.end_date < today ? "종료" : "예정";
        return <tr key={v.id}><td><b>{v.members?.nickname || "탈퇴한 사용자"}</b><small>{v.members?.riot_id || ""}</small></td><td>{v.start_date}<br/>~ {v.end_date}</td><td>{status}</td><td>{v.reason}</td><td>{v.memo || "-"}</td><td><form action={`/api/admin/vacations/${v.id}`} method="post"><button className="button danger" name="action" value="delete">삭제</button></form></td></tr>;
      })}</tbody></table></div>
      {!data?.length && <p className="empty-copy">등록된 휴가가 없습니다.</p>}
    </section>
  </div>;
}
