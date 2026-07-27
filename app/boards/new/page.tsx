import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import BoardPostComposer from "./BoardPostComposer";

export const dynamic = "force-dynamic";

export default async function NewBoardPostPage({
  searchParams
}: {
  searchParams: Promise<{ board?: string; error?: string; community?: string }>
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const params = await searchParams;
  const db = getSupabaseAdmin();

  const [{ data: board }, { data: writingBoards }] = await Promise.all([
    db.from("board_subcategories")
      .select("id,name,access_level,is_visible")
      .eq("id", String(params.board || ""))
      .maybeSingle(),
    db.from("board_subcategories")
      .select("id,name,access_level,is_visible,sort_order")
      .in("name", ["자유게시판", "질문게시판", "공략게시판", "밸런스게임"])
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
  ]);

  if (
    !board ||
    board.is_visible === false ||
    (board.access_level === "staff" && user.role !== "staff")
  ) {
    redirect("/boards");
  }

  return (
    <section className="card board-editor-card">
      <div className="board-editor-head">
        <div>
          <span>NEW POST</span>
          <h1>{params.community === "1" ? "커뮤니티 글쓰기" : `${board.name} 글쓰기`}</h1>
        </div>
        <Link className="button" href={`/boards?board=${board.id}`}>
          목록
        </Link>
      </div>

      {params.error && (
        <div className="error">입력값을 다시 확인해주세요.</div>
      )}

      <BoardPostComposer
        boardId={board.id}
        boardName={board.name}
        isStaff={user.role === "staff"}
        writingBoards={params.community === "1" ? (writingBoards || []) : []}
      />
    </section>
  );
}
