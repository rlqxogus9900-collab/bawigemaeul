import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function messageForError(code?: string, detail?: string) {
  if (!code) return null;
  if (code === "invalid") return "클랜원, 기간, 사유를 확인해주세요. 종료일은 시작일보다 빠를 수 없습니다.";
  if (code === "member") return "선택한 클랜원을 찾지 못했습니다. 명단을 새로고침한 뒤 다시 선택해주세요.";
  if (code === "member_lookup") return `클랜원 조회에 실패했습니다.${detail ? ` (${detail})` : ""}`;
  if (code === "save") return `휴가 저장에 실패했습니다.${detail ? ` (${detail})` : " 추가 SQL 1.3.9.9가 실행됐는지 확인해주세요."}`;
  return "휴가 등록 중 오류가 발생했습니다.";
}

export default async function AdminVacationsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireStaff();
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const detail = typeof params.detail === "string" ? params.detail : undefined;
  const saved = params.saved === "1";
  const savedMember = typeof params.member === "string" ? params.member : "클랜원";

  const db = getSupabaseAdmin();
  const [{ data: vacations, error: vacationLoadError }, { data: members, error: memberLoadError }] = await Promise.all([
    db.from("member_vacations")
      .select("id,member_id,start_date,end_date,reason,memo,created_at")
      .order("created_at", { ascending: false }),
    db.from("members")
      .select("id,nickname,riot_id")
      .eq("is_active", true)
      .order("nickname", { ascending: true })
  ]);

  const memberMap = new Map((members || []).map((m: any) => [m.id, m]));
  const today = new Date().toISOString().slice(0, 10);
  const pageError = messageForError(errorCode, detail);

  return <div className="admin-functional-page">
    <section className="card vacation-form-card">
      <div className="dashboard-head"><div><span>STAFF ONLY</span><h1>휴가 직접 등록</h1><p className="muted">운영진이 클랜원을 선택해 휴가를 수기로 등록할 수 있습니다.</p></div></div>
      {saved && <div className="notice success">✅ {savedMember}님의 휴가가 정상 등록됐습니다.</div>}
      {pageError && <div className="notice error">❌ {pageError}</div>}
      {memberLoadError && <div className="notice error">❌ 클랜원 목록을 불러오지 못했습니다. ({memberLoadError.message})</div>}
      {vacationLoadError && <div className="notice error">❌ 휴가 목록을 불러오지 못했습니다. ({vacationLoadError.message})</div>}
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
        <label>휴가 사유<input name="reason" maxLength={120} required placeholder="예: 여행, 개인 일정" /></label>
        <label>메모<textarea name="memo" maxLength={500} rows={3} placeholder="선택 입력" /></label>
        <button className="button primary" type="submit">휴가 등록</button>
      </form>
    </section>

    <section className="card">
      <div className="dashboard-head"><div><span>VACATION MANAGEMENT</span><h2>휴가 관리</h2></div></div>
      <div className="table-wrap"><table><thead><tr><th>클랜원</th><th>기간</th><th>상태</th><th>사유</th><th>메모</th><th>관리</th></tr></thead>
      <tbody>{(vacations || []).map((v: any) => {
        const member = memberMap.get(v.member_id) as any;
        const active = v.start_date <= today && v.end_date >= today;
        const status = active ? "🏖️ 휴가중" : v.end_date < today ? "종료" : "예정";
        return <tr key={v.id}><td><b>{member?.nickname || "탈퇴한 사용자"}</b><small>{member?.riot_id || ""}</small></td><td>{v.start_date}<br/>~ {v.end_date}</td><td>{status}</td><td>{v.reason}</td><td>{v.memo || "-"}</td><td><form action={`/api/admin/vacations/${v.id}`} method="post"><button className="button danger" name="action" value="delete">삭제</button></form></td></tr>;
      })}</tbody></table></div>
      {!vacations?.length && !vacationLoadError && <p className="empty-copy">등록된 휴가가 없습니다.</p>}
    </section>
  </div>;
}
