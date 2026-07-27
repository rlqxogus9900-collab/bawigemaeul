import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data: poll } = await db
    .from("board_polls")
    .select("id,post_id")
    .eq("id", id)
    .maybeSingle();

  if (!poll) {
    return NextResponse.json({ message: "투표를 찾을 수 없습니다." }, { status: 404 });
  }

  // FK 설정 여부와 관계없이 관련 데이터를 먼저 정리합니다.
  await db.from("board_poll_captains").delete().eq("poll_id", id);
  await db.from("board_poll_votes").delete().eq("poll_id", id);
  await db.from("board_poll_options").delete().eq("poll_id", id);
  const { error: pollError } = await db.from("board_polls").delete().eq("id", id);

  if (pollError) {
    return NextResponse.json({ message: "투표 삭제에 실패했습니다." }, { status: 500 });
  }

  if (poll.post_id) {
    await db.from("board_comments").delete().eq("post_id", poll.post_id);
    await db.from("board_posts").delete().eq("id", poll.post_id);
  }

  return NextResponse.json({ ok: true });
}
