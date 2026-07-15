import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  await requireStaff();const {id}=await params;
  await getSupabaseAdmin().from("members").delete().eq("id",id);
  return NextResponse.redirect(new URL("/admin/members",request.url),303);
}
