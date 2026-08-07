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


  const today = new Date().toISOString().slice(0, 10);
  const { data: vacation } = await db
    .from("member_vacations")
    .select("start_date,end_date,reason")
    .eq("member_id", id)
    .gte("end_date", today)
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    ...member,
    activity_status: vacation ? "vacation" : member.activity_status,
    vacation: vacation || null,
    stats: {
      winRate: null,
      kda: null,
      averageAuctionPrice: null
    }
  });
}
