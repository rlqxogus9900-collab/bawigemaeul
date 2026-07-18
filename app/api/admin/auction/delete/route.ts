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

    // 현재 화면에서 이전 테스트 경매가 다시 살아나는 일을 막기 위해
    // 현재 경매 삭제 시 모든 경매방과 관련 기록을 완전히 초기화한다.
    const { data: allRooms, error: listError } = await db.from("auction_rooms").select("id");
    if (listError) throw listError;
    const roomIds = (allRooms || []).map(item => item.id);

    if (roomIds.length) {
      const steps = [
        db.from("auction_rooms").update({ current_player_id: null, current_team_id: null, current_bid: 0 }).in("id", roomIds),
        db.from("auction_bids").delete().in("room_id", roomIds),
        db.from("auction_players").delete().in("room_id", roomIds),
        db.from("auction_teams").delete().in("room_id", roomIds),
        db.from("auction_rooms").delete().in("id", roomIds)
      ];
      for (const operation of steps) {
        const { error } = await operation;
        if (error) throw error;
      }
    }

    return NextResponse.json({ ok: true, deletedRoomId: roomId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "경매 삭제 실패" }, { status: 500 });
  }
}
