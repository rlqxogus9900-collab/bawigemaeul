import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("sponsors")
    .select("display_name,icon_key")
    .eq("is_visible", true)
    .neq("icon_key", "none");

  if (error) {
    return NextResponse.json({ icons: {} }, { status: 200 });
  }

  const icons = Object.fromEntries(
    (data || [])
      .filter(item => item.display_name && item.icon_key)
      .map(item => [String(item.display_name).trim().toLowerCase(), item.icon_key])
  );

  return NextResponse.json({ icons });
}
