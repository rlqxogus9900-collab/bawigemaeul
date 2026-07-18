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
    const { data: room, error: roomError } = await db
      .from("auction_rooms")
      .select("id,title")
      .eq("id", roomId)
      .maybeSingle();

    if (roomError) throw roomError;
    if (!room) return NextResponse.json({ error: "이미 삭제되었거나 존재하지 않는 경매방입니다." }, { status: 404 });

    const { error: deleteError } = await db.from("auction_rooms").delete().eq("id", roomId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true, deletedRoomId: roomId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "경매 삭제 실패" },
      { status: 500 }
    );
  }
}
