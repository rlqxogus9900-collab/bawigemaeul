import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const user = await requireStaff();
    const body = await req.json().catch(() => ({}));
    const startingBudget = Math.max(0, Number(body.startingBudget || 1000));
    const bidStep = Math.max(1, Number(body.bidStep || 10));
    const tierBalanceEnabled = body.tierBalanceEnabled !== false;
    const tierBonusPerTier = Math.max(0, Number(body.tierBonusPerTier || 100));
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

    const captainIds = captains.map((captain) => captain.member_id);
    const { data: captainMembers } = await db.from("members")
      .select("id,nickname,match_tier,average_tier,current_tier")
      .in("id", captainIds);

    const memberMap = new Map((captainMembers || []).map((member) => [member.id, member]));
    const validTiers = (captainMembers || []).map((member) => Number(member.match_tier))
      .filter((tier) => Number.isInteger(tier) && tier >= 1 && tier <= 5);
    const strongestTier = validTiers.length ? Math.min(...validTiers) : 1;

    await db.from("auction_rooms").update({ status: "finished" }).in("status", ["ready", "live"]);

    const linkedPost = Array.isArray(poll.board_posts) ? poll.board_posts[0] : poll.board_posts;
    const { data: room, error } = await db.from("auction_rooms").insert({
      poll_id: poll.id,
      title: linkedPost?.title || "정기내전 실시간 경매",
      starting_budget: startingBudget,
      bid_step: bidStep,
      tier_balance_enabled: tierBalanceEnabled,
      tier_bonus_per_tier: tierBonusPerTier,
      created_by: user.id
    }).select("*").single();
    if (error || !room) throw error || new Error("경매방 생성 실패");

    const teams = captains.map((captain, index) => {
      const member = memberMap.get(captain.member_id);
      const matchTier = Number(member?.match_tier) || null;
      const tierBonus = tierBalanceEnabled && matchTier
        ? Math.max(0, matchTier - strongestTier) * tierBonusPerTier
        : 0;
      const finalBudget = startingBudget + tierBonus;
      return {
        room_id: room.id,
        name: `${String.fromCharCode(65 + index)}팀`,
        captain_member_id: captain.member_id,
        captain_nickname: captain.member_nickname,
        captain_match_tier: matchTier,
        captain_average_tier: member?.average_tier || member?.current_tier || null,
        base_budget: startingBudget,
        tier_bonus: tierBonus,
        starting_budget: finalBudget,
        budget: finalBudget,
        sort_order: index
      };
    });

    const captainIdSet = new Set(captainIds);
    const players = (votes || []).filter((vote) => !captainIdSet.has(vote.member_id)).map((vote, index) => ({
      room_id: room.id, member_id: vote.member_id, nickname: vote.member_nickname, sort_order: index
    }));

    const { error: teamError } = await db.from("auction_teams").insert(teams);
    if (teamError) throw teamError;
    if (players.length) {
      const { error: playerError } = await db.from("auction_players").insert(players);
      if (playerError) throw playerError;
    }
    return NextResponse.json({ ok: true, roomId: room.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "경매방 생성 실패" }, { status: 500 });
  }
}
