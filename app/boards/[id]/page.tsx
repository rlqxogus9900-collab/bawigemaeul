import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function BoardPostPage({ params, searchParams }:{ params:Promise<{id:string}>; searchParams:Promise<{board?:string;deleted?:string}> }) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getSession();
  const db = getSupabaseAdmin();
  const { data: post } = await db.from('board_posts').select('id,subcategory_id,title,content,author_member_id,author_nickname,is_pinned,view_count,comment_count,created_at,updated_at').eq('id', id).maybeSingle();
  if (!post) notFound();
  await db.from('board_posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', id);
  const canEdit = Boolean(user && (user.role === 'staff' || user.id === post.author_member_id));
  const boardId = query.board || post.subcategory_id;

  return <>
    <section className="card board-post-card">
      <div className="board-post-top"><div>{post.is_pinned && <span className="board-pin-badge">📌 고정글</span>}<h1>{post.title}</h1><div className="board-post-meta"><span>{post.author_nickname}</span><span>{new Date(post.created_at).toLocaleString('ko-KR')}</span><span>조회 {(post.view_count || 0) + 1}</span></div></div><Link className="button" href={`/boards?board=${boardId}`}>목록</Link></div>
      <div className="board-post-content">{post.content}</div>
      {canEdit && <div className="board-post-actions"><Link className="button" href={`/boards/${post.id}/edit?board=${boardId}`}>수정</Link><form action={`/api/boards/${post.id}/delete`} method="post"><input type="hidden" name="board" value={boardId}/><button className="button danger" onClick={undefined}>삭제</button></form></div>}
    </section>
    <section className="card board-comments-placeholder"><h2>댓글</h2><p className="muted">댓글 기능은 다음 버전에서 연결됩니다.</p></section>
  </>;
}
