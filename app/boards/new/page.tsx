import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import BoardPostComposer from "./BoardPostComposer";

export const dynamic = "force-dynamic";

export default async function NewBoardPostPage({
  searchParams
}: {
  searchParams: Promise<{ board?: string; error?: string }>
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const params = await searchParams;
  const db = getSupabaseAdmin();

  const { data: board } = await db
    .from("board_subcategories")
    .select("id,name,access_level,is_visible")
    .eq("id", String(params.board || ""))
    .maybeSingle();

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
          <h1>{board.name} 글쓰기</h1>
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
      />
    </section>
  );
}
