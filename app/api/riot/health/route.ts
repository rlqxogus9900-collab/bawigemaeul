import { NextResponse } from "next/server";
import { isRiotConfigured } from "@/lib/riot";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isRiotConfigured(),
    platform: process.env.RIOT_PLATFORM_REGION || "kr",
    routingRegion: process.env.RIOT_ROUTING_REGION || "asia"
  });
}
