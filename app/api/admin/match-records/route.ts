import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json();
    const teamA = String(body.teamA || "").trim();
    const teamB = String(body.teamB || "").trim();
    const setsA = Number(body.setsA || 0);
    const setsB = Number(body.setsB || 0);
    if (!teamA || !teamB) return NextResponse.json({ error: "팀 이름을 입력해주세요." }, { status: 400 });
    if (setsA === setsB) return NextResponse.json({ error: "승패가 나뉘도록 세트 점수를 입력해주세요." }, { status: 400 });
    const { error } = await getSupabaseAdmin().from("regular_match_results").insert({
      team_a_name: teamA, team_b_name: teamB, team_a_sets: setsA, team_b_sets: setsB,
      winner_name: setsA > setsB ? teamA : teamB,
      played_at: body.playedAt || new Date().toISOString()
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "기록 저장 실패" }, { status: 500 });
  }
}
