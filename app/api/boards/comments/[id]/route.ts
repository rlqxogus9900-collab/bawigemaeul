import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { id } = await params;
  const form = await request.formData();
  const fallbackPostId = String(form.get("post_id") || "");
  const action = String(form.get("_action") || "delete");
  const db = getSupabaseAdmin();

  const { data: comment } = await db
    .from("board_comments")
    .select("id,post_id,author_member_id")
    .eq("id", id)
    .maybeSingle();

  if (!comment) {
    return NextResponse.redirect(
      new URL(`/boards/${fallbackPostId}`, request.url),
      303
    );
  }

  if (
    user.role !== "staff" &&
    user.id !== comment.author_member_id
  ) {
    return NextResponse.redirect(
      new URL(`/boards/${comment.post_id}`, request.url),
      303
    );
  }

  if (action === "update") {
    const content = String(form.get("content") || "").trim();

    if (!content) {
      return NextResponse.redirect(
        new URL(`/boards/${comment.post_id}?comment_error=1#comments`, request.url),
        303
      );
    }

    await db
      .from("board_comments")
      .update({
        content: content.slice(0, 1000),
        updated_at: new Date().toISOString()
      })
      .eq("id", id);
  } else {
    await db
      .from("board_comments")
      .delete()
      .eq("id", id);
  }

  return NextResponse.redirect(
    new URL(`/boards/${comment.post_id}#comments`, request.url),
    303
  );
}
