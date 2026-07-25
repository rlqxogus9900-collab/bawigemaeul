import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getTierMinimumBid } from "@/lib/auction-min-bid";

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
      const { data: player } = await db.from("auction_players").select("match_tier").eq("id", room.current_player_id).single();
      const minimumBid = getTierMinimumBid(room, player);
      const amount = room.current_bid > 0 ? room.current_bid + room.bid_step : minimumBid;
      if (amount > team.budget) return NextResponse.json({ error: "팀 예산이 부족합니다." }, { status: 400 });
      await db.from("auction_bids").insert({ room_id: room.id, player_id: room.current_player_id, team_id: team.id, amount, bidder_member_id: user.id, bidder_nickname: user.nickname });
      await db.from("auction_rooms").update({ current_bid: amount, current_team_id: team.id, updated_at: new Date().toISOString() }).eq("id", room.id);
    } else if (body.action === "sell" || body.action === "unsold") {
      if (!room.current_player_id) return NextResponse.json({ error: "선택된 선수가 없습니다." }, { status: 400 });

      const { data: submittedBids, error: bidError } = await db.from("auction_bids")
        .select("team_id,amount,created_at")
        .eq("room_id", room.id)
        .eq("player_id", room.current_player_id)
        .order("created_at", { ascending: false });
      if (bidError) throw bidError;

      const latestByTeam = new Map<string, { team_id: string; amount: number }>();
      for (const bid of submittedBids || []) {
        if (!latestByTeam.has(bid.team_id)) latestByTeam.set(bid.team_id, { team_id: bid.team_id, amount: Number(bid.amount) });
      }
      const validBids = [...latestByTeam.values()].sort((a, b) => b.amount - a.amount);

      if (!validBids.length) {
        await db.from("auction_players").update({ status: "unsold" }).eq("id", room.current_player_id);
        await db.from("auction_rooms").update({ current_player_id: null, current_bid: 0, current_team_id: null, updated_at: new Date().toISOString() }).eq("id", room.id);
      } else {
        const highest = validBids[0].amount;
        const tied = validBids.filter((bid) => bid.amount === highest);
        const chosenTeamId = body.teamId ? String(body.teamId) : null;
        let winner = tied.length === 1 ? tied[0] : tied.find((bid) => bid.team_id === chosenTeamId) || null;

        if (!winner) {
          const { data: tiedTeams } = await db.from("auction_teams").select("id,name").in("id", tied.map((bid) => bid.team_id));
          return NextResponse.json({
            error: `최고가 ${highest.toLocaleString()}점 동점입니다. 관리자가 동점 팀 중 낙찰 팀을 선택하세요.`,
            tie: true,
            amount: highest,
            teamIds: tied.map((bid) => bid.team_id),
            teamNames: (tiedTeams || []).map((team) => team.name)
          }, { status: 409 });
        }

        const { data: team } = await db.from("auction_teams").select("*").eq("id", winner.team_id).single();
        if (!team || team.budget < winner.amount) return NextResponse.json({ error: "낙찰 팀 예산이 부족합니다." }, { status: 400 });
        await db.from("auction_teams").update({ budget: team.budget - winner.amount }).eq("id", team.id);
        await db.from("auction_players").update({ status: "sold", sold_team_id: team.id, sold_price: winner.amount }).eq("id", room.current_player_id);
        await db.from("auction_rooms").update({ current_player_id: null, current_bid: 0, current_team_id: null, updated_at: new Date().toISOString() }).eq("id", room.id);
      }
    } else if (body.action === "finish") {
      await db.from("auction_rooms").update({ status: "finished", current_player_id: null, current_team_id: null, current_bid: 0, updated_at: new Date().toISOString() }).eq("id", room.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "경매 처리 실패" }, { status: 500 });
  }
}
