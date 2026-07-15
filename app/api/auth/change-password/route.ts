import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request){
  const user=await getSession();
  if(!user)return NextResponse.redirect(new URL("/login",request.url),303);
  const form=await request.formData();
  const password=String(form.get("password")||"");
  const confirm=String(form.get("confirm")||"");
  if(password.length<4||password!==confirm)return NextResponse.redirect(new URL("/change-password?error=1",request.url),303);
  await getSupabaseAdmin().from("members").update({password_hash:await hashPassword(password),must_change_password:false}).eq("id",user.id);
  return NextResponse.redirect(new URL("/",request.url),303);
}
