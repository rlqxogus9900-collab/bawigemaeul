import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const db = getSupabaseAdmin();

    const { data: room } = await db
      .from("auction_rooms")
      .select("*")
      .eq("id", body.roomId)
      .single();

    if (!room || room.status !== "live" || !room.current_player_id) {
      return NextResponse.json({ error: "현재 입찰 가능한 선수가 없습니다." }, { status: 400 });
    }

    const { data: team } = await db
      .from("auction_teams")
      .select("*")
      .eq("id", body.teamId)
      .eq("room_id", room.id)
      .single();

    if (!team) {
      return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });
    }

    const canBid = user.role === "staff" || team.captain_member_id === user.id;
    if (!canBid) {
      return NextResponse.json({ error: "본인이 팀장인 팀으로만 입찰할 수 있습니다." }, { status: 403 });
    }

    const amount = room.current_bid > 0
      ? room.current_bid + room.bid_step
      : room.bid_step;

    if (amount > team.budget) {
      return NextResponse.json({ error: "남은 예산이 부족합니다." }, { status: 400 });
    }

    const { error: bidError } = await db.from("auction_bids").insert({
      room_id: room.id,
      player_id: room.current_player_id,
      team_id: team.id,
      amount,
      bidder_member_id: user.id,
      bidder_nickname: user.nickname
    });

    if (bidError) throw bidError;

    const { error: roomError } = await db
      .from("auction_rooms")
      .update({
        current_bid: amount,
        current_team_id: team.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", room.id);

    if (roomError) throw roomError;

    return NextResponse.json({ ok: true, amount });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "입찰 처리 실패" },
      { status: 500 }
    );
  }
}
