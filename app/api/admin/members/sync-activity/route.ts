import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { syncRiotActivity } from "@/lib/riot-activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    await requireStaff();
    return NextResponse.json(await syncRiotActivity());
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: error instanceof Error ? error.message : "활동 집계에 실패했습니다."
    }, { status: 500 });
  }
}
