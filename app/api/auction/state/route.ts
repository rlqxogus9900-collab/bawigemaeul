import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const db = getSupabaseAdmin();
  const user = await getSession().catch(() => null);
  const url = new URL(request.url);
  const noHistory = url.searchParams.get("history") === "0";
  const { data: room } = await db.from("auction_rooms").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!room) return NextResponse.json({ room: null, teams: [], players: [], bids: [], submissions: [] });
  const currentBidQuery = room.current_player_id ? db.from("auction_bids").select("id,team_id,player_id,amount,bidder_nickname,created_at").eq("room_id",room.id).eq("player_id",room.current_player_id).order("created_at",{ascending:false}).limit(40) : Promise.resolve({ data: [] as any[] });
  const historyQuery = noHistory ? Promise.resolve({ data: [] as any[] }) : db.from("auction_bids").select("id,team_id,player_id,amount,bidder_nickname,created_at").eq("room_id", room.id).order("created_at", { ascending: false }).limit(30);
  const [{ data: teams }, { data: players }, { data: currentBids }, { data: bids }] = await Promise.all([
    db.from("auction_teams").select("*").eq("room_id", room.id).order("sort_order"),
    db.from("auction_players").select("*").eq("room_id", room.id).order("sort_order"),
    currentBidQuery, historyQuery
  ]);
  const latestByTeam = new Map<string, any>();
  for (const bid of currentBids || []) if (!latestByTeam.has(bid.team_id)) latestByTeam.set(bid.team_id,bid);
  const submissions = Array.from(latestByTeam.values()).map((bid) => ({ team_id: bid.team_id, submitted: true, amount: bid.amount, updated_at: bid.created_at }));
  const ownTeamIds = new Set((teams || []).filter((team) => team.captain_member_id === user?.id).map((team) => team.id));
  const isStaff = user?.role === "staff";
  const visibleBids = (bids || []).filter((bid) => bid.player_id !== room.current_player_id || isStaff || ownTeamIds.has(bid.team_id));
  return NextResponse.json({ room, teams: teams || [], players: players || [], bids: visibleBids, submissions }, { headers: { "Cache-Control": "no-store" } });
}
