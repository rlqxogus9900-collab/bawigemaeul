import { NextResponse } from "next/server";
import { getSession, requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function expectedTeam(pick: number, teamCount: number) {
  const cycle = Math.floor(pick / teamCount);
  const pos = pick % teamCount;
  return cycle % 2 === 0 ? pos + 1 : teamCount - pos;
}

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const db = getSupabaseAdmin();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  if (q) {
    const escaped = q.replace(/[%_,]/g, "");
    const { data, error } = await db.from("members")
      .select("id,nickname,riot_id,main_line,sub_line,match_tier")
      .eq("is_active", true)
      .or(`nickname.ilike.%${escaped}%,riot_id.ilike.%${escaped}%`)
      .order("nickname").limit(8);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ members: data || [] }, { headers: { "Cache-Control": "private, max-age=2" } });
  }

  const [{ data: settings }, { data: teams }, { data: draftPlayers }] = await Promise.all([
    db.from("snake_draft_settings").select("id,team_count,current_pick").eq("id",1).maybeSingle(),
    db.from("snake_draft_teams").select("team_no,name").order("team_no"),
    db.from("snake_draft_players").select("member_id,team_no,pick_order,is_captain,added_at").order("added_at")
  ]);
  const ids = (draftPlayers || []).map(p => p.member_id).filter(Boolean);
  let members: Array<{id:string;nickname:string;riot_id:string|null;main_line:string|null;sub_line:string|null;match_tier:number|null}> = [];
  if (ids.length) {
    const { data } = await db.from("members").select("id,nickname,riot_id,main_line,sub_line,match_tier").in("id", ids);
    members = data || [];
  }
  const map = new Map(members.map(m => [m.id,m]));
  const players = (draftPlayers || []).map(p => ({...p, ...(map.get(p.member_id) || {})})).filter(p => p.nickname);
  const teamCount = Number(settings?.team_count || 2);
  const currentPick = Number(settings?.current_pick || 0);
  const activeTeams = (teams || []).filter(t => t.team_no <= teamCount);
  const captainTeams = new Set(players.filter(p => p.is_captain && p.team_no != null).map(p => Number(p.team_no)));
  const captainsReady = activeTeams.every(t => captainTeams.has(t.team_no));
  const captainExpectedTeam = activeTeams.find(t => !captainTeams.has(t.team_no))?.team_no || null;

  return NextResponse.json({
    userRole: user.role,
    settings: { team_count: teamCount, current_pick: currentPick, expected_team: captainsReady ? expectedTeam(currentPick, teamCount) : captainExpectedTeam, captains_ready: captainsReady, captain_expected_team: captainExpectedTeam },
    teams: activeTeams, players
  }, { headers: { "Cache-Control": "private, max-age=1, stale-while-revalidate=2" } });
}

