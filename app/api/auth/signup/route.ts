import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";

export async function POST(request:Request){
  const form=await request.formData();
  const nickname=String(form.get("nickname")||"").trim();
  const password=String(form.get("password")||"");
  const confirm=String(form.get("password_confirm")||"");
  const riotId=String(form.get("riot_id")||"").trim();
  if(nickname.length<2||password.length<4||password!==confirm||!riotId.includes("#")) return NextResponse.redirect(new URL("/signup?error=invalid",request.url),303);
  const db=getSupabaseAdmin();
  const {data:dup}=await db.from("members").select("id").or(`nickname.eq.${nickname},riot_id.eq.${riotId}`).limit(1);
  if(dup?.length) return NextResponse.redirect(new URL("/signup?error=duplicate",request.url),303);
  const {error}=await db.from("members").insert({
    nickname,riot_id:riotId,password_hash:await hashPassword(password),role:"member",must_change_password:false,is_active:false,
    approval_status:"pending",current_tier:String(form.get("current_tier")||"미정"),match_tier:String(form.get("match_tier")||"미정"),
    main_line:String(form.get("main_line")||"미정"),sub_line:String(form.get("sub_line")||"미정"),notes:String(form.get("notes")||"").trim()
  });
  return NextResponse.redirect(new URL(error?"/signup?error=1":"/signup?done=1",request.url),303);
}
