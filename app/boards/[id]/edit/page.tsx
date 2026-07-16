import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params, searchParams }:{ params:Promise<{id:string}>; searchParams:Promise<{board?:string;error?:string}> }) {
  const user = await getSession();
  if (!user) redirect('/login');
  const { id } = await params;
  const query = await searchParams;
  const db = getSupabaseAdmin();
  const { data: post } = await db.from('board_posts').select('*').eq('id', id).maybeSingle();
  if (!post) notFound();
  if (user.role !== 'staff' && user.id !== post.author_member_id) redirect(`/boards/${id}?board=${post.subcategory_id}`);
  const { data: boards } = await db.from('board_subcategories').select('id,name,access_level,is_visible').eq('is_visible', true).order('sort_order');
  const allowed = (boards || []).filter(board => board.access_level !== 'staff' || user.role === 'staff');

  return <section className="card board-editor-card">
    <div className="board-editor-head"><div><span>EDIT POST</span><h1>게시글 수정</h1></div><Link href={`/boards/${id}?board=${query.board || post.subcategory_id}`} className="button">돌아가기</Link></div>
    {query.error && <div className="error">제목과 내용을 입력해주세요.</div>}
    <form className="board-editor-form" action={`/api/boards/${id}/update`} method="post">
      <input type="hidden" name="return_board" value={query.board || post.subcategory_id}/>
      <label>게시판<select name="subcategory_id" defaultValue={post.subcategory_id}>{allowed.map(board => <option key={board.id} value={board.id}>{board.name}</option>)}</select></label>
      <label>제목<input name="title" defaultValue={post.title} maxLength={120} required /></label>
      {user.role === 'staff' && <label className="board-pin-check"><input type="checkbox" name="is_pinned" defaultChecked={post.is_pinned}/> 상단 고정글</label>}
      <label>내용<textarea name="content" rows={15} defaultValue={post.content} required /></label>
      <div className="board-editor-actions"><Link className="button" href={`/boards/${id}?board=${query.board || post.subcategory_id}`}>취소</Link><button className="button primary">수정 저장</button></div>
    </form>
  </section>;
}
