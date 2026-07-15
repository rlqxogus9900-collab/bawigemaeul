import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/password";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  await requireStaff();const {id}=await params;
  await getSupabaseAdmin().from("members").update({password_hash:await hashPassword("1234"),must_change_password:true}).eq("id",id);
  return NextResponse.redirect(new URL("/admin/members",request.url),303);
}
