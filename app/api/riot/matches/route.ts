import { NextRequest, NextResponse } from "next/server";
import { getMatchIdsByPuuid, RiotApiError } from "@/lib/riot";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const puuid = request.nextUrl.searchParams.get("puuid")?.trim();
  const count = Number(request.nextUrl.searchParams.get("count") || 10);
  const start = Number(request.nextUrl.searchParams.get("start") || 0);
  if (!puuid) return NextResponse.json({ error: "puuid가 필요합니다." }, { status: 400 });

  try {
    const matchIds = await getMatchIdsByPuuid(puuid, count, start);
    return NextResponse.json({ puuid, count: matchIds.length, matchIds });
  } catch (error) {
    const status = error instanceof RiotApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "요청 실패" }, { status });
  }
}
