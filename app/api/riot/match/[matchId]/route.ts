import { NextResponse } from "next/server";
import { getMatch, RiotApiError } from "@/lib/riot";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await context.params;
  if (!matchId) return NextResponse.json({ error: "matchId가 필요합니다." }, { status: 400 });

  try {
    return NextResponse.json(await getMatch(matchId));
  } catch (error) {
    const status = error instanceof RiotApiError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "요청 실패" }, { status });
  }
}
