import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    const db = getSupabaseAdmin();
    const { data: room } = await db.from("auction_rooms").select("*").eq("id", body.roomId).single();
    if (!room) return NextResponse.json({ error: "경매방이 없습니다." }, { status: 404 });

    if (body.action === "start") {
      await db.from("auction_rooms").update({ status: "live", updated_at: new Date().toISOString() }).eq("id", room.id);
    } else if (body.action === "nominate") {
      await db.from("auction_players").update({ status: "waiting" }).eq("room_id", room.id).eq("status", "nominated");
      await db.from("auction_players").update({ status: "nominated" }).eq("id", body.playerId).eq("room_id", room.id);
      await db.from("auction_rooms").update({ current_player_id: body.playerId, current_bid: 0, current_team_id: null, status: "live", updated_at: new Date().toISOString() }).eq("id", room.id);
    } else if (body.action === "bid") {
      const { data: team } = await db.from("auction_teams").select("*").eq("id", body.teamId).eq("room_id", room.id).single();
      if (!team || !room.current_player_id) return NextResponse.json({ error: "선수 또는 팀이 선택되지 않았습니다." }, { status: 400 });
      const amount = room.current_bid > 0 ? room.current_bid + room.bid_step : room.bid_step;
      if (amount > team.budget) return NextResponse.json({ error: "팀 예산이 부족합니다." }, { status: 400 });
      await db.from("auction_bids").insert({ room_id: room.id, player_id: room.current_player_id, team_id: team.id, amount, bidder_member_id: user.id, bidder_nickname: user.nickname });
      await db.from("auction_rooms").update({ current_bid: amount, current_team_id: team.id, updated_at: new Date().toISOString() }).eq("id", room.id);
    } else if (body.action === "sell") {
      if (!room.current_player_id || !room.current_team_id || room.current_bid <= 0) return NextResponse.json({ error: "유효한 입찰이 없습니다." }, { status: 400 });
      const { data: team } = await db.from("auction_teams").select("*").eq("id", room.current_team_id).single();
      if (!team || team.budget < room.current_bid) return NextResponse.json({ error: "예산이 부족합니다." }, { status: 400 });
      await db.from("auction_teams").update({ budget: team.budget - room.current_bid }).eq("id", team.id);
      await db.from("auction_players").update({ status: "sold", sold_team_id: team.id, sold_price: room.current_bid }).eq("id", room.current_player_id);
      await db.from("auction_rooms").update({ current_player_id: null, current_bid: 0, current_team_id: null, updated_at: new Date().toISOString() }).eq("id", room.id);
    } else if (body.action === "unsold") {
      if (!room.current_player_id) return NextResponse.json({ error: "선택된 선수가 없습니다." }, { status: 400 });
      await db.from("auction_players").update({ status: "unsold" }).eq("id", room.current_player_id);
      await db.from("auction_rooms").update({ current_player_id: null, current_bid: 0, current_team_id: null, updated_at: new Date().toISOString() }).eq("id", room.id);
    } else if (body.action === "finish") {
      await db.from("auction_rooms").update({ status: "finished", current_player_id: null, current_team_id: null, current_bid: 0, updated_at: new Date().toISOString() }).eq("id", room.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "경매 처리 실패" }, { status: 500 });
  }
}
