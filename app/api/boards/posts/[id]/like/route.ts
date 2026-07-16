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

  const { data: existing } = await db
    .from("board_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("member_id", user.id)
    .maybeSingle();

  let liked = false;

  if (existing) {
    await db
      .from("board_post_likes")
      .delete()
      .eq("id", existing.id);
  } else {
    const { error } = await db.from("board_post_likes").insert({
      post_id: postId,
      member_id: user.id
    });

    if (error) {
      return NextResponse.json(
        { message: "추천 처리에 실패했습니다." },
        { status: 500 }
      );
    }

    liked = true;
  }

  const { count } = await db
    .from("board_post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  return NextResponse.json({
    liked,
    count: count || 0
  });
}
