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
            <p className="muted">후원자의 홈페이지 닉네임과 바위게 아이콘을 설정합니다. 설정한 아이콘은 모든 명단·게시판·댓글에 표시됩니다.</p>
          </div>
        </div>

        {params.saved && <div className="flash">후원 목록을 저장했습니다.</div>}
        {params.error && <div className="error">입력값을 확인하세요.</div>}

        <form className="sponsor-add-form" action="/api/admin/sponsors" method="post">
          <input name="display_name" placeholder="후원 목록 표시 이름" required />
          <input name="sponsor_nickname" placeholder="홈페이지 닉네임 (정확히 입력)" required />
          <select name="icon_key" defaultValue="bronze" aria-label="후원 아이콘">
            <option value="none">아이콘 없음</option>
            <option value="bronze">브론즈 바위게</option>
            <option value="silver">실버 바위게</option>
            <option value="gold">골드 바위게</option>
            <option value="rainbow">레인보우 바위게</option>
          </select>
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
        <p className="muted">후원 등급이나 기간 없이 선택한 아이콘과 이름만 표시됩니다.</p>

        <div className="sponsor-admin-list">
          {sponsors?.length ? sponsors.map(sponsor => (
            <article key={sponsor.id} className="sponsor-admin-row">
              <form className="sponsor-edit-form" action={`/api/admin/sponsors/${sponsor.id}`} method="post">
                <input name="display_name" defaultValue={sponsor.display_name} required />
                <input name="sponsor_nickname" defaultValue={sponsor.sponsor_nickname || sponsor.display_name} placeholder="홈페이지 닉네임" required />
                <select name="icon_key" defaultValue={sponsor.icon_key || "none"} aria-label={`${sponsor.display_name} 후원 아이콘`}>
                  <option value="none">아이콘 없음</option>
                  <option value="bronze">브론즈 바위게</option>
                  <option value="silver">실버 바위게</option>
                  <option value="gold">골드 바위게</option>
                  <option value="rainbow">레인보우 바위게</option>
                </select>
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
