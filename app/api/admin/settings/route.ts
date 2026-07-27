import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(request: Request){
  await requireStaff();
  const body = await request.json().catch(()=>null);
  const settings = {
    activity_days: Math.max(1,Math.min(90,Number(body?.activity_days)||7)),
    notice_notifications: body?.notice_notifications !== false,
    regular_match_notifications: body?.regular_match_notifications !== false,
    event_notifications: body?.event_notifications !== false,
    homepage_popup: body?.homepage_popup !== false
  };
  const { error } = await getSupabaseAdmin().from("site_settings").upsert({id:"main",settings,updated_at:new Date().toISOString()},{onConflict:"id"});
  if(error) return NextResponse.json({message:"설정 저장에 실패했습니다. 추가 SQL 실행 여부를 확인해주세요."},{status:500});
  return NextResponse.json({ok:true,settings});
}
