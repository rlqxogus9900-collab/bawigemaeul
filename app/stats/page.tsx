import { getSupabaseAdmin } from "@/lib/supabase-admin";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

type MemberRow = {
  id: string;
  nickname: string;
  match_tier: number | null;
};

type PlayerStatRow = {
  member_id: string;
  line: string;
  kills: number;
  deaths: number;
  assists: number;
  is_win: boolean;
};

type Aggregate = {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
};

function createAggregate(): Aggregate {
  return { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
}

function addRecord(target: Aggregate, record: PlayerStatRow) {
  target.games += 1;
  target.wins += record.is_win ? 1 : 0;
  target.kills += Number(record.kills || 0);
  target.deaths += Number(record.deaths || 0);
  target.assists += Number(record.assists || 0);
}

export default async function StatsPage() {
  const db = getSupabaseAdmin();
  const [{ data: rawMembers }, { data: rawStats }] = await Promise.all([
    db.from("members").select("id,nickname,match_tier").eq("is_active", true).order("nickname", { ascending: true }),
    db.from("regular_match_player_stats").select("member_id,line,kills,deaths,assists,is_win")
  ]);

  const members = (rawMembers || []) as MemberRow[];
  const records = (rawStats || []) as PlayerStatRow[];
  const totals = new Map<string, Aggregate>();
  const lineTotals = new Map<string, Record<string, Aggregate>>();

  for (const record of records) {
    const overall = totals.get(record.member_id) || createAggregate();
    addRecord(overall, record);
    totals.set(record.member_id, overall);

    const memberLines = lineTotals.get(record.member_id) || {};
    const lineStat = memberLines[record.line] || createAggregate();
    addRecord(lineStat, record);
    memberLines[record.line] = lineStat;
    lineTotals.set(record.member_id, memberLines);
  }

  return (
    <StatsClient
      members={members.map(member => ({
        id: member.id,
        nickname: member.nickname,
        matchTier: member.match_tier,
        overall: totals.get(member.id) || createAggregate(),
        byLine: lineTotals.get(member.id) || {}
      }))}
    />
  );
}
