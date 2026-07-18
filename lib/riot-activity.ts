import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getAccountByRiotId, getMatch, getMatchIdsByPuuid, isRiotConfigured, RiotApiError } from "@/lib/riot";

const ACTIVE_WINDOW_DAYS = 7;
const RECENT_MATCH_COUNT = 20;

type MemberForSync = {
  id: string;
  nickname: string;
  riot_id: string | null;
  riot_puuid: string | null;
  activity_excluded: boolean | null;
  is_active: boolean | null;
};

type PreparedMember = MemberForSync & {
  puuid: string;
  matchIds: string[];
};

function splitRiotId(value: string) {
  const index = value.lastIndexOf("#");
  if (index <= 0 || index === value.length - 1) return null;
  return { gameName: value.slice(0, index).trim(), tagLine: value.slice(index + 1).trim() };
}

function gameTime(payload: unknown) {
  const match = payload as { info?: { gameCreation?: number; gameEndTimestamp?: number } };
  const timestamp = Number(match.info?.gameEndTimestamp || match.info?.gameCreation || 0);
  return timestamp > 0 ? new Date(timestamp).toISOString() : null;
}

export async function syncRiotActivity() {
  const db = getSupabaseAdmin();
  const syncedAt = new Date().toISOString();

  if (!isRiotConfigured()) {
    return { ok: false, configured: false, synced: 0, failed: 0, missing: 0, message: "Riot API 키가 설정되지 않았습니다." };
  }

  const { data, error } = await db
    .from("members")
    .select("id,nickname,riot_id,riot_puuid,activity_excluded,is_active")
    .order("nickname");

  if (error) throw new Error(error.message);

  const members = ((data || []) as MemberForSync[]).filter(member => member.is_active);
  const prepared: PreparedMember[] = [];
  let synced = 0;
  let failed = 0;
  let missing = 0;

  // 1) 모든 클랜원의 PUUID와 최근 경기 ID를 먼저 수집합니다.
  for (const member of members) {
    const riotId = String(member.riot_id || "").trim();
    const parsed = splitRiotId(riotId);

    if (!parsed) {
      missing += 1;
      await db.from("members").update({
        riot_sync_status: "missing_riot_id",
        riot_sync_error: "Riot ID를 닉네임#태그 형식으로 등록해야 집계됩니다.",
        last_riot_sync_at: syncedAt,
        last_game_at: null,
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

      const matchIds = await getMatchIdsByPuuid(puuid, RECENT_MATCH_COUNT);
      prepared.push({ ...member, puuid, matchIds });
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

  // 2) 같은 경기 ID를 가진 클랜원이 2명 이상인 경기만 '클랜 활동'으로 인정합니다.
  const matchMembers = new Map<string, Set<string>>();
  for (const member of prepared) {
    for (const matchId of member.matchIds) {
      const memberIds = matchMembers.get(matchId) || new Set<string>();
      memberIds.add(member.id);
      matchMembers.set(matchId, memberIds);
    }
  }

  const sharedMatchIds = [...matchMembers.entries()]
    .filter(([, memberIds]) => memberIds.size >= 2)
    .map(([matchId]) => matchId);

  const sharedMatchTimes = new Map<string, string>();
  for (const matchId of sharedMatchIds) {
    try {
      const timestamp = gameTime(await getMatch(matchId));
      if (timestamp) sharedMatchTimes.set(matchId, timestamp);
    } catch (caught) {
      // 한 경기 상세 조회가 실패해도 다른 경기와 다른 클랜원 집계는 계속합니다.
      if (caught instanceof RiotApiError && caught.status === 429) break;
    }
  }

  const activeCutoff = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // 3) 각 클랜원의 가장 최근 '클랜원 동반 경기'를 저장합니다.
  for (const member of prepared) {
    const lastClanGameAt = member.matchIds
      .map(matchId => sharedMatchTimes.get(matchId) || null)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    const activityStatus = lastClanGameAt && new Date(lastClanGameAt).getTime() >= activeCutoff
      ? "active"
      : "inactive";

    await db.from("members").update({
      riot_puuid: member.puuid,
      riot_sync_status: "synced",
      riot_sync_error: lastClanGameAt ? null : `최근 ${RECENT_MATCH_COUNT}경기에서 다른 클랜원과 함께한 경기가 없습니다.`,
      last_riot_sync_at: syncedAt,
      last_game_at: lastClanGameAt,
      ...(!member.activity_excluded ? { activity_status: activityStatus } : {})
    }).eq("id", member.id);
    synced += 1;
  }

  return {
    ok: true,
    configured: true,
    synced,
    failed,
    missing,
    activeWindowDays: ACTIVE_WINDOW_DAYS,
    recentMatchCount: RECENT_MATCH_COUNT,
    activityRule: "다른 등록 클랜원과 같은 경기에 참여한 경우만 인정",
    syncedAt
  };
}
