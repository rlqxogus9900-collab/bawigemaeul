import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const validLines = new Set(["탑", "정글", "미드", "원딜", "서폿"]);

export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json();
    const memberId = String(body.memberId || "");
    const line = String(body.line || "");
    const kills = Number(body.kills);
    const deaths = Number(body.deaths);
    const assists = Number(body.assists);
    if (!memberId) return NextResponse.json({ error: "클랜원을 선택해주세요." }, { status: 400 });
    if (!validLines.has(line)) return NextResponse.json({ error: "라인을 선택해주세요." }, { status: 400 });
    if (![kills, deaths, assists].every(Number.isInteger) || [kills, deaths, assists].some(v => v < 0)) {
      return NextResponse.json({ error: "킬·데스·어시스트는 0 이상의 정수로 입력해주세요." }, { status: 400 });
    }
    const { error } = await getSupabaseAdmin().from("regular_match_player_stats").insert({
      member_id: memberId,
      line,
      kills,
      deaths,
      assists,
      is_win: Boolean(body.isWin),
      played_at: body.playedAt || new Date().toISOString()
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "개인 기록 저장 실패" }, { status: 500 });
  }
}
