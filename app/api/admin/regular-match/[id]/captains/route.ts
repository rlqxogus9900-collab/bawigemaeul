import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id: eventId } = await params;
  const body = await request.json().catch(() => null);
  const memberId = String(body?.memberId || "");
  const db = getSupabaseAdmin();

  const { data: member } = await db
    .from("members")
    .select("id,nickname")
    .eq("id", memberId)
    .eq("is_active", true)
    .maybeSingle();

  const { data: vote } = await db
    .from("regular_match_votes")
    .select("id")
    .eq("event_id", eventId)
    .eq("member_id", memberId)
    .eq("choice", "attending")
    .maybeSingle();

  if (!member || !vote) {
    return NextResponse.json(
      { message: "참가 투표한 클랜원만 팀장으로 지정할 수 있습니다." },
      { status: 400 }
    );
  }

  const { error } = await db
    .from("regular_match_captains")
    .upsert(
      {
        event_id: eventId,
        member_id: member.id,
        member_nickname: member.nickname
      },
      { onConflict: "event_id,member_id" }
    );

  if (error) {
    return NextResponse.json({ message: "팀장 지정에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id: eventId } = await params;
  const body = await request.json().catch(() => null);
  const memberId = String(body?.memberId || "");

  await getSupabaseAdmin()
    .from("regular_match_captains")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", memberId);

  return NextResponse.json({ ok: true });
}
