import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getAccountByRiotId, getMatch, getMatchIdsByPuuid, isRiotConfigured, RiotApiError } from "@/lib/riot";

const ACTIVE_WINDOW_DAYS = 7;

type MemberForSync = {
  id: string;
  nickname: string;
  riot_id: string | null;
  riot_puuid: string | null;
  activity_excluded: boolean | null;
  is_active: boolean | null;
};

function splitRiotId(value: string) {
  const index = value.lastIndexOf("#");
  if (index <= 0 || index === value.length - 1) return null;
  return { gameName: value.slice(0, index).trim(), tagLine: value.slice(index + 1).trim() };
}

function latestGameTime(payload: unknown) {
  const match = payload as { info?: { gameCreation?: number; gameEndTimestamp?: number } };
  const timestamp = Number(match.info?.gameEndTimestamp || match.info?.gameCreation || 0);
  return timestamp > 0 ? new Date(timestamp).toISOString() : null;
}

export async function syncRiotActivity() {
  const db = getSupabaseAdmin();
  const now = new Date();
  const syncedAt = now.toISOString();

  if (!isRiotConfigured()) {
    return { ok: false, configured: false, synced: 0, failed: 0, missing: 0, message: "Riot API 키가 설정되지 않았습니다." };
  }

  const { data, error } = await db
    .from("members")
    .select("id,nickname,riot_id,riot_puuid,activity_excluded,is_active")
    .order("nickname");

  if (error) throw new Error(error.message);

  let synced = 0;
  let failed = 0;
  let missing = 0;

  for (const member of (data || []) as MemberForSync[]) {
    if (!member.is_active) continue;
    const riotId = String(member.riot_id || "").trim();
    const parsed = splitRiotId(riotId);

    if (!parsed) {
      missing += 1;
      await db.from("members").update({
        riot_sync_status: "missing_riot_id",
        riot_sync_error: "Riot ID를 닉네임#태그 형식으로 등록해야 집계됩니다.",
        last_riot_sync_at: syncedAt,
        ...(!member.activity_excluded ? { activity_status: "inactive" } : {})
      }).eq("id", member.id);
      continue;
    }

    try {
      let puuid = member.riot_puuid || "";
      if (!puuid) {
        const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine);
        puuid = account.puuid;
      }

      const matchIds = await getMatchIdsByPuuid(puuid, 1);
      let lastGameAt: string | null = null;
      if (matchIds[0]) lastGameAt = latestGameTime(await getMatch(matchIds[0]));

      const activeCutoff = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const activityStatus = lastGameAt && new Date(lastGameAt).getTime() >= activeCutoff ? "active" : "inactive";

      await db.from("members").update({
        riot_puuid: puuid,
        riot_sync_status: "synced",
        riot_sync_error: null,
        last_riot_sync_at: syncedAt,
        last_game_at: lastGameAt,
        ...(!member.activity_excluded ? { activity_status: activityStatus } : {})
      }).eq("id", member.id);
      synced += 1;
    } catch (caught) {
      failed += 1;
      const status = caught instanceof RiotApiError && caught.status === 404 ? "riot_id_not_found" : "api_error";
      await db.from("members").update({
        riot_sync_status: status,
        riot_sync_error: caught instanceof Error ? caught.message : "Riot API 집계 실패",
        last_riot_sync_at: syncedAt
      }).eq("id", member.id);

      if (caught instanceof RiotApiError && caught.status === 429) break;
    }
  }

  return { ok: true, configured: true, synced, failed, missing, activeWindowDays: ACTIVE_WINDOW_DAYS, syncedAt };
}
