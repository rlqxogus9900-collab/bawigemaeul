import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const form = await request.formData();
  const nickname = String(form.get("nickname") || "").trim();
  const password = String(form.get("password") || "");
  const confirm = String(form.get("password_confirm") || "");
  const riotId = String(form.get("riot_id") || "").trim();
  const matchTierRaw = Number(form.get("match_tier") || 0);
  const matchTier = Number.isInteger(matchTierRaw) && matchTierRaw >= 1 && matchTierRaw <= 5
    ? matchTierRaw
    : null;

  if (nickname.length < 2 || password.length < 4 || password !== confirm || !riotId.includes("#")) {
    return NextResponse.redirect(new URL("/signup?error=invalid", request.url), 303);
  }

  const db = getSupabaseAdmin();
  const { data: matches, error: lookupError } = await db
    .from("members")
    .select("id,nickname,riot_id,is_active,approval_status")
    .or(`nickname.eq.${nickname},riot_id.eq.${riotId}`);

  if (lookupError) {
    return NextResponse.redirect(new URL("/signup?error=1", request.url), 303);
  }

  const blockingDuplicate = (matches || []).find(member =>
    member.is_active || member.approval_status === "approved" || member.approval_status === "pending"
  );

  if (blockingDuplicate) {
    return NextResponse.redirect(new URL("/signup?error=duplicate", request.url), 303);
  }

  const signupData = {
    nickname,
    riot_id: riotId,
    password_hash: await hashPassword(password),
    role: "member",
    must_change_password: false,
    is_active: false,
    approval_status: "pending",
    rejection_reason: null,
    current_tier: String(form.get("current_tier") || "미정"),
    highest_tier: String(form.get("highest_tier") || "미정"),
    match_tier: matchTier,
    main_line: String(form.get("main_line") || "미정"),
    sub_line: String(form.get("sub_line") || "미정"),
    notes: String(form.get("notes") || "").trim()
  };

  // 명단에서 제외되었거나 이전에 반려된 계정은 새 행을 만들지 않고
  // 기존 계정을 승인 대기 상태로 되살려 재가입할 수 있게 합니다.
  const reusable = (matches || [])[0];
  const result = reusable
    ? await db.from("members").update(signupData).eq("id", reusable.id)
    : await db.from("members").insert(signupData);

  return NextResponse.redirect(new URL(result.error ? "/signup?error=1" : "/signup?done=1", request.url), 303);
}
