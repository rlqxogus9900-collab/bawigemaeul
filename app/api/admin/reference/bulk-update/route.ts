import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type MemberUpdate = {
  id: string;
  match_tier: number | null;
  main_line: string;
  sub_line: string;
  reference_note: string | null;
};

export async function POST(request: Request) {
  await requireStaff();

  const body = await request.json().catch(() => null);
  const members = Array.isArray(body?.members) ? body.members as MemberUpdate[] : [];

  if (!members.length) {
    return NextResponse.json({ message: "저장할 명단이 없습니다." }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  for (const member of members) {
    const tier = member.match_tier == null ? null : Number(member.match_tier);

    if (tier !== null && ![1,2,3,4,5].includes(tier)) {
      return NextResponse.json({ message: "내전 티어는 1~5만 사용할 수 있습니다." }, { status: 400 });
    }

    const { error } = await db
      .from("members")
      .update({
        match_tier: tier,
        main_line: String(member.main_line || "미정"),
        sub_line: String(member.sub_line || "미정"),
        reference_note: String(member.reference_note || "").trim() || null
      })
      .eq("id", member.id);

    if (error) {
      return NextResponse.json({ message: "명단 저장 중 오류가 발생했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
