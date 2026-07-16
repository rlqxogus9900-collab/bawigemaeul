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
  const status = body?.status === "closed" ? "closed" : "open";

  const { error } = await getSupabaseAdmin()
    .from("regular_match_events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "상태 변경에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
