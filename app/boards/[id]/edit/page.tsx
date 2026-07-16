import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function EditBoardPostPage({ params }:{ params:Promise<{id:string}> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  const db = getSupabaseAdmin();
  const { data: post } = await db.from("board_posts").select("id,subcategory_id,title,content,author_member_id,is_pinned").eq("id", id).maybeSingle();
  if (!post) notFound();
  if (user.role !== "staff" && user.id !== post.author_member_id) redirect(`/boards/${id}`);

  return <section className="card board-editor-card">
    <div className="board-editor-head"><div><span>EDIT POST</span><h1>게시글 수정</h1></div><Link className="button" href={`/boards/${id}`}>돌아가기</Link></div>
    <form className="board-editor-form" action={`/api/boards/posts/${id}`} method="post">
      <input type="hidden" name="_action" value="update"/>
      <label>제목<input name="title" maxLength={120} required defaultValue={post.title}/></label>
      <label>내용<textarea name="content" rows={16} required defaultValue={post.content}/></label>
      {user.role === "staff" && <label className="board-check"><input type="checkbox" name="is_pinned" defaultChecked={post.is_pinned}/> 상단 고정글</label>}
      <div className="board-editor-actions"><Link className="button" href={`/boards/${id}`}>취소</Link><button className="button primary">수정 저장</button></div>
    </form>
  </section>;
}
