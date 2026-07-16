import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data: member, error } = await db
    .from("members")
    .select(`
      id,
      nickname,
      riot_id,
      current_tier,
      highest_tier,
      average_tier,
      match_tier,
      main_line,
      sub_line,
      role,
      activity_status,
      last_activity_at,
      reference_note
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !member) {
    return NextResponse.json(
      { message: "클랜원 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...member,
    stats: {
      winRate: null,
      kda: null,
      averageAuctionPrice: null
    }
  });
}
