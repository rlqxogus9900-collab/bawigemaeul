import {NextResponse} from "next/server";import {requireStaff} from "@/lib/session";import {getSupabaseAdmin} from "@/lib/supabase-admin";
export async function POST(request:Request){await requireStaff();const f=await request.formData();const name=String(f.get("name")||"").trim();if(!name)return NextResponse.redirect(new URL("/admin/boards?error=1",request.url),303);
await getSupabaseAdmin().from("board_categories").insert({name,icon:String(f.get("icon")||"💬").trim()||"💬",sort_order:Number(f.get("sort_order")||0)});
return NextResponse.redirect(new URL("/admin/boards?saved=1",request.url),303);}
