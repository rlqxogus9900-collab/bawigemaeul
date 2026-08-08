import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword, verifyPassword } from "@/lib/password";

function jsonError(message: string, status = 500, code = "RESET_FAILED") {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireStaff();
    const { id } = await params;
    if (!id) return jsonError("회원 ID가 전달되지 않았습니다.", 400, "MISSING_MEMBER_ID");

    const db = getSupabaseAdmin();

    // 먼저 대상 회원이 실제로 존재하는지 확인해서 오류 원인을 명확히 표시한다.
    const { data: target, error: targetError } = await db
      .from("members")
      .select("id,nickname,is_active")
      .eq("id", id)
      .maybeSingle();

    if (targetError) {
      return jsonError(`회원 조회 실패: ${targetError.message}`, 500, "MEMBER_LOOKUP_FAILED");
    }
    if (!target) {
      return jsonError("초기화할 회원을 찾지 못했습니다.", 404, "MEMBER_NOT_FOUND");
    }
    if (!target.is_active) {
      return jsonError("비활성 계정은 비밀번호를 초기화할 수 없습니다.", 400, "MEMBER_INACTIVE");
    }

    const newHash = await hashPassword("1234");
    const { data: updated, error: updateError } = await db
      .from("members")
      .update({ password_hash: newHash, must_change_password: true })
      .eq("id", id)
      .select("id,nickname,password_hash,must_change_password,is_active")
      .maybeSingle();

    if (updateError) {
      return jsonError(`DB 저장 실패: ${updateError.message}`, 500, "PASSWORD_UPDATE_FAILED");
    }
    if (!updated) {
      return jsonError("DB에서 회원 정보가 갱신되지 않았습니다.", 500, "NO_UPDATED_ROW");
    }

    const verified = await verifyPassword("1234", String(updated.password_hash || ""));
    if (!verified) {
      return jsonError("DB에는 저장됐지만 새 비밀번호 검증에 실패했습니다.", 500, "HASH_VERIFY_FAILED");
    }
    if (!updated.must_change_password) {
      return jsonError("비밀번호 변경 필수 상태가 저장되지 않았습니다.", 500, "FORCE_CHANGE_FLAG_FAILED");
    }

    return NextResponse.json({
      ok: true,
      code: "RESET_OK",
      nickname: updated.nickname,
      staff: staff.nickname,
      message: `${updated.nickname}님의 비밀번호를 1234로 초기화했습니다. 다음 로그인 시 새 비밀번호 설정이 필요합니다.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("운영진 권한") ? 403 : 500;
    return jsonError(`비밀번호 초기화 처리 오류: ${message}`, status, status === 403 ? "STAFF_REQUIRED" : "UNEXPECTED_ERROR");
  }
}
