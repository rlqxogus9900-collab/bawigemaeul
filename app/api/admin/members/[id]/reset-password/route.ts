import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const db = getSupabaseAdmin();
  const newHash = await hashPassword("1234");

  const { data: updated, error } = await db
    .from("members")
    .update({
      password_hash: newHash,
      must_change_password: true
    })
    .eq("id", id)
    .select("id,nickname,password_hash,must_change_password,is_active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: `비밀번호 초기화 실패: ${error.message}` }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ message: "초기화할 회원을 찾지 못했습니다." }, { status: 404 });
  }

  const verified = await verifyPassword("1234", updated.password_hash);
  if (!verified || !updated.must_change_password) {
    return NextResponse.json({ message: "비밀번호 초기화 값 저장 확인에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    nickname: updated.nickname,
    message: "비밀번호를 1234로 초기화했습니다. 기존 로그인 세션도 다음 요청부터 비밀번호 변경 화면으로 이동합니다."
  });
}
