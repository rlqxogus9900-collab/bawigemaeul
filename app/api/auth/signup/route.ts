import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";
import { deleteMemberCompletely } from "@/lib/delete-member-completely";

function normalizeNickname(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeRiotId(value: string) {
  const trimmed = value.trim().replace(/\s+/g, "");
  const [gameName, tagLine] = trimmed.split("#");
  if (!gameName || !tagLine) return trimmed;
  return `${gameName}#${tagLine.toUpperCase()}`;
}

function signupRedirect(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(error)}`, request.url), 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const nickname = normalizeNickname(String(form.get("nickname") || ""));
  const password = String(form.get("password") || "");
  const confirm = String(form.get("password_confirm") || "");
  const riotId = normalizeRiotId(String(form.get("riot_id") || ""));
  const matchTierRaw = Number(form.get("match_tier") || 0);
  const matchTier = Number.isInteger(matchTierRaw) && matchTierRaw >= 1 && matchTierRaw <= 5
    ? matchTierRaw
    : null;

  if (nickname.length < 2) return signupRedirect(request, "nickname_invalid");
  if (password.length < 4 || password !== confirm) return signupRedirect(request, "password_invalid");
  if (!riotId.includes("#")) return signupRedirect(request, "riot_id_invalid");

  const db = getSupabaseAdmin();

  // 대소문자와 공백 차이까지 잡기 위해 닉네임/Riot ID를 각각 조회합니다.
  const [{ data: nicknameMatches, error: nicknameLookupError }, { data: riotMatches, error: riotLookupError }] = await Promise.all([
    db.from("members").select("id,nickname,riot_id,is_active,approval_status,role").ilike("nickname", nickname),
    db.from("members").select("id,nickname,riot_id,is_active,approval_status,role").ilike("riot_id", riotId)
  ]);

  if (nicknameLookupError || riotLookupError) {
    return signupRedirect(request, "lookup_failed");
  }

  const matches = [...(nicknameMatches || []), ...(riotMatches || [])]
    .filter((member, index, all) => all.findIndex(item => item.id === member.id) === index);

  const nicknameBlocking = matches.find(member =>
    member.nickname.localeCompare(nickname, undefined, { sensitivity: "accent" }) === 0 &&
    (member.is_active || member.approval_status === "approved" || member.approval_status === "pending")
  );
  if (nicknameBlocking) return signupRedirect(request, "nickname_duplicate");

  const riotBlocking = matches.find(member =>
    normalizeRiotId(member.riot_id || "").toLowerCase() === riotId.toLowerCase() &&
    (member.is_active || member.approval_status === "approved" || member.approval_status === "pending")
  );
  if (riotBlocking) return signupRedirect(request, "riot_id_duplicate");

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

  // 예전 버전에서 남은 비활성/반려 찌꺼기 행이 있으면 하나만 재사용하고 나머지는 제거합니다.
  const reusable = matches.find(member => member.role !== "staff") || null;
  for (const stale of matches) {
    if (!reusable || stale.id === reusable.id || stale.role === "staff") continue;
    await deleteMemberCompletely(db, stale);
  }

  const result = reusable
    ? await db.from("members").update(signupData).eq("id", reusable.id)
    : await db.from("members").insert(signupData);

  if (result.error) {
    const message = result.error.message.toLowerCase();
    if (message.includes("nickname")) return signupRedirect(request, "nickname_duplicate");
    if (message.includes("riot_id") || message.includes("riot id")) return signupRedirect(request, "riot_id_duplicate");
    return signupRedirect(request, "save_failed");
  }

  return NextResponse.redirect(new URL("/signup?done=1", request.url), 303);
}
