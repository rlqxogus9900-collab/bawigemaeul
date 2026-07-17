import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: pollId } = await params;
  const body = await request.json().catch(() => null);
  const optionIds = Array.isArray(body?.optionIds)
    ? body.optionIds.map(String)
    : [];

  const db = getSupabaseAdmin();
  const { data: poll } = await db
    .from("board_polls")
    .select("id,post_id,poll_type,allow_multiple,status,vote_deadline")
    .eq("id", pollId)
    .maybeSingle();

  const expired =
    poll?.vote_deadline &&
    new Date(poll.vote_deadline).getTime() <= Date.now();

  if (!poll || poll.status !== "open" || expired) {
    return NextResponse.json({ message: "종료된 투표입니다." }, { status: 400 });
  }

  const normalized = poll.allow_multiple ? optionIds.slice(0, 10) : optionIds.slice(0, 1);

  await db
    .from("board_poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("member_id", user.id);

  if (normalized.length) {
    const { error } = await db.from("board_poll_votes").insert(
      normalized.map((optionId: string) => ({
        poll_id: pollId,
        option_id: optionId,
        member_id: user.id,
        member_nickname: user.nickname
      }))
    );

    if (error) {
      return NextResponse.json({ message: "투표 저장에 실패했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
