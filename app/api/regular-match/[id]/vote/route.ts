import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const choices = new Set(["attending", "absent", "undecided"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: eventId } = await params;
  const body = await request.json().catch(() => null);
  const choice = String(body?.choice || "");

  if (!choices.has(choice)) {
    return NextResponse.json({ message: "잘못된 투표 값입니다." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: event } = await db
    .from("regular_match_events")
    .select("id,status,vote_deadline")
    .eq("id", eventId)
    .maybeSingle();

  const expired =
    event?.vote_deadline &&
    new Date(event.vote_deadline).getTime() <= Date.now();

  if (!event || event.status !== "open" || expired) {
    return NextResponse.json({ message: "종료된 모집입니다." }, { status: 400 });
  }

  const { data: existingVote, error: existingVoteError } = await db
    .from("regular_match_votes")
    .select("id,choice")
    .eq("event_id", eventId)
    .eq("member_id", user.id)
    .maybeSingle();

  if (existingVoteError) {
    return NextResponse.json({ message: "현재 투표 상태를 확인하지 못했습니다." }, { status: 500 });
  }

  // 같은 선택지를 다시 누르면 미선택 상태로 되돌립니다.
  if (existingVote?.choice === choice) {
    const { error: deleteError } = await db
      .from("regular_match_votes")
      .delete()
      .eq("event_id", eventId)
      .eq("member_id", user.id);

    if (deleteError) {
      return NextResponse.json({ message: "투표 취소에 실패했습니다." }, { status: 500 });
    }

    // 참가를 취소한 사용자가 팀장으로 지정돼 있었다면 팀장 지정도 함께 해제합니다.
    if (choice === "attending") {
      await db
        .from("regular_match_captains")
        .delete()
        .eq("event_id", eventId)
        .eq("member_id", user.id);
    }

    return NextResponse.json({ ok: true, choice: null, cancelled: true });
  }

  const { error } = await db
    .from("regular_match_votes")
    .upsert(
      {
        event_id: eventId,
        member_id: user.id,
        member_nickname: user.nickname,
        choice,
        updated_at: new Date().toISOString()
      },
      { onConflict: "event_id,member_id" }
    );

  if (error) {
    return NextResponse.json({ message: "투표 저장에 실패했습니다." }, { status: 500 });
  }

  // 참가에서 미정으로 바꾼 경우에도 더 이상 참가자가 아니므로 팀장 지정을 해제합니다.
  if (existingVote?.choice === "attending" && choice !== "attending") {
    await db
      .from("regular_match_captains")
      .delete()
      .eq("event_id", eventId)
      .eq("member_id", user.id);
  }

  return NextResponse.json({ ok: true, choice, cancelled: false });
}
