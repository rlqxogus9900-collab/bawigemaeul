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
  const updates: Record<string, string | null> = {};

  const parseKoreanDateTime = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // datetime-local 값은 타임존 정보가 없으므로 Vercel(UTC) 서버의 로컬시간으로
    // 해석하지 않고, 사이트 기준인 한국시간(+09:00)으로 고정해서 저장합니다.
    const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed)
      ? trimmed
      : `${trimmed}:00+09:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  if (body?.status === "open" || body?.status === "closed") {
    updates.status = body.status;
  }
  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ message: "제목을 입력해주세요." }, { status: 400 });
    updates.title = title;
  }
  if (typeof body?.description === "string") {
    updates.description = body.description.trim() || null;
  }
  if (typeof body?.matchAt === "string") {
    const date = parseKoreanDateTime(body.matchAt);
    if (!date) return NextResponse.json({ message: "경기 시간을 확인해주세요." }, { status: 400 });
    updates.match_at = date.toISOString();
  }
  if (typeof body?.voteDeadline === "string") {
    const date = parseKoreanDateTime(body.voteDeadline);
    if (!date) return NextResponse.json({ message: "투표 마감 시간을 확인해주세요." }, { status: 400 });
    updates.vote_deadline = date.toISOString();
  }

  if (updates.match_at && updates.vote_deadline) {
    const matchTime = new Date(updates.match_at).getTime();
    const deadlineTime = new Date(updates.vote_deadline).getTime();
    if (deadlineTime > matchTime) {
      return NextResponse.json({ message: "투표 마감 시간은 경기 시작 시간보다 늦을 수 없습니다." }, { status: 400 });
    }
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ message: "수정할 내용이 없습니다." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("regular_match_events")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: `정기내전 투표 수정 실패: ${error.message}` }, { status: 500 });
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
