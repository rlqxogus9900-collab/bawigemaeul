import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireStaff(); const { id } = await params; const { error } = await getSupabaseAdmin().from("regular_match_results").delete().eq("id", id); if (error) throw error; return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "삭제 실패" }, { status: 500 }); }
}
