import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const isPinned = Boolean(body?.isPinned);

  const { error } = await getSupabaseAdmin()
    .from("board_posts")
    .update({ is_pinned: isPinned })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "고정 상태 변경에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const db = getSupabaseAdmin();

  await db.from("board_comments").delete().eq("post_id", id);
  await db.from("board_posts").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
