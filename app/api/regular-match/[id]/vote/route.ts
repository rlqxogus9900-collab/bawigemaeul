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

  return NextResponse.json({ ok: true, choice });
}
