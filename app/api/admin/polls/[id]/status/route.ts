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
  const status = body?.status === "closed" ? "closed" : "open";

  const db = getSupabaseAdmin();

  const { data: poll } = await db
    .from("board_polls")
    .select("id,vote_deadline")
    .eq("id", id)
    .maybeSingle();

  if (!poll) {
    return NextResponse.json({ message: "투표를 찾을 수 없습니다." }, { status: 404 });
  }

  const update: Record<string, unknown> = { status };

  if (
    status === "open" &&
    poll.vote_deadline &&
    new Date(poll.vote_deadline).getTime() <= Date.now()
  ) {
    update.vote_deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  }

  const { error } = await db
    .from("board_polls")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ message: "변경 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
