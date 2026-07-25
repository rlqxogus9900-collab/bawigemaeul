import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
    const { id } = await context.params;
    const { error } = await getSupabaseAdmin().from("regular_match_player_stats").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "기록 삭제 실패" }, { status: 500 });
  }
}
