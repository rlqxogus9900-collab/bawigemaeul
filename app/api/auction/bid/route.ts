import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getTierMinimumBid } from "@/lib/auction-min-bid";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = await req.json();
    const amount = Number(body.amount);
    if (!Number.isInteger(amount)) return NextResponse.json({ error: "입찰 금액은 정수로 입력하세요." }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: room } = await db.from("auction_rooms").select("*").eq("id", body.roomId).single();
    if (!room || room.status !== "live" || !room.current_player_id) {
      return NextResponse.json({ error: "현재 입찰 가능한 선수가 없습니다." }, { status: 400 });
    }

    const { data: team } = await db.from("auction_teams").select("*").eq("id", body.teamId).eq("room_id", room.id).single();
    if (!team) return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });
    if (user.role !== "staff" && team.captain_member_id !== user.id) {
      return NextResponse.json({ error: "본인이 팀장인 팀으로만 제출할 수 있습니다." }, { status: 403 });
    }

    const { data: player } = await db.from("auction_players").select("match_tier").eq("id", room.current_player_id).single();
    const minimumBid = getTierMinimumBid(room, player);
    if (amount < minimumBid) return NextResponse.json({ error: `최소 입찰은 ${minimumBid.toLocaleString()}점입니다.` }, { status: 400 });
    if (amount > team.budget) return NextResponse.json({ error: "남은 예산보다 많이 제출할 수 없습니다." }, { status: 400 });

    // 같은 선수에 대한 같은 팀의 기존 제출값은 마지막 제출 금액으로 교체합니다.
    const { error: deleteError } = await db.from("auction_bids")
      .delete()
      .eq("room_id", room.id)
      .eq("player_id", room.current_player_id)
      .eq("team_id", team.id);
    if (deleteError) throw deleteError;

    const { error: bidError } = await db.from("auction_bids").insert({
      room_id: room.id,
      player_id: room.current_player_id,
      team_id: team.id,
      amount,
      bidder_member_id: user.id,
      bidder_nickname: user.nickname
    });
    if (bidError) throw bidError;

    // 입찰 또는 수정 제출이 들어올 때마다 서버 기준 경매 시간을 다시 시작합니다.
    const resetAt = new Date().toISOString();
    const { error: roomUpdateError } = await db.from("auction_rooms")
      .update({ updated_at: resetAt })
      .eq("id", room.id);
    if (roomUpdateError) throw roomUpdateError;

    // 봉인 입찰이므로 최고가/팀은 마감 전까지 공개하지 않습니다.
    return NextResponse.json({ ok: true, amount, resetAt });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "입찰 제출 실패" }, { status: 500 });
  }
}
