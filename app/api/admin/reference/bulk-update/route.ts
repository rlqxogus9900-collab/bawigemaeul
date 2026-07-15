import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type MemberUpdate = {
  id: string;
  tier: string;
  main_line: string;
  sub_line: string;
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
    const { error } = await db
      .from("members")
      .update({
        tier: String(member.tier || "언랭크"),
        main_line: String(member.main_line || "미정"),
        sub_line: String(member.sub_line || "미정")
      })
      .eq("id", member.id);

    if (error) {
      return NextResponse.json({ message: "명단 저장 중 오류가 발생했습니다." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
