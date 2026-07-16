import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export const dynamic="force-dynamic";

export default async function AdminBoardsPage({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
  await requireStaff();
  const params=await searchParams;
  const {data:categories}=await getSupabaseAdmin().from("board_categories").select(`id,name,icon,sort_order,board_subcategories(id,category_id,name,description,sort_order)`).order("sort_order",{ascending:true});
  const normalized=(categories||[]).map(c=>({...c,board_subcategories:[...(c.board_subcategories||[])].sort((a,b)=>a.sort_order-b.sort_order)}));
  return <>
    <section className="card">
      <div className="page-head"><div><span>STAFF ONLY</span><h1>게시판 관리</h1><p className="muted">대분류와 소분류 탭을 추가·수정·삭제하고 순서를 설정합니다.</p></div></div>
      {params.saved&&<div className="flash">게시판 설정을 저장했습니다.</div>}
      {params.error&&<div className="error">입력값 또는 연결된 게시판을 확인하세요.</div>}
      <form className="board-category-create" action="/api/admin/boards/categories" method="post">
        <input name="icon" placeholder="아이콘" defaultValue="💬" required/><input name="name" placeholder="새 대분류 이름" required/>
        <input name="sort_order" type="number" min={0} defaultValue={0}/><button className="button primary">대분류 추가</button>
      </form>
    </section>

    <section className="board-admin-grid">
      {normalized.map(category=><article className="board-admin-category" key={category.id}>
        <form className="board-category-edit" action={`/api/admin/boards/categories/${category.id}`} method="post">
          <input name="icon" defaultValue={category.icon} required/><input name="name" defaultValue={category.name} required/>
          <input name="sort_order" type="number" min={0} defaultValue={category.sort_order}/>
          <button className="button">대분류 저장</button><button className="button danger" name="_action" value="delete">삭제</button>
        </form>
        <div className="board-sub-admin-head"><b>{category.icon} {category.name} 소분류</b></div>
        <form className="board-sub-create" action="/api/admin/boards/subcategories" method="post">
          <input type="hidden" name="category_id" value={category.id}/><input name="name" placeholder="새 소분류 이름" required/>
          <input name="description" placeholder="탭 설명 (선택)"/><input name="sort_order" type="number" min={0} defaultValue={0}/>
          <button className="button primary">소분류 추가</button>
        </form>
        <div className="board-sub-admin-list">
          {category.board_subcategories.map(sub=><form key={sub.id} className="board-sub-edit" action={`/api/admin/boards/subcategories/${sub.id}`} method="post">
            <input name="name" defaultValue={sub.name} required/><input name="description" defaultValue={sub.description||""} placeholder="설명"/>
            <input name="sort_order" type="number" min={0} defaultValue={sub.sort_order}/><button className="button">저장</button>
            <button className="button danger" name="_action" value="delete">삭제</button>
          </form>)}
          {!category.board_subcategories.length&&<p className="muted">소분류가 없습니다.</p>}
        </div>
      </article>)}
    </section>
  </>;
}
