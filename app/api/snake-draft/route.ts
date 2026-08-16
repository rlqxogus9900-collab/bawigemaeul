import { NextResponse } from "next/server";
import { getSession, requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function expectedTeam(pick: number, teamCount: number) {
  const cycle = Math.floor(pick / teamCount);
  const pos = pick % teamCount;
  return cycle % 2 === 0 ? pos + 1 : teamCount - pos;
}

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const db = getSupabaseAdmin();
  const [{ data: settings }, { data: teams }, { data: draftPlayers }, { data: members }] = await Promise.all([
    db.from("snake_draft_settings").select("id,team_count,current_pick").eq("id",1).maybeSingle(),
    db.from("snake_draft_teams").select("team_no,name").order("team_no"),
    db.from("snake_draft_players").select("member_id,team_no,pick_order,added_at").order("added_at"),
    db.from("members").select("id,nickname,riot_id,main_line,sub_line,match_tier").eq("is_active",true).order("nickname")
  ]);
  const map = new Map((members || []).map(m => [m.id,m]));
  const players = (draftPlayers || []).map(p => ({...p, ...(map.get(p.member_id) || {})})).filter(p => p.nickname);
  const teamCount = Number(settings?.team_count || 2);
  const currentPick = Number(settings?.current_pick || 0);
  return NextResponse.json({
    userRole: user.role,
    settings: { team_count: teamCount, current_pick: currentPick, expected_team: expectedTeam(currentPick, teamCount) },
    teams: (teams || []).filter(t => t.team_no <= teamCount),
    players,
    members: members || []
  });
}

export async function POST(request: Request) {
  await requireStaff();
  const db = getSupabaseAdmin();
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "configure") {
    const teamCount = Math.max(2, Math.min(4, Number(body.teamCount || 2)));
    await db.from("snake_draft_settings").upsert({id:1,team_count:teamCount,current_pick:0,updated_at:new Date().toISOString()});
    await db.from("snake_draft_players").update({team_no:null,pick_order:null}).not("member_id","is",null);
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
    const {error}=await db.from("snake_draft_players").upsert(ids.map((member_id: string)=>({member_id,team_no:null,pick_order:null})),{onConflict:"member_id"});
    if(error) return NextResponse.json({message:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  if (action === "removeMember") {
    const {error}=await db.from("snake_draft_players").delete().eq("member_id",String(body.memberId||""));
    if(error) return NextResponse.json({message:error.message},{status:500});
    return NextResponse.json({ok:true});
  }
  if (action === "reset") {
    await db.from("snake_draft_players").update({team_no:null,pick_order:null}).not("member_id","is",null);
    await db.from("snake_draft_settings").update({current_pick:0,updated_at:new Date().toISOString()}).eq("id",1);
    return NextResponse.json({ok:true});
  }
  if (action === "assign") {
    const memberId=String(body.memberId||"");
    const rawTeam=body.teamNo;
    const targetTeam = rawTeam === null || rawTeam === "waiting" ? null : Number(rawTeam);
    const {data:settings}=await db.from("snake_draft_settings").select("team_count,current_pick").eq("id",1).single();
    const {data:existing}=await db.from("snake_draft_players").select("team_no,pick_order").eq("member_id",memberId).maybeSingle();
    if(!existing) return NextResponse.json({message:"스네이크 픽 명단에 없는 선수입니다."},{status:404});
    const isNewPick = existing.team_no == null && targetTeam != null;
    if (isNewPick) {
      const expected = expectedTeam(Number(settings?.current_pick||0), Number(settings?.team_count||2));
      if (targetTeam !== expected) return NextResponse.json({message:`현재 ${expected}팀 픽 차례입니다.`},{status:400});
      const pickOrder = Number(settings?.current_pick||0)+1;
      const {error}=await db.from("snake_draft_players").update({team_no:targetTeam,pick_order:pickOrder}).eq("member_id",memberId);
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
