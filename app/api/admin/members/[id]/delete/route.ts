import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireStaff();
  const { id } = await params;

  if (currentUser.id === id) {
    return NextResponse.json(
      { message: "현재 로그인 중인 본인 계정은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();
  const { data: target } = await db.from("members").select("id,role").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ message: "계정을 찾을 수 없습니다." }, { status: 404 });

  if (target.role === "staff") {
    const { count } = await db.from("members").select("id", { count: "exact", head: true }).eq("role", "staff").eq("is_active", true);
    if ((count || 0) <= 1) return NextResponse.json({ message: "마지막 운영진 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  const { error } = await db.from("members").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ message: "계정 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