export async function POST(request: Request) {
  await requireStaff();
  const db = getSupabaseAdmin();
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "configure") {
    const teamCount = Math.max(2, Math.min(4, Number(body.teamCount || 2)));
    await db.from("snake_draft_settings").upsert({id:1,team_count:teamCount,current_pick:0,updated_at:new Date().toISOString()});
    await db.from("snake_draft_players").update({team_no:null,pick_order:null,is_captain:false}).not("member_id","is",null);
    return NextResponse.json({ok:true});
  }
  if (action === "renameTeam") {
    const teamNo = Number(body.teamNo); const name = String(body.name || "").trim();
    if (!teamNo || !name) return NextResponse.json({message:"팀명을 확인하세요."},{status:400});
    const {error}=await db.from("snake_draft_teams").update({name,updated_at:new Date().toISOString()}).eq("team_no",teamNo);
    if(error) return NextResponse.json({message:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  if (action === "addMembers") {
    const ids = Array.isArray(body.memberIds) ? body.memberIds.map(String).filter(Boolean) : [];
    if (!ids.length) return NextResponse.json({message:"추가할 클랜원을 선택하세요."},{status:400});
    const {error}=await db.from("snake_draft_players").upsert(ids.map((member_id: string)=>({member_id,team_no:null,pick_order:null,is_captain:false})),{onConflict:"member_id"});
    if(error) return NextResponse.json({message:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  if (action === "removeMember") {
    const {error}=await db.from("snake_draft_players").delete().eq("member_id",String(body.memberId||""));
    if(error) return NextResponse.json({message:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  if (action === "reset") {
    await db.from("snake_draft_players").update({team_no:null,pick_order:null,is_captain:false}).not("member_id","is",null);
    await db.from("snake_draft_settings").update({current_pick:0,updated_at:new Date().toISOString()}).eq("id",1);
    return NextResponse.json({ok:true});
  }
  if (action === "assign") {
    const memberId=String(body.memberId||"");
    const targetTeam = body.teamNo === null || body.teamNo === "waiting" ? null : Number(body.teamNo);
    const {data:settings}=await db.from("snake_draft_settings").select("team_count,current_pick").eq("id",1).single();
    const {data:existing}=await db.from("snake_draft_players").select("team_no,pick_order,is_captain").eq("member_id",memberId).maybeSingle();
    if(!existing) return NextResponse.json({message:"스네이크 픽 명단에 없는 선수입니다."},{status:404});
    const teamCount = Number(settings?.team_count||2);
    const currentPick = Number(settings?.current_pick||0);
    const {data:captainRows}=await db.from("snake_draft_players").select("team_no").eq("is_captain",true).not("team_no","is",null);
    const captainTeams = new Set((captainRows||[]).map(row=>Number(row.team_no)));
    const captainsReady = Array.from({length:teamCount},(_,i)=>i+1).every(no=>captainTeams.has(no));

    if (!captainsReady) {
      if (targetTeam == null) {
        const {error}=await db.from("snake_draft_players").update({team_no:null,pick_order:null,is_captain:false}).eq("member_id",memberId);
        if(error) return NextResponse.json({message:error.message},{status:500});
        return NextResponse.json({ok:true});
      }
      const expectedCaptainTeam = Array.from({length:teamCount},(_,i)=>i+1).find(no=>!captainTeams.has(no));
      if (targetTeam !== expectedCaptainTeam) return NextResponse.json({message:`먼저 ${expectedCaptainTeam}팀 팀장을 지정하세요.`},{status:400});
      if (existing.team_no != null || existing.is_captain) return NextResponse.json({message:"대기 선수만 팀장으로 지정할 수 있습니다."},{status:400});
      const {error}=await db.from("snake_draft_players").update({team_no:targetTeam,pick_order:0,is_captain:true}).eq("member_id",memberId);
      if(error) return NextResponse.json({message:error.message},{status:500});
      await db.from("snake_draft_settings").update({current_pick:0,updated_at:new Date().toISOString()}).eq("id",1);
      return NextResponse.json({ok:true,captain:true});
    }

    if (existing.is_captain) return NextResponse.json({message:"팀장은 드래프트 시작 후 이동할 수 없습니다. 초기화 후 다시 지정하세요."},{status:400});
    const isNewPick = existing.team_no == null && targetTeam != null;
    if (isNewPick) {
      const expected = expectedTeam(currentPick, teamCount);
      if (targetTeam !== expected) return NextResponse.json({message:`현재 ${expected}팀 픽 차례입니다.`},{status:400});
      const pickOrder = currentPick + 1;
      const {error}=await db.from("snake_draft_players").update({team_no:targetTeam,pick_order:pickOrder,is_captain:false}).eq("member_id",memberId);
      if(error) return NextResponse.json({message:error.message},{status:500});
      await db.from("snake_draft_settings").update({current_pick:pickOrder,updated_at:new Date().toISOString()}).eq("id",1);
    } else {
      const {error}=await db.from("snake_draft_players").update({team_no:targetTeam}).eq("member_id",memberId);
      if(error) return NextResponse.json({message:error.message},{status:500});
    }
    return NextResponse.json({ok:true});
  }
  return NextResponse.json({message:"지원하지 않는 요청입니다."},{status:400});
}
