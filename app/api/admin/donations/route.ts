import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function POST(request:Request){
  await requireStaff(); const f=await request.formData();
  const kind=String(f.get("kind")||""); const title=String(f.get("title")||"").trim(); const amount=Number(f.get("amount")); const occurred_on=String(f.get("occurred_on")||""); const memo=String(f.get("memo")||"").trim();
  if(!["income","expense"].includes(kind)||!title||!Number.isFinite(amount)||amount<=0||!occurred_on) return NextResponse.redirect(new URL("/admin/donations?error=1",request.url),303);
  const {error}=await getSupabaseAdmin().from("donation_ledger").insert({kind,title,amount:Math.round(amount),occurred_on,memo:memo||null});
  return NextResponse.redirect(new URL(`/admin/donations?${error?"error=1":"saved=1"}`,request.url),303);
}
