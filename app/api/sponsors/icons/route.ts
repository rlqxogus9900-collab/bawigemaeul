import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeNickname(value: string) {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "").replace(/#.*$/, "");
}

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("sponsors")
    .select("display_name,sponsor_nickname,icon_key")
    .neq("icon_key", "none");

  if (error) return NextResponse.json({ icons: {} }, { headers: { "Cache-Control": "no-store" } });

  const icons: Record<string, string> = {};
  for (const item of data || []) {
    const target = String(item.sponsor_nickname || item.display_name || "");
    if (!target || !item.icon_key) continue;
    icons[normalizeNickname(target)] = item.icon_key;
  }

  return NextResponse.json({ icons }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
