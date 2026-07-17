import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();

  const { id: pollId } = await params;
  const body = await request.json().catch(() => null);
  const memberId = String(body?.memberId || "");
  const db = getSupabaseAdmin();

  const { data: attendingOption } = await db
    .from("board_poll_options")
    .select("id")
    .eq("poll_id", pollId)
    .eq("label", "참가")
    .maybeSingle();

  if (!attendingOption) {
    return NextResponse.json(
      { message: "참가 선택지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { data: vote } = await db
    .from("board_poll_votes")
    .select("member_id,member_nickname")
    .eq("poll_id", pollId)
    .eq("option_id", attendingOption.id)
    .eq("member_id", memberId)
    .maybeSingle();

  if (!vote) {
    return NextResponse.json(
      { message: "참가를 선택한 클랜원만 팀장으로 지정할 수 있습니다." },
      { status: 400 }
    );
  }

  const { error } = await db
    .from("board_poll_captains")
    .upsert(
      {
        poll_id: pollId,
        member_id: vote.member_id,
        member_nickname: vote.member_nickname
      },
      { onConflict: "poll_id,member_id" }
    );

  if (error) {
    return NextResponse.json(
      { message: "팀장 지정에 실패했습니다." },
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

  const { id: pollId } = await params;
  const body = await request.json().catch(() => null);
  const memberId = String(body?.memberId || "");

  const { error } = await getSupabaseAdmin()
    .from("board_poll_captains")
    .delete()
    .eq("poll_id", pollId)
    .eq("member_id", memberId);

  if (error) {
    return NextResponse.json(
      { message: "팀장 해제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
