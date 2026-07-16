import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function BoardPostPage({ params }:{ params:Promise<{id:string}> }) {
  const { id } = await params;
  const user = await getSession();
  const db = getSupabaseAdmin();
  const { data: post } = await db.from("board_posts").select("id,subcategory_id,title,content,author_member_id,author_nickname,is_pinned,view_count,comment_count,created_at,updated_at").eq("id", id).maybeSingle();
  if (!post) notFound();
  const { data: board } = await db.from("board_subcategories").select("id,name,access_level,is_visible").eq("id", post.subcategory_id).maybeSingle();
  if (!board || board.is_visible === false || (board.access_level === "staff" && user?.role !== "staff")) notFound();

  await db.from("board_posts").update({ view_count: Number(post.view_count || 0) + 1 }).eq("id", id);
  const canManage = Boolean(user && (user.role === "staff" || user.id === post.author_member_id));

  return <>
    <section className="card board-detail-card">
      <div className="board-detail-top"><div><span>{post.is_pinned ? "📌 고정글" : board.name}</span><h1>{post.title}</h1></div><Link className="button" href={`/boards?board=${board.id}`}>목록</Link></div>
      <div className="board-post-meta"><b>{post.author_nickname}</b><span>{new Date(post.created_at).toLocaleString("ko-KR")}</span><span>조회 {Number(post.view_count || 0)+1}</span></div>
      <div className="board-post-content">{post.content}</div>
      {canManage && <div className="board-detail-actions">
        <Link className="button" href={`/boards/${post.id}/edit`}>수정</Link>
        <form action={`/api/boards/posts/${post.id}`} method="post"><input type="hidden" name="_action" value="delete"/><button className="button danger">삭제</button></form>
      </div>}
    </section>
  </>;
}
