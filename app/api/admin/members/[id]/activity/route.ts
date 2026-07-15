import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  await requireStaff();const {id}=await params;
  const form=await request.formData();
  const status=String(form.get("status")||"active");
  const reason=String(form.get("reason")||"").trim();
  if(status==="excluded"&&!reason)return NextResponse.redirect(new URL("/admin/activity?error=reason",request.url),303);
  await getSupabaseAdmin().from("members").update({
    activity_status:status==="inactive"?"inactive":"active",
    activity_excluded:status==="excluded",
    activity_exclusion_reason:status==="excluded"?reason:null
  }).eq("id",id);
  return NextResponse.redirect(new URL("/admin/activity",request.url),303);
}
