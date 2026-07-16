import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import DeleteBoardButton from "./DeleteBoardButton";

export const dynamic = "force-dynamic";

export default async function AdminBoardsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  await requireStaff();
  const params = await searchParams;
  const { data: categories } = await getSupabaseAdmin()
    .from("board_categories")
    .select(`
      id,
      name,
      icon,
      sort_order,
      is_visible,
      access_level,
      board_subcategories (
        id,
        category_id,
        name,
        description,
        sort_order,
        is_visible,
        access_level
      )
    `)
    .order("sort_order", { ascending: true });

  const normalized = (categories || []).map(category => ({
    ...category,
    board_subcategories: [...(category.board_subcategories || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    )
  }));

  return (
    <>
      <section className="card">
        <div className="page-head">
          <div>
            <span>STAFF ONLY</span>
            <h1>게시판·왼쪽 메뉴 관리</h1>
            <p className="muted">
              네이버 카페처럼 대분류와 소분류를 만들면 왼쪽 사이드바에 자동 반영됩니다.
            </p>
          </div>
        </div>

        {params.saved && <div className="flash">게시판과 왼쪽 메뉴 설정을 저장했습니다.</div>}
        {params.error && <div className="error">입력값 또는 연결된 게시판을 확인하세요.</div>}

        <form className="board-category-create board-category-create-v2" action="/api/admin/boards/categories" method="post">
          <input name="icon" placeholder="아이콘" defaultValue="💬" required />
          <input name="name" placeholder="새 대분류 이름" required />
          <input name="sort_order" type="number" min={0} defaultValue={0} />
          <select name="access_level" defaultValue="member">
            <option value="member">클랜원 공개</option>
            <option value="staff">운영진 전용</option>
          </select>
          <label className="menu-visible-check">
            <input name="is_visible" type="checkbox" defaultChecked />
            메뉴 표시
          </label>
          <button className="button primary">대분류 추가</button>
        </form>
      </section>

      <section className="board-admin-grid board-admin-grid-v2">
        {normalized.map(category => (
          <article className="board-admin-category" key={category.id}>
            <form className="board-category-edit board-category-edit-v2" action={`/api/admin/boards/categories/${category.id}`} method="post">
              <input name="icon" defaultValue={category.icon} required />
              <input name="name" defaultValue={category.name} required />
              <input name="sort_order" type="number" min={0} defaultValue={category.sort_order} />

              <select name="access_level" defaultValue={category.access_level || "member"}>
                <option value="member">클랜원 공개</option>
                <option value="staff">운영진 전용</option>
              </select>

              <label className="menu-visible-check">
                <input name="is_visible" type="checkbox" defaultChecked={category.is_visible !== false} />
                표시
              </label>

              <button className="button">대분류 저장</button>
              <DeleteBoardButton message={`대분류 ${category.name}와 내부 소분류 및 게시글을 모두 삭제할까요?`} />
            </form>

            <div className="board-sub-admin-head">
              <b>{category.icon} {category.name}</b>
              <small>왼쪽 메뉴에 표시될 소분류</small>
            </div>

            <form className="board-sub-create board-sub-create-v2" action="/api/admin/boards/subcategories" method="post">
              <input type="hidden" name="category_id" value={category.id} />
              <input name="name" placeholder="새 소분류 이름" required />
              <input name="description" placeholder="게시판 설명 (선택)" />
              <input name="sort_order" type="number" min={0} defaultValue={0} />

              <select name="access_level" defaultValue="member">
                <option value="member">클랜원 공개</option>
                <option value="staff">운영진 전용</option>
              </select>

              <label className="menu-visible-check">
                <input name="is_visible" type="checkbox" defaultChecked />
                표시
              </label>

              <button className="button primary">소분류 추가</button>
            </form>

            <div className="board-sub-admin-list">
              {category.board_subcategories.map(subcategory => (
                <form
                  key={subcategory.id}
                  className="board-sub-edit board-sub-edit-v2"
                  action={`/api/admin/boards/subcategories/${subcategory.id}`}
                  method="post"
                >
                  <input name="name" defaultValue={subcategory.name} required />
                  <input name="description" defaultValue={subcategory.description || ""} placeholder="설명" />
                  <input name="sort_order" type="number" min={0} defaultValue={subcategory.sort_order} />

                  <select name="access_level" defaultValue={subcategory.access_level || "member"}>
                    <option value="member">클랜원 공개</option>
                    <option value="staff">운영진 전용</option>
                  </select>

                  <label className="menu-visible-check">
                    <input name="is_visible" type="checkbox" defaultChecked={subcategory.is_visible !== false} />
                    표시
                  </label>

                  <button className="button">저장</button>
                  <DeleteBoardButton message={`소분류 ${subcategory.name}와 내부 게시글을 모두 삭제할까요?`} />
                </form>
              ))}

              {!category.board_subcategories.length && <p className="muted">소분류가 없습니다.</p>}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
