import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function DELETE() {
  try {
    await requireStaff();
    const db = getSupabaseAdmin();
    const { error } = await db.from("regular_match_results").delete().not("id", "is", null);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "초기화 실패" }, { status: 500 }); }
}
