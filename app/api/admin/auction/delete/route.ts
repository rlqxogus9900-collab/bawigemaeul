import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(req: NextRequest) {
  try {
    await requireStaff();
    const body = await req.json().catch(() => ({}));
    const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";
    if (!roomId) return NextResponse.json({ error: "삭제할 경매방 정보가 없습니다." }, { status: 400 });

    const db = getSupabaseAdmin();
    const { data: room, error: roomError } = await db.from("auction_rooms").select("id,title").eq("id", roomId).maybeSingle();
    if (roomError) throw roomError;
    if (!room) return NextResponse.json({ ok: true, deletedRoomId: roomId, alreadyDeleted: true });

    // FK 설정이 과거 SQL 상태와 달라도 확실히 삭제되도록 자식 기록을 순서대로 정리한다.
    const steps = [
      db.from("auction_rooms").update({ current_player_id: null, current_team_id: null, current_bid: 0 }).eq("id", roomId),
      db.from("auction_bids").delete().eq("room_id", roomId),
      db.from("auction_players").delete().eq("room_id", roomId),
      db.from("auction_teams").delete().eq("room_id", roomId),
      db.from("auction_rooms").delete().eq("id", roomId)
    ];
    for (const operation of steps) {
      const { error } = await operation;
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, deletedRoomId: roomId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "경매 삭제 실패" }, { status: 500 });
  }
}
