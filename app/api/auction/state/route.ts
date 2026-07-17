import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const db = getSupabaseAdmin();
  const { data: room } = await db
    .from("auction_rooms")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!room) return NextResponse.json({ room: null, teams: [], players: [], bids: [] });

  const [{ data: teams }, { data: players }, { data: bids }] = await Promise.all([
    db.from("auction_teams").select("*").eq("room_id", room.id).order("sort_order"),
    db.from("auction_players").select("*").eq("room_id", room.id).order("sort_order"),
    db.from("auction_bids").select("*").eq("room_id", room.id).order("created_at", { ascending: false }).limit(100)
  ]);

  return NextResponse.json(
    { room, teams: teams || [], players: players || [], bids: bids || [] },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
