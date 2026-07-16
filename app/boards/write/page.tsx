import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BoardWritePage({ searchParams }:{ searchParams:Promise<{board?:string;error?:string}> }) {
  const user = await getSession();
  if (!user) redirect('/login');
  const params = await searchParams;
  const db = getSupabaseAdmin();
  const { data: boards } = await db.from('board_subcategories').select('id,name,access_level,is_visible').eq('is_visible', true).order('sort_order');
  const allowed = (boards || []).filter(board => board.access_level !== 'staff' || user.role === 'staff');
  const selected = allowed.some(board => board.id === params.board) ? params.board : allowed[0]?.id || '';

  return <section className="card board-editor-card">
    <div className="board-editor-head"><div><span>NEW POST</span><h1>게시글 작성</h1></div><Link href={`/boards?board=${selected}`} className="button">목록으로</Link></div>
    {params.error && <div className="error">제목과 내용을 입력해주세요.</div>}
    <form className="board-editor-form" action="/api/boards" method="post">
      <label>게시판<select name="subcategory_id" defaultValue={selected} required>{allowed.map(board => <option key={board.id} value={board.id}>{board.name}</option>)}</select></label>
      <label>제목<input name="title" maxLength={120} required placeholder="제목을 입력하세요" /></label>
      {user.role === 'staff' && <label className="board-pin-check"><input type="checkbox" name="is_pinned" /> 상단 고정글로 등록</label>}
      <label>내용<textarea name="content" rows={15} required placeholder="내용을 입력하세요" /></label>
      <div className="board-editor-actions"><Link href={`/boards?board=${selected}`} className="button">취소</Link><button className="button primary">게시글 등록</button></div>
    </form>
  </section>;
}
