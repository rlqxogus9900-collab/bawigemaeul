import { NextRequest, NextResponse } from "next/server";
import { getAccountByRiotId, RiotApiError } from "@/lib/riot";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gameName = request.nextUrl.searchParams.get("gameName")?.trim();
  const tagLine = request.nextUrl.searchParams.get("tagLine")?.trim();
  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "gameName과 tagLine이 필요합니다." }, { status: 400 });
  }

  try {
    return NextResponse.json(await getAccountByRiotId(gameName, tagLine));
  } catch (error) {
    const status = error instanceof RiotApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "요청 실패" }, { status });
  }
}
