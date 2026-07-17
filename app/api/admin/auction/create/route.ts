import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const user = await requireStaff();
    const body = await req.json().catch(() => ({}));
    const startingBudget = Math.max(0, Number(body.startingBudget || 1000));
    const bidStep = Math.max(1, Number(body.bidStep || 10));
    const db = getSupabaseAdmin();

    const { data: poll } = await db.from("board_polls")
      .select("id,match_at,board_posts(title)")
      .eq("poll_type", "regular_match").eq("is_auction_source", true).maybeSingle();
    if (!poll) return NextResponse.json({ error: "경매 연동 투표가 없습니다." }, { status: 400 });

    const { data: option } = await db.from("board_poll_options")
      .select("id").eq("poll_id", poll.id).eq("label", "참가").maybeSingle();
    const { data: votes } = option ? await db.from("board_poll_votes")
      .select("member_id,member_nickname").eq("poll_id", poll.id).eq("option_id", option.id) : { data: [] };
    const { data: captains } = await db.from("board_poll_captains")
      .select("member_id,member_nickname").eq("poll_id", poll.id);

    if (!captains?.length) return NextResponse.json({ error: "팀장을 먼저 지정하세요." }, { status: 400 });

    await db.from("auction_rooms").update({ status: "finished" }).in("status", ["ready","live"]);

    const linkedPost = Array.isArray(poll.board_posts) ? poll.board_posts[0] : poll.board_posts;
    const { data: room, error } = await db.from("auction_rooms").insert({
      poll_id: poll.id,
      title: linkedPost?.title || "정기내전 실시간 경매",
      starting_budget: startingBudget,
      bid_step: bidStep,
      created_by: user.id
    }).select("*").single();
    if (error || !room) throw error || new Error("경매방 생성 실패");

    const teams = captains.map((c, i) => ({
      room_id: room.id, name: `${String.fromCharCode(65+i)}팀`,
      captain_member_id: c.member_id, captain_nickname: c.member_nickname,
      budget: startingBudget, sort_order: i
    }));
    const captainIds = new Set(captains.map(c => c.member_id));
    const players = (votes || []).filter(v => !captainIds.has(v.member_id)).map((v, i) => ({
      room_id: room.id, member_id: v.member_id, nickname: v.member_nickname, sort_order: i
    }));

    if (teams.length) await db.from("auction_teams").insert(teams);
    if (players.length) await db.from("auction_players").insert(players);
    return NextResponse.json({ ok: true, roomId: room.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "경매방 생성 실패" }, { status: 500 });
  }
}
