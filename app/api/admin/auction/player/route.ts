import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const nickname = String(req.nextUrl.searchParams.get("nickname") || "").trim();
    if (!nickname) return NextResponse.json({ error: "닉네임을 입력하세요." }, { status: 400 });
    const db = getSupabaseAdmin();
    const { data: member } = await db
      .from("members")
      .select("id,nickname,main_line,sub_line,match_tier")
      .eq("nickname", nickname)
      .maybeSingle();
    if (!member) return NextResponse.json({ error: "클랜원 명단에서 닉네임을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "선수 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const roomId = String(body.roomId || "").trim();
    const nickname = String(body.nickname || "").trim();
    const note = String(body.note || "").trim();
    if (!roomId || !nickname) return NextResponse.json({ error: "경매방과 선수 닉네임을 입력하세요." }, { status: 400 });
    const db = getSupabaseAdmin();
    const { data: room } = await db.from("auction_rooms").select("id,status").eq("id", roomId).maybeSingle();
    if (!room) return NextResponse.json({ error: "현재 경매방이 없습니다." }, { status: 404 });
    const { data: duplicate } = await db.from("auction_players").select("id").eq("room_id", roomId).eq("nickname", nickname).maybeSingle();
    if (duplicate) return NextResponse.json({ error: "이미 등록된 선수입니다." }, { status: 409 });
    const { data: member } = await db
      .from("members")
      .select("id,nickname,main_line,sub_line,match_tier")
      .eq("nickname", nickname)
      .maybeSingle();
    if (!member) return NextResponse.json({ error: "클랜원 명단에서 닉네임을 찾을 수 없습니다." }, { status: 404 });
    const { data: last } = await db.from("auction_players").select("sort_order").eq("room_id", roomId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await db.from("auction_players").insert({
      room_id: roomId,
      member_id: member.id,
      nickname: member.nickname,
      main_line: member.main_line || "미정",
      sub_line: member.sub_line || "미정",
      match_tier: member.match_tier || null,
      note: note || null,
      sort_order: Number(last?.sort_order ?? -1) + 1
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "선수 추가 실패" }, { status: 500 });
  }
}
