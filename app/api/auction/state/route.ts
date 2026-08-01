import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const db = getSupabaseAdmin();
  const user = await getSession().catch(() => null);
  const { data: room } = await db.from("auction_rooms").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!room) return NextResponse.json({ room: null, teams: [], players: [], bids: [], submissions: [] });

  const [{ data: teams }, { data: players }, { data: bids }] = await Promise.all([
    db.from("auction_teams").select("*").eq("room_id", room.id).order("sort_order"),
    db.from("auction_players").select("*").eq("room_id", room.id).order("sort_order"),
    db.from("auction_bids").select("*").eq("room_id", room.id).order("created_at", { ascending: false }).limit(60)
  ]);

  const currentBids = (bids || []).filter((bid) => bid.player_id === room.current_player_id);
  const ownTeamIds = new Set((teams || []).filter((team) => team.captain_member_id === user?.id).map((team) => team.id));
  const isStaff = user?.role === "staff";
  const submissions = currentBids.map((bid) => ({
    team_id: bid.team_id,
    submitted: true,
    amount: isStaff || ownTeamIds.has(bid.team_id) ? bid.amount : null,
    updated_at: bid.created_at
  }));

  // 과거 낙찰 기록은 금액을 보여줘도 되지만, 현재 선수의 봉인 입찰 금액은 일반 화면에 노출하지 않습니다.
  const visibleBids = (bids || []).filter((bid) => bid.player_id !== room.current_player_id || isStaff || ownTeamIds.has(bid.team_id));

  return NextResponse.json(
    { room, teams: teams || [], players: players || [], bids: visibleBids, submissions },
    { headers: { "Cache-Control": "private, max-age=1, stale-while-revalidate=2" } }
  );
}
