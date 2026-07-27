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
  const status = body?.status === "closed" ? "closed" : "open";

  const { error } = await getSupabaseAdmin()
    .from("regular_match_events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "상태 변경에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const db = getSupabaseAdmin();

  // 연결된 투표·팀장 데이터는 FK cascade가 설정된 환경에서는 자동 삭제됩니다.
  // 이전 DB도 안전하게 동작하도록 자식 데이터를 먼저 정리합니다.
  await db.from("regular_match_votes").delete().eq("event_id", id);
  await db.from("regular_match_captains").delete().eq("event_id", id);

  const { error } = await db.from("regular_match_events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: "일정 삭제에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
