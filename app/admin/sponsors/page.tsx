import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function SponsorsAdminPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  await requireStaff();
  const params = await searchParams;
  const db = getSupabaseAdmin();
  const { data: sponsors } = await db
    .from("sponsors")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <>
      <section className="card">
        <div className="page-head">
          <div>
            <span>STAFF ONLY</span>
            <h1>후원 관리</h1>
            <p className="muted">홈 화면 후원 목록에 표시할 이름을 관리합니다.</p>
          </div>
        </div>

        {params.saved && <div className="flash">후원 목록을 저장했습니다.</div>}
        {params.error && <div className="error">입력값을 확인하세요.</div>}

        <form className="sponsor-add-form" action="/api/admin/sponsors" method="post">
          <input name="display_name" placeholder="표시할 이름" required />
          <input name="memo" placeholder="운영진 메모 (선택)" />
          <input name="sort_order" type="number" defaultValue={0} min={0} placeholder="순서" />
          <label className="sponsor-visible-check">
            <input name="is_visible" type="checkbox" defaultChecked />
            홈에 표시
          </label>
          <button className="button primary">후원자 등록</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>등록된 후원자</h2>
        <p className="muted">금액은 저장하거나 표시하지 않습니다. 홈에는 이름만 노출됩니다.</p>

        <div className="sponsor-admin-list">
          {sponsors?.length ? sponsors.map(sponsor => (
            <article key={sponsor.id} className="sponsor-admin-row">
              <form className="sponsor-edit-form" action={`/api/admin/sponsors/${sponsor.id}`} method="post">
                <input name="display_name" defaultValue={sponsor.display_name} required />
                <input name="memo" defaultValue={sponsor.memo || ""} placeholder="운영진 메모" />
                <input name="sort_order" type="number" defaultValue={sponsor.sort_order || 0} min={0} />
                <label className="sponsor-visible-check">
                  <input name="is_visible" type="checkbox" defaultChecked={sponsor.is_visible} />
                  홈에 표시
                </label>
                <button className="button">수정 저장</button>
                <button
                  className="button danger"
                  name="_action"
                  value="delete"
                  formAction={`/api/admin/sponsors/${sponsor.id}`}
                >
                  삭제
                </button>
              </form>
            </article>
          )) : <p className="muted">등록된 후원자가 없습니다.</p>}
        </div>
      </section>
    </>
  );
}
