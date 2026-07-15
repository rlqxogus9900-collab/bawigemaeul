import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type IncomingMember = {
  id: string;
  nickname: string;
  riot_id: string;
  role: "member" | "staff";
  is_active: boolean;
};

export async function POST(request: Request) {
  const currentUser = await requireStaff();
  const body = await request.json().catch(() => null);
  const members = Array.isArray(body?.members) ? (body.members as IncomingMember[]) : [];

  if (!members.length) {
    return NextResponse.json({ message: "저장할 클랜원이 없습니다." }, { status: 400 });
  }

  const normalized = members.map(member => ({
    id: String(member.id),
    nickname: String(member.nickname || "").trim(),
    riot_id: String(member.riot_id || "").trim(),
    role: member.role === "staff" ? "staff" : "member",
    is_active: Boolean(member.is_active)
  }));

  if (normalized.some(member => !member.id || !member.nickname || !member.riot_id.includes("#"))) {
    return NextResponse.json(
      { message: "닉네임과 Riot ID를 올바르게 입력하세요." },
      { status: 400 }
    );
  }

  const nicknameSet = new Set(normalized.map(member => member.nickname.toLowerCase()));
  const riotIdSet = new Set(normalized.map(member => member.riot_id.toLowerCase()));

  if (nicknameSet.size !== normalized.length || riotIdSet.size !== normalized.length) {
    return NextResponse.json(
      { message: "중복된 닉네임 또는 Riot ID가 있습니다." },
      { status: 409 }
    );
  }

  const currentRow = normalized.find(member => member.id === currentUser.id);
  if (!currentRow || currentRow.role !== "staff" || !currentRow.is_active) {
    return NextResponse.json(
      { message: "현재 로그인 중인 운영진 계정의 권한이나 상태는 변경할 수 없습니다." },
      { status: 400 }
    );
  }

  if (!normalized.some(member => member.role === "staff" && member.is_active)) {
    return NextResponse.json(
      { message: "활성 운영진은 최소 1명 이상이어야 합니다." },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  for (const member of normalized) {
    const { error } = await db
      .from("members")
      .update({
        nickname: member.nickname,
        riot_id: member.riot_id,
        role: member.role,
        is_active: member.is_active
      })
      .eq("id", member.id);

    if (error) {
      const duplicate = error.code === "23505";
      return NextResponse.json(
        { message: duplicate ? "이미 사용 중인 닉네임 또는 Riot ID입니다." : "저장 중 오류가 발생했습니다." },
        { status: duplicate ? 409 : 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
