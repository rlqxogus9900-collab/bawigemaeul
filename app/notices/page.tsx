import { getSupabaseAdmin } from "@/lib/supabase-admin";

export default async function Page() {
  const { data } = await getSupabaseAdmin()
    .from("notices")
    .select("id,title,content,is_pinned,created_at,image_urls")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return <section className="card notices-page-card">
    <h1>클랜 공지</h1>
    {data?.length ? data.map(notice => <article className="public-notice-item" key={notice.id}>
      <div className="public-notice-head">
        <h3>{notice.is_pinned ? "📌 " : ""}{notice.title}</h3>
        <time>{new Date(notice.created_at).toLocaleDateString("ko-KR")}</time>
      </div>
      <p>{notice.content}</p>
      {Array.isArray(notice.image_urls) && notice.image_urls.length > 0 && (
        <div className="board-post-images notice-images">
          {notice.image_urls.map((url: string, index: number) => (
            <a href={url} target="_blank" rel="noreferrer" key={`${url}-${index}`}>
              <img src={url} alt={`공지 첨부 이미지 ${index + 1}`} />
            </a>
          ))}
        </div>
      )}
    </article>) : <p className="empty-copy">등록된 공지가 없습니다.</p>}
  </section>;
}
