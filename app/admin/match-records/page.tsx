import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function Page({searchParams}:{searchParams:Promise<{saved?:string;deleted?:string;error?:string}>}) {
  await requireStaff();
  const params=await searchParams;
  const {data:records}=await getSupabaseAdmin().from("match_records").select("*").order("played_at",{ascending:false});
  return <>
    <section className="card feature-admin-card">
      <div className="page-head"><div><span>STAFF ONLY</span><h1>내전 기록 관리</h1><p className="muted">경기 결과, 세트 스코어, 참가자와 MVP를 저장합니다.</p></div></div>
      {params.saved&&<div className="flash">내전 기록을 저장했습니다.</div>}{params.deleted&&<div className="flash">내전 기록을 삭제했습니다.</div>}{params.error&&<div className="error">필수 입력값을 확인하세요.</div>}
      <form className="feature-form-grid" action="/api/admin/match-records" method="post">
        <input name="title" placeholder="경기명 (예: 7월 정기내전)" required />
        <input name="played_at" type="date" required />
        <input name="team_a_name" placeholder="A팀 이름" defaultValue="A팀" required />
        <input name="team_a_sets" type="number" min="0" defaultValue="0" required />
        <input name="team_b_name" placeholder="B팀 이름" defaultValue="B팀" required />
        <input name="team_b_sets" type="number" min="0" defaultValue="0" required />
        <input name="winner_name" placeholder="우승팀" required />
        <input name="mvp_name" placeholder="MVP" />
        <textarea name="participants" placeholder="참가자 (쉼표 또는 줄바꿈으로 구분)" rows={4} required />
        <textarea name="notes" placeholder="비고" rows={4} />
        <button className="button primary" type="submit">기록 저장</button>
      </form>
    </section>
    <section className="feature-record-grid">
      {(records||[]).map(r=><article className="card feature-record-card" key={r.id}>
        <div><small>{new Date(r.played_at).toLocaleDateString("ko-KR")}</small><h2>{r.title}</h2></div>
        <strong>{r.team_a_name} {r.team_a_sets} : {r.team_b_sets} {r.team_b_name}</strong>
        <p>🏆 {r.winner_name} · MVP {r.mvp_name||"미등록"}</p>
        <p className="muted">참가자: {(r.participants||[]).join(", ")}</p>
        {r.notes&&<p>{r.notes}</p>}
        <form action={`/api/admin/match-records/${r.id}`} method="post"><input type="hidden" name="_action" value="delete"/><button className="button danger">삭제</button></form>
      </article>)}
      {!records?.length&&<div className="card hall-empty">등록된 내전 기록이 없습니다.</div>}
    </section>
  </>;
}
