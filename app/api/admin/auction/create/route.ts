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
    const mode = body.mode === "manual" ? "manual" : "poll";
    const db = getSupabaseAdmin();

    let pollId: string | null = null;
    let title = String(body.title || "").trim() || "수동 실시간 경매";
    let captainRows: Array<{ member_id: string | null; member_nickname: string }> = [];
    let playerRows: Array<{ member_id: string | null; member_nickname: string }> = [];

    if (mode === "manual") {
      const captainNames: string[] = Array.from(new Set<string>((Array.isArray(body.captains) ? body.captains : []).map((v: unknown) => String(v).trim()).filter((v: string) => Boolean(v))));
      const playerNames: string[] = Array.from(new Set<string>((Array.isArray(body.players) ? body.players : []).map((v: unknown) => String(v).trim()).filter((v: string) => Boolean(v))));
      if (captainNames.length < 2) return NextResponse.json({ error: "수동 경매는 팀장을 2명 이상 입력하세요." }, { status: 400 });
      const allNames = Array.from(new Set([...captainNames, ...playerNames]));
      const { data: members } = allNames.length ? await db.from("members").select("id,nickname,match_tier,average_tier,current_tier").in("nickname", allNames) : { data: [] };
      const memberByName = new Map((members || []).map(m => [m.nickname, m]));
      captainRows = captainNames.map(name => ({ member_id: memberByName.get(name)?.id || null, member_nickname: name }));
      const captainSet = new Set(captainNames);
      playerRows = playerNames.filter(name => !captainSet.has(name)).map(name => ({ member_id: memberByName.get(name)?.id || null, member_nickname: name }));
    } else {
      const { data: poll } = await db.from("board_polls").select("id,match_at,board_posts(title)").eq("poll_type", "regular_match").eq("is_auction_source", true).maybeSingle();
      if (!poll) return NextResponse.json({ error: "경매 연동 투표가 없습니다. 투표 없이 만들려면 수동 생성을 선택하세요." }, { status: 400 });
      pollId = poll.id;
      const linkedPost = Array.isArray(poll.board_posts) ? poll.board_posts[0] : poll.board_posts;
      title = linkedPost?.title || "정기내전 실시간 경매";
      const { data: option } = await db.from("board_poll_options").select("id").eq("poll_id", poll.id).eq("label", "참가").maybeSingle();
      const { data: votes } = option ? await db.from("board_poll_votes").select("member_id,member_nickname").eq("poll_id", poll.id).eq("option_id", option.id) : { data: [] };
      const { data: captains } = await db.from("board_poll_captains").select("member_id,member_nickname").eq("poll_id", poll.id);
      if (!captains?.length) return NextResponse.json({ error: "팀장을 먼저 지정하세요." }, { status: 400 });
      captainRows = captains;
      const captainIds = new Set(captains.map(c => c.member_id));
      playerRows = (votes || []).filter(v => !captainIds.has(v.member_id));
    }

    const captainIds = captainRows.map(c => c.member_id).filter(Boolean) as string[];
    const { data: captainMembers } = captainIds.length ? await db.from("members").select("id,nickname,match_tier,average_tier,current_tier").in("id", captainIds) : { data: [] };
    const memberMap = new Map((captainMembers || []).map(m => [m.id, m]));
    const validTiers = (captainMembers || []).map(m => Number(m.match_tier)).filter(t => Number.isInteger(t) && t >= 1 && t <= 5);
    const strongestTier = validTiers.length ? Math.min(...validTiers) : 1;

    await db.from("auction_rooms").update({ status: "finished" }).in("status", ["ready", "live"]);
    const { data: room, error } = await db.from("auction_rooms").insert({ poll_id: pollId, title, starting_budget: startingBudget, bid_step: bidStep, tier_balance_enabled: tierBalanceEnabled, tier_bonus_per_tier: tierBonusPerTier, created_by: user.id }).select("*").single();
    if (error || !room) throw error || new Error("경매방 생성 실패");

    const teams = captainRows.map((captain, index) => {
      const member = captain.member_id ? memberMap.get(captain.member_id) : undefined;
      const matchTier = Number(member?.match_tier) || null;
      const tierBonus = tierBalanceEnabled && matchTier ? Math.max(0, matchTier - strongestTier) * tierBonusPerTier : 0;
      const finalBudget = startingBudget + tierBonus;
      return { room_id: room.id, name: `${String.fromCharCode(65 + index)}팀`, captain_member_id: captain.member_id, captain_nickname: captain.member_nickname, captain_match_tier: matchTier, captain_average_tier: member?.average_tier || member?.current_tier || null, base_budget: startingBudget, tier_bonus: tierBonus, starting_budget: finalBudget, budget: finalBudget, sort_order: index };
    });
    const players = playerRows.map((p, index) => ({ room_id: room.id, member_id: p.member_id, nickname: p.member_nickname, sort_order: index }));
    const { error: teamError } = await db.from("auction_teams").insert(teams); if (teamError) throw teamError;
    if (players.length) { const { error: playerError } = await db.from("auction_players").insert(players); if (playerError) throw playerError; }
    return NextResponse.json({ ok: true, roomId: room.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "경매방 생성 실패" }, { status: 500 });
  }
}
