import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function ensureStaff(){ return requireStaff(); }
export async function hasAnyStaff(){
 const db=getSupabaseAdmin();
 const {count,error}=await db.from("members").select("id",{count:"exact",head:true}).eq("role","staff");
 if(error) throw error; return (count??0)>0;
}
