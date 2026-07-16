import {NextResponse} from "next/server";import {requireStaff} from "@/lib/session";import {getSupabaseAdmin} from "@/lib/supabase-admin";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){await requireStaff();const{id}=await params;const f=await request.formData();const db=getSupabaseAdmin();
if(String(f.get("_action")||"update")==="delete"){const{count}=await db.from("board_posts").select("id",{count:"exact",head:true}).eq("subcategory_id",id);if((count||0)>0)return NextResponse.redirect(new URL("/admin/boards?error=1",request.url),303);await db.from("board_subcategories").delete().eq("id",id);}
else await db.from("board_subcategories").update({name:String(f.get("name")||"").trim(),description:String(f.get("description")||"").trim()||null,sort_order:Number(f.get("sort_order")||0)}).eq("id",id);
return NextResponse.redirect(new URL("/admin/boards?saved=1",request.url),303);}
