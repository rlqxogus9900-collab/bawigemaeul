import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const deadlineDate = String(body?.deadlineDate || "");
  const deadlineTime = String(body?.deadlineTime || "");

  if (!deadlineDate || !deadlineTime) {
    return NextResponse.json(
      { message: "마감 날짜와 시간을 입력해주세요." },
      { status: 400 }
    );
  }

  const deadline = new Date(`${deadlineDate}T${deadlineTime}:00`);

  if (Number.isNaN(deadline.getTime())) {
    return NextResponse.json(
      { message: "잘못된 날짜입니다." },
      { status: 400 }
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("board_polls")
    .update({
      vote_deadline: deadline.toISOString(),
      status: "open"
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "마감시간 변경에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
