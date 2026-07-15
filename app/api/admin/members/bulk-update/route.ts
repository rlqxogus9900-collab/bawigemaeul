import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type IncomingMember = {
  id: string;
  nickname: string;
  riot_id: string;
  current_tier: string | null;
  highest_tier: string | null;
  average_tier: string | null;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  role: "member" | "staff";
  activity_status: string | null;
  activity_excluded: boolean;
  is_active: boolean;
};

export async function POST(request: Request) {
  const currentUser = await requireStaff();
  const body = await request.json().catch(() => null);
  const members = Array.isArray(body?.members) ? body.members as IncomingMember[] : [];

  if (!members.length) {
    return NextResponse.json({ message: "저장할 명단이 없습니다." }, { status: 400 });
  }

  const normalized = members.map(member => ({
    id: String(member.id),
    nickname: String(member.nickname || "").trim(),
    riot_id: String(member.riot_id || "").trim(),
    current_tier: String(member.current_tier || "").trim() || null,
    highest_tier: String(member.highest_tier || "").trim() || null,
    average_tier: String(member.average_tier || "").trim() || null,
    match_tier: member.match_tier == null ? null : Number(member.match_tier),
    main_line: String(member.main_line || "미정"),
    sub_line: String(member.sub_line || "미정"),
    role: member.role === "staff" ? "staff" : "member",
    activity_status: member.activity_status === "active" ? "active" : "inactive",
    activity_excluded: Boolean(member.activity_excluded),
    is_active: Boolean(member.is_active)
  }));

  if (normalized.some(member => !member.nickname || !member.riot_id.includes("#"))) {
    return NextResponse.json({ message: "닉네임과 Riot ID를 확인하세요." }, { status: 400 });
  }

  if (normalized.some(member => member.match_tier !== null && ![1,2,3,4,5].includes(member.match_tier))) {
    return NextResponse.json({ message: "내전티어는 1~5만 사용할 수 있습니다." }, { status: 400 });
  }

  const nicknameSet = new Set(normalized.map(member => member.nickname.toLowerCase()));
  const riotIdSet = new Set(normalized.map(member => member.riot_id.toLowerCase()));

  if (nicknameSet.size !== normalized.length || riotIdSet.size !== normalized.length) {
    return NextResponse.json({ message: "중복된 닉네임 또는 Riot ID가 있습니다." }, { status: 409 });
  }

  const currentRow = normalized.find(member => member.id === currentUser.id);
  if (!currentRow || currentRow.role !== "staff" || !currentRow.is_active) {
    return NextResponse.json({ message: "본인 운영진 계정의 권한 또는 상태는 변경할 수 없습니다." }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  for (const member of normalized) {
    const { error } = await db
      .from("members")
      .update(member)
      .eq("id", member.id);

    if (error) {
      return NextResponse.json({ message: "명단 저장 중 오류가 발생했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
