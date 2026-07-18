import { NextRequest, NextResponse } from "next/server";
import {
  getAccountByRiotId,
  getMatch,
  getMatchIdsByPuuid,
  getSummonerByPuuid,
  RiotApiError
} from "@/lib/riot";

export const dynamic = "force-dynamic";

type MatchParticipant = {
  puuid?: string;
  championName?: string;
  championId?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  win?: boolean;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  goldEarned?: number;
  item0?: number;
  item1?: number;
  item2?: number;
  item3?: number;
  item4?: number;
  item5?: number;
  item6?: number;
};

type MatchPayload = {
  metadata?: { matchId?: string };
  info?: {
    gameCreation?: number;
    gameDuration?: number;
    gameMode?: string;
    queueId?: number;
    gameVersion?: string;
    participants?: MatchParticipant[];
  };
};

const QUEUE_NAMES: Record<number, string> = {
  0: "사용자 설정",
  400: "일반 선택",
  420: "솔로 랭크",
  430: "일반 블라인드",
  440: "자유 랭크",
  450: "칼바람 나락",
  490: "빠른 대전",
  700: "격전",
  830: "AI 입문",
  840: "AI 초급",
  850: "AI 중급",
  900: "URF",
  1020: "단일 챔피언",
  1300: "돌격 넥서스",
  1400: "궁극기 주문서",
  1700: "아레나",
  1710: "아레나",
  1900: "URF"
};

function summarizeMatch(match: MatchPayload, puuid: string) {
  const info = match.info || {};
  const participant = info.participants?.find(item => item.puuid === puuid);
  if (!participant) return null;

  const kills = Number(participant.kills || 0);
  const deaths = Number(participant.deaths || 0);
  const assists = Number(participant.assists || 0);
  const duration = Number(info.gameDuration || 0);
  const cs = Number(participant.totalMinionsKilled || 0) + Number(participant.neutralMinionsKilled || 0);

  return {
    matchId: match.metadata?.matchId || "",
    playedAt: Number(info.gameCreation || 0),
    duration,
    gameMode: info.gameMode || "",
    queueId: Number(info.queueId || 0),
    queueName: QUEUE_NAMES[Number(info.queueId || 0)] || `게임 모드 ${Number(info.queueId || 0)}`,
    gameVersion: info.gameVersion || "",
    championName: participant.championName || "Unknown",
    championId: Number(participant.championId || 0),
    win: Boolean(participant.win),
    kills,
    deaths,
    assists,
    kda: deaths === 0 ? kills + assists : Number(((kills + assists) / deaths).toFixed(2)),
    cs,
    csPerMinute: duration > 0 ? Number((cs / (duration / 60)).toFixed(1)) : 0,
    goldEarned: Number(participant.goldEarned || 0),
    items: [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6]
      .map(Number)
      .filter(Boolean)
  };
}

export async function GET(request: NextRequest) {
  const riotId = request.nextUrl.searchParams.get("riotId")?.trim() || "";
  const hashIndex = riotId.lastIndexOf("#");
  if (hashIndex <= 0 || hashIndex === riotId.length - 1) {
    return NextResponse.json({ error: "Riot ID를 닉네임#태그 형식으로 입력해주세요." }, { status: 400 });
  }

  const gameName = riotId.slice(0, hashIndex).trim();
  const tagLine = riotId.slice(hashIndex + 1).trim();
  const requestedCount = Number(request.nextUrl.searchParams.get("count") || 5);
  const count = Math.max(1, Math.min(10, Number.isFinite(requestedCount) ? Math.trunc(requestedCount) : 5));

  try {
    const account = await getAccountByRiotId(gameName, tagLine);
    const [summoner, matchIds] = await Promise.all([
      getSummonerByPuuid(account.puuid),
      getMatchIdsByPuuid(account.puuid, count)
    ]);

    const matches = await Promise.all(
      matchIds.map(async matchId => {
        try {
          return summarizeMatch(await getMatch(matchId) as MatchPayload, account.puuid);
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      account,
      summoner,
      matches: matches.filter(Boolean),
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    const status = error instanceof RiotApiError ? error.status : 500;
    const retryAfter = error instanceof RiotApiError ? error.retryAfter : undefined;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Riot API 요청에 실패했습니다.",
        ...(retryAfter ? { retryAfter } : {})
      },
      { status }
    );
  }
}
