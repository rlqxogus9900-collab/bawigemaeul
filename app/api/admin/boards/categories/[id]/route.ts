import {NextResponse} from "next/server";import {requireStaff} from "@/lib/session";import {getSupabaseAdmin} from "@/lib/supabase-admin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){await requireStaff();const{id}=await params;const f=await request.formData();const db=getSupabaseAdmin();
if(String(f.get("_action")||"update")==="delete"){const{count}=await db.from("board_subcategories").select("id",{count:"exact",head:true}).eq("category_id",id);if((count||0)>0)return NextResponse.redirect(new URL("/admin/boards?error=1",request.url),303);await db.from("board_categories").delete().eq("id",id);}
else await db.from("board_categories").update({name:String(f.get("name")||"").trim(),icon:String(f.get("icon")||"💬").trim()||"💬",sort_order:Number(f.get("sort_order")||0)}).eq("id",id);
return NextResponse.redirect(new URL("/admin/boards?saved=1",request.url),303);}
