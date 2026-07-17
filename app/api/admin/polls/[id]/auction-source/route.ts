import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const db = getSupabaseAdmin();

  await db.from("board_polls").update({ is_auction_source: false }).eq("poll_type", "regular_match");
  const { error } = await db.from("board_polls").update({ is_auction_source: true }).eq("id", id);

  if (error) {
    return NextResponse.json({ message: "설정 실패" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
