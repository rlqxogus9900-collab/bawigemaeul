import "server-only";

export type RiotRegion = "asia" | "americas" | "europe" | "sea";
export type RiotPlatform = "kr" | "jp1" | "na1" | "euw1" | "eun1" | "oc1";

const API_KEY = process.env.RIOT_API_KEY?.trim();
const DEFAULT_REGION = (process.env.RIOT_ROUTING_REGION?.trim() || "asia") as RiotRegion;
const DEFAULT_PLATFORM = (process.env.RIOT_PLATFORM_REGION?.trim() || "kr") as RiotPlatform;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;

export class RiotApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status = 500, retryAfter?: number) {
    super(message);
    this.name = "RiotApiError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function isRiotConfigured() {
  return Boolean(API_KEY);
}

function baseUrl(kind: "regional" | "platform") {
  return kind === "regional"
    ? `https://${DEFAULT_REGION}.api.riotgames.com`
    : `https://${DEFAULT_PLATFORM}.api.riotgames.com`;
}

async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function riotFetch<T>(path: string, kind: "regional" | "platform" = "regional"): Promise<T> {
  if (!API_KEY) throw new RiotApiError("RIOT_API_KEY가 설정되지 않았습니다.", 503);

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl(kind)}${path}`, {
        headers: { "X-Riot-Token": API_KEY },
        signal: controller.signal,
        cache: "no-store"
      });

      if (response.ok) return await response.json() as T;

      const retryAfter = Number(response.headers.get("retry-after") || 0) || undefined;
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        await sleep(Math.min((retryAfter ?? 1) * 1000, 5000));
        continue;
      }

      throw new RiotApiError(
        response.status === 404 ? "Riot 계정 또는 경기 데이터를 찾지 못했습니다." : `Riot API 요청 실패 (${response.status})`,
        response.status,
        retryAfter
      );
    } catch (error) {
      lastError = error;
      if (error instanceof RiotApiError) throw error;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new RiotApiError(lastError instanceof Error ? lastError.message : "Riot API 연결에 실패했습니다.", 502);
}

export type RiotAccount = { puuid: string; gameName: string; tagLine: string };

export function getAccountByRiotId(gameName: string, tagLine: string) {
  return riotFetch<RiotAccount>(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
}

export function getAccountByPuuid(puuid: string) {
  return riotFetch<RiotAccount>(`/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`);
}

export function getSummonerByPuuid(puuid: string) {
  return riotFetch<Record<string, unknown>>(`/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`, "platform");
}

export function getMatchIdsByPuuid(puuid: string, count = 10, start = 0) {
  const safeCount = Math.max(1, Math.min(20, Math.trunc(count)));
  const safeStart = Math.max(0, Math.trunc(start));
  return riotFetch<string[]>(
    `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${safeStart}&count=${safeCount}`
  );
}

export function getMatch(matchId: string) {
  return riotFetch<Record<string, unknown>>(`/lol/match/v5/matches/${encodeURIComponent(matchId)}`);
}
