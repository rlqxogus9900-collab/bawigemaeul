import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){await requireStaff();const {id}=await params;const {error}=await getSupabaseAdmin().from("donation_ledger").delete().eq("id",id);return NextResponse.redirect(new URL(`/admin/donations?${error?"error=1":"saved=1"}`,request.url),303);}
