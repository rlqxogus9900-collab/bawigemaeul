import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminVacationsPage() {
  await requireStaff();
  const db = getSupabaseAdmin();
  const { data } = await db.from("member_vacations")
    .select("id,member_id,start_date,end_date,reason,memo,created_at,members(nickname,riot_id)")
    .order("created_at", { ascending: false });
  const today = new Date().toISOString().slice(0, 10);
  return <section className="card">
    <div className="dashboard-head"><div><span>VACATION MANAGEMENT</span><h1>휴가 관리</h1></div></div>
    <div className="table-wrap"><table><thead><tr><th>클랜원</th><th>기간</th><th>상태</th><th>사유</th><th>메모</th><th>관리</th></tr></thead>
    <tbody>{(data || []).map((v: any) => {
      const active = v.start_date <= today && v.end_date >= today;
      const status = active ? "🏖️ 휴가중" : v.end_date < today ? "종료" : "예정";
      return <tr key={v.id}><td><b>{v.members?.nickname || "탈퇴한 사용자"}</b><small>{v.members?.riot_id || ""}</small></td><td>{v.start_date}<br/>~ {v.end_date}</td><td>{status}</td><td>{v.reason}</td><td>{v.memo || "-"}</td><td><form action={`/api/admin/vacations/${v.id}`} method="post"><button className="button danger" name="action" value="delete">삭제</button></form></td></tr>;
    })}</tbody></table></div>
  </section>;
}
