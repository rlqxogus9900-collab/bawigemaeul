import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const [{ data: notifications }, { count }] = await Promise.all([
    db
      .from("notifications")
      .select("id,type,title,message,link,is_read,created_at")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("member_id", user.id)
      .eq("is_read", false)
  ]);

  return NextResponse.json({
    notifications: notifications || [],
    unreadCount: count || 0
  });
}
