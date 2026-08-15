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
  // 1.3.9.19: 현재 선수의 팀별 제출 금액을 모든 로그인 사용자에게 공개합니다.
  // 팀장/방송 화면이 같은 submissions 데이터를 사용하므로 제출 즉시 서로의 금액을 확인할 수 있습니다.
  const submissions = currentBids.map((bid) => ({
    team_id: bid.team_id,
    submitted: true,
    amount: bid.amount,
    updated_at: bid.created_at
  }));

  // 상세 입찰 로그는 기존 권한 범위를 유지하고, 현재 팀별 제출 금액은 submissions로 공개합니다.
  const visibleBids = (bids || []).filter((bid) => bid.player_id !== room.current_player_id || isStaff || ownTeamIds.has(bid.team_id));

  return NextResponse.json(
    { room, teams: teams || [], players: players || [], bids: visibleBids, submissions },
    { headers: { "Cache-Control": "private, max-age=1, stale-while-revalidate=2" } }
  );
}
