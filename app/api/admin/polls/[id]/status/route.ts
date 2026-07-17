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

  const { error } = await getSupabaseAdmin()
    .from("board_polls")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ message: "변경 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
