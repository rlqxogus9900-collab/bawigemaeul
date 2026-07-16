import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const currentUser = await requireStaff();
  const { id } = await params;
  if (id === currentUser.id) return NextResponse.json({message:"본인 계정은 삭제할 수 없습니다."},{status:400});
  const db = getSupabaseAdmin();
  const { data: target } = await db.from("members").select("id,role").eq("id",id).maybeSingle();
  if (!target) return NextResponse.json({message:"클랜원을 찾을 수 없습니다."},{status:404});
  if (target.role === "staff") {
    const { count } = await db.from("members").select("id",{count:"exact",head:true}).eq("role","staff").eq("is_active",true);
    if ((count || 0) <= 1) return NextResponse.json({message:"마지막 운영진 계정은 삭제할 수 없습니다."},{status:400});
  }
  const { error } = await db.from("members").delete().eq("id",id);
  if (error) return NextResponse.json({message:"연결된 기록이 있어 삭제하지 못했습니다."},{status:409});
  return NextResponse.json({ok:true});
}
