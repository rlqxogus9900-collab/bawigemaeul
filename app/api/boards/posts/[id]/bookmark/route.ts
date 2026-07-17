import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { id: postId } = await params;
  const db = getSupabaseAdmin();

  const { data: post } = await db
    .from("board_posts")
    .select("id,subcategory_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.json(
      { message: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { data: board } = await db
    .from("board_subcategories")
    .select("id,access_level,is_visible")
    .eq("id", post.subcategory_id)
    .maybeSingle();

  if (
    !board ||
    board.is_visible === false ||
    (board.access_level === "staff" && user.role !== "staff")
  ) {
    return NextResponse.json(
      { message: "접근할 수 없는 게시글입니다." },
      { status: 403 }
    );
  }

  const { data: existing } = await db
    .from("board_post_bookmarks")
    .select("id")
    .eq("post_id", postId)
    .eq("member_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("board_post_bookmarks")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { message: "즐겨찾기 해제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookmarked: false });
  }

  const { error } = await db.from("board_post_bookmarks").insert({
    post_id: postId,
    member_id: user.id
  });

  if (error) {
    return NextResponse.json(
      { message: "즐겨찾기 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookmarked: true });
}
