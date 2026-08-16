import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function MatchNoticesPage() {
  const { data, error } = await getSupabaseAdmin()
    .from("match_notices")
    .select("id,title,content,is_pinned,created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <section className="card notices-page-card">
      <h1>⚔️ 내전 공지</h1>
      <p className="muted">정기내전·경매·스네이크 픽 등 내전 진행 관련 공지입니다.</p>
      {error ? (
        <div className="error">내전 공지를 불러오지 못했습니다. 1.3.9.24 SQL 적용 여부를 확인해주세요.</div>
      ) : data?.length ? data.map(notice => (
        <article className="public-notice-item" key={notice.id}>
          <div className="public-notice-head">
            <h3>{notice.is_pinned ? "📌 " : ""}{notice.title}</h3>
            <time>{new Date(notice.created_at).toLocaleDateString("ko-KR")}</time>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{notice.content}</p>
        </article>
      )) : <p className="empty-copy">등록된 내전 공지가 없습니다.</p>}
    </section>
  );
}
