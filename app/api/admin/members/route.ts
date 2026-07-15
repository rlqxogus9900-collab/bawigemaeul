import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request){
  await requireStaff();
  const form=await request.formData();
  const nickname=String(form.get("nickname")||"").trim();
  const riot_id=String(form.get("riot_id")||"").trim();
  const role=form.get("role")==="staff"?"staff":"member";
  if(!nickname||!riot_id.includes("#"))return NextResponse.redirect(new URL("/admin/members?error=1",request.url),303);
  await getSupabaseAdmin().from("members").insert({
    nickname,riot_id,role,password_hash:await hashPassword("1234"),must_change_password:true,is_active:true
  });
  return NextResponse.redirect(new URL("/admin/members",request.url),303);
}
