import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VacationPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const params = await searchParams;
  const saved = params.saved === "1";
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const detail = typeof params.detail === "string" ? params.detail : undefined;

  const db = getSupabaseAdmin();
  const { data: vacations, error: loadError } = await db
    .from("member_vacations")
    .select("id,start_date,end_date,reason,memo,created_at")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  const errorMessage = errorCode === "invalid"
    ? "기간과 휴가 사유를 확인해주세요."
    : errorCode === "save"
      ? `휴가 저장에 실패했습니다.${detail ? ` (${detail})` : ""}`
      : null;

  return (
    <div className="vacation-page-shell">
      <section className="card vacation-form-card">
        <span className="eyebrow">VACATION REQUEST</span>
        <h1>🏖️ 휴가 신청</h1>
        <p className="muted">신청 즉시 활동 관리에 휴가중으로 표시되며 운영진에게만 알림이 전송됩니다.</p>
        {saved && <div className="notice success">✅ 휴가가 정상 등록됐습니다.</div>}
        {errorMessage && <div className="notice error">❌ {errorMessage}</div>}
        {loadError && <div className="notice error">❌ 휴가 목록을 불러오지 못했습니다. ({loadError.message})</div>}
        <form action="/api/vacations" method="post" className="form vacation-form">
          <div className="vacation-date-grid">
            <label>시작일<input type="date" name="start_date" required /></label>
            <label>종료일<input type="date" name="end_date" required /></label>
          </div>
          <label>휴가 사유<input name="reason" maxLength={120} required placeholder="예: 가족여행" /></label>
          <label>메모<textarea name="memo" maxLength={500} rows={4} placeholder="선택 입력" /></label>
          <button className="button primary" type="submit">휴가 신청</button>
        </form>
      </section>

      <section className="card">
        <div className="dashboard-head"><div><span>MY VACATIONS</span><h2>내 신청 내역</h2></div></div>
        <div className="vacation-list">
          {(vacations || []).map(v => {
            const today = new Date().toISOString().slice(0, 10);
            const active = v.end_date >= today;
            return <article key={v.id} className={`vacation-item ${active ? "active" : ""}`}>
              <div><b>{v.start_date} ~ {v.end_date}</b><span>{active ? "🏖️ 휴가중" : "종료"}</span></div>
              <p>{v.reason}</p>{v.memo && <small>{v.memo}</small>}
            </article>;
          })}
          {!vacations?.length && !loadError && <p className="muted">신청한 휴가가 없습니다.</p>}
        </div>
      </section>
    </div>
  );
}
