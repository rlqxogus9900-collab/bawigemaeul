import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function MatchNoticeAdminPage() {
  await ensureStaff();
  const { data, error } = await getSupabaseAdmin()
    .from("match_notices")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return <>
    <section className="card">
      <h1>⚔️ 내전 공지 관리</h1>
      <p className="muted">운영진만 작성·수정·삭제할 수 있고 클랜원은 내전 탭에서 읽기만 가능합니다.</p>
      <form className="form" action="/api/admin/match-notices" method="post">
        <input name="title" placeholder="내전 공지 제목" required />
        <textarea name="content" placeholder="내전 공지 내용" rows={7} required />
        <label><input name="is_pinned" type="checkbox" /> 상단 고정</label>
        <button className="button primary">내전 공지 등록</button>
      </form>
      {error && <div className="error">내전 공지 테이블을 불러오지 못했습니다. 1.3.9.24 SQL을 실행해주세요.</div>}
    </section>

    <section className="card" style={{ marginTop: 14 }}>
      <h2>등록된 내전 공지</h2>
      {data?.length ? data.map(notice => (
        <article className="notice-item" key={notice.id}>
          <form className="form" action={`/api/admin/match-notices/${notice.id}`} method="post">
            <input name="title" defaultValue={notice.title} required />
            <textarea name="content" defaultValue={notice.content} rows={5} required />
            <label><input name="is_pinned" type="checkbox" defaultChecked={notice.is_pinned} /> 상단 고정</label>
            <div className="actions">
              <button className="button">수정 저장</button>
              <button className="button danger" name="_action" value="delete">삭제</button>
            </div>
          </form>
        </article>
      )) : <p className="empty-copy">등록된 내전 공지가 없습니다.</p>}
    </section>
  </>;
}
