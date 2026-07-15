import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const { error } = await getSupabaseAdmin()
    .from("members")
    .update({
      password_hash: await hashPassword("1234"),
      must_change_password: true
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: "비밀번호 초기화에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
