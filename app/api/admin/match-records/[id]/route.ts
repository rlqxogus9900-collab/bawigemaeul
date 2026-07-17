import {NextResponse} from "next/server";import {requireStaff} from "@/lib/session";import {getSupabaseAdmin} from "@/lib/supabase-admin";
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){await requireStaff();const {id}=await params;await getSupabaseAdmin().from("regular_match_results").delete().eq("id",id);return NextResponse.json({ok:true})}
