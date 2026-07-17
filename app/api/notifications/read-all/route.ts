import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("member_id", user.id)
    .eq("is_read", false);

  return NextResponse.json({ ok: true });
}
