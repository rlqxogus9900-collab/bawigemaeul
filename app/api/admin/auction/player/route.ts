import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type DbError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function dbErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const value = error as DbError;
    const parts = [value.message, value.details, value.hint, value.code ? `코드 ${value.code}` : ""].filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  return fallback;
}

function normalizeNickname(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const nickname = String(req.nextUrl.searchParams.get("nickname") || "").trim();
    const db = getSupabaseAdmin();

    if (!nickname) {
      let query = await db
        .from("members")
        .select("id,nickname,main_line,sub_line,match_tier,is_active")
        .eq("is_active", true)
        .order("nickname")
        .limit(500);

      // 예전 DB에 is_active 컬럼이 없더라도 명단 자체는 불러오도록 처리합니다.
      if (query.error) {
        const fallback = await db
          .from("members")
          .select("id,nickname,main_line,sub_line,match_tier")
          .order("nickname")
          .limit(500);
        if (fallback.error) throw fallback.error;
        return NextResponse.json({ members: fallback.data || [] });
      }

      return NextResponse.json({ members: query.data || [] });
    }

    const { data: members, error } = await db
      .from("members")
      .select("id,nickname,main_line,sub_line,match_tier")
      .ilike("nickname", nickname)
      .limit(10);
    if (error) throw error;

    const normalized = normalizeNickname(nickname);
    const member = (members || []).find(member => normalizeNickname(member.nickname) === normalized) || null;
    if (!member) {
      return NextResponse.json({ error: "클랜원 명단에서 정확히 일치하는 닉네임을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error, "선수 조회 실패") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const roomId = String(body.roomId || "").trim();
    const nickname = String(body.nickname || "").trim();
    const note = String(body.note || "").trim();
    if (!roomId || !nickname) {
      return NextResponse.json({ error: "경매방과 선수 닉네임을 입력하세요." }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data: room, error: roomError } = await db
      .from("auction_rooms")
      .select("id,status")
      .eq("id", roomId)
      .maybeSingle();
    if (roomError) throw roomError;
    if (!room) return NextResponse.json({ error: "현재 경매방이 없습니다." }, { status: 404 });
    if (room.status === "finished") {
      return NextResponse.json({ error: "종료된 경매에는 선수를 추가할 수 없습니다." }, { status: 409 });
    }

    const { data: members, error: memberError } = await db
      .from("members")
      .select("id,nickname,main_line,sub_line,match_tier")
      .ilike("nickname", nickname)
      .limit(10);
    if (memberError) throw memberError;

    const normalized = normalizeNickname(nickname);
    const member = (members || []).find(item => normalizeNickname(item.nickname) === normalized) || null;
    if (!member) {
      return NextResponse.json({ error: "클랜원 명단에서 정확히 일치하는 닉네임을 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: captain, error: captainError } = await db
      .from("auction_teams")
      .select("id")
      .eq("room_id", roomId)
      .eq("captain_member_id", member.id)
      .maybeSingle();
    if (captainError) throw captainError;
    if (captain) return NextResponse.json({ error: "해당 클랜원은 현재 경매의 팀장이라 선수로 추가할 수 없습니다." }, { status: 409 });

    const { data: duplicate, error: duplicateError } = await db
      .from("auction_players")
      .select("id")
      .eq("room_id", roomId)
      .eq("member_id", member.id)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) return NextResponse.json({ error: "이미 등록된 선수입니다." }, { status: 409 });

    const { data: last, error: orderError } = await db
      .from("auction_players")
      .select("sort_order")
      .eq("room_id", roomId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) throw orderError;

    const { error: insertError } = await db.from("auction_players").insert({
      room_id: roomId,
      member_id: member.id,
      nickname: member.nickname,
      main_line: member.main_line || "미정",
      sub_line: member.sub_line || "미정",
      match_tier: member.match_tier || null,
      note: note || null,
      sort_order: Number(last?.sort_order ?? -1) + 1
    });

    if (insertError) {
      const message = dbErrorMessage(insertError, "선수 저장 실패");
      const missingProfileColumn = /main_line|sub_line|match_tier|note|schema cache/i.test(message);
      return NextResponse.json({
        error: missingProfileColumn
          ? `경매 선수 정보용 DB 컬럼이 없습니다. 1.3.8.36 추가 SQL을 먼저 실행하세요. (${message})`
          : message
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, member });
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error, "선수 추가 실패") }, { status: 500 });
  }
}
