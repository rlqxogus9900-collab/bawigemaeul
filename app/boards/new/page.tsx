import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function NewBoardPostPage({ searchParams }:{ searchParams:Promise<{board?:string;error?:string}> }) {
  const user = await getSession();
  if (!user) redirect("/login");
  const params = await searchParams;
  const db = getSupabaseAdmin();
  const { data: board } = await db.from("board_subcategories").select("id,name,access_level,is_visible").eq("id", String(params.board || "")).maybeSingle();
  if (!board || board.is_visible === false || (board.access_level === "staff" && user.role !== "staff")) redirect("/boards");

  return <section className="card board-editor-card">
    <div className="board-editor-head"><div><span>NEW POST</span><h1>{board.name} 글쓰기</h1></div><Link className="button" href={`/boards?board=${board.id}`}>목록</Link></div>
    {params.error && <div className="error">제목과 내용을 입력하세요.</div>}
    <form className="board-editor-form" action="/api/boards/posts" method="post">
      <input type="hidden" name="subcategory_id" value={board.id}/>
      <label>제목<input name="title" maxLength={120} required placeholder="게시글 제목"/></label>
      <label>내용<textarea name="content" rows={16} required placeholder="내용을 입력하세요."/></label>
      {user.role === "staff" && <label className="board-check"><input type="checkbox" name="is_pinned"/> 상단 고정글로 등록</label>}
      <div className="board-editor-actions"><Link className="button" href={`/boards?board=${board.id}`}>취소</Link><button className="button primary">게시글 등록</button></div>
    </form>
  </section>;
}
