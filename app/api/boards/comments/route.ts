import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await getSession();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const form = await request.formData();
  const postId = String(form.get("post_id") || "");
  const content = String(form.get("content") || "").trim();

  if (!postId || !content) {
    return NextResponse.redirect(
      new URL(`/boards/${postId}?comment_error=1`, request.url),
      303
    );
  }

  const db = getSupabaseAdmin();

  const { data: post } = await db
    .from("board_posts")
    .select("id,subcategory_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) {
    return NextResponse.redirect(new URL("/boards", request.url), 303);
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
    return NextResponse.redirect(new URL("/boards", request.url), 303);
  }

  const { error } = await db.from("board_comments").insert({
    post_id: postId,
    author_member_id: user.id,
    author_nickname: user.nickname,
    content: content.slice(0, 1000)
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/boards/${postId}?comment_error=1`, request.url),
      303
    );
  }

  return NextResponse.redirect(
    new URL(`/boards/${postId}#comments`, request.url),
    303
  );
}
