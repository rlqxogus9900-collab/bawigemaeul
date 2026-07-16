import {NextResponse} from "next/server";import {requireStaff} from "@/lib/session";import {getSupabaseAdmin} from "@/lib/supabase-admin";
export async function POST(request:Request){await requireStaff();const f=await request.formData();const category_id=String(f.get("category_id")||"");const name=String(f.get("name")||"").trim();if(!category_id||!name)return NextResponse.redirect(new URL("/admin/boards?error=1",request.url),303);
await getSupabaseAdmin().from("board_subcategories").insert({category_id,name,description:String(f.get("description")||"").trim()||null,sort_order:Number(f.get("sort_order")||0)});
return NextResponse.redirect(new URL("/admin/boards?saved=1",request.url),303);}
