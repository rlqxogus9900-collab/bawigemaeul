import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { suggestion: "건의", bug: "버그", report: "신고", other: "기타" };

export default async function AdminWhistlePage() {
  await ensureStaff();
  const { data } = await getSupabaseAdmin().from("whistle_reports").select("*").order("created_at", { ascending: false }).limit(200);
  return <>
    <section className="admin-dashboard-hero"><div><span>STAFF ONLY</span><h1>신문고 관리</h1><p>익명 제보의 작성자 확인, 처리 상태 변경과 답변을 관리합니다.</p></div></section>
    <section className="admin-whistle-list">
      {(data || []).map(report => <article className="card admin-whistle-card" key={report.id}>
        <div className="admin-whistle-head"><div><span>{labels[report.category] || "기타"}</span><h2>{report.title}</h2></div><b>{report.status === "completed" ? "완료" : report.status === "reviewing" ? "처리중" : "접수"}</b></div>
        <p>{report.content}</p>
        {report.image_url && <a href={report.image_url} target="_blank" rel="noreferrer">첨부 이미지 보기 ↗</a>}
        <div className="admin-whistle-author"><span>공개 표시: {report.is_anonymous ? "익명" : (report.display_name || "클랜원")}</span><span>실제 작성자: {report.author_member_id || "비로그인"}</span><time>{new Date(report.created_at).toLocaleString("ko-KR")}</time></div>
        <form className="form" action={`/api/admin/whistle/${report.id}`} method="post">
          <label>처리 상태<select name="status" defaultValue={report.status}><option value="pending">접수</option><option value="reviewing">처리중</option><option value="completed">완료</option></select></label>
          <label>운영진 답변<textarea name="staff_reply" rows={4} defaultValue={report.staff_reply || ""} placeholder="공개할 답변을 입력하세요" /></label>
          <div className="actions"><button className="button primary">저장</button><button className="button danger" name="_action" value="delete">삭제</button></div>
        </form>
      </article>)}
      {!data?.length && <div className="card whistle-empty">접수된 신문고가 없습니다.</div>}
    </section>
  </>;
}
