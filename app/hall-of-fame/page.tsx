import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import HallOfFameClient from "./HallOfFameClient";

export const dynamic = "force-dynamic";

type MatchResult = Record<string, unknown>;

function text(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(item => text(item)).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(item => text(item)).filter(Boolean);
  } catch {}
  return value.split(/[,/|·\n]/).map(item => item.trim()).filter(Boolean);
}

export default async function HallOfFamePage() {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("regular_match_results")
    .select("*")
    .order("played_at", { ascending: false })
    .limit(100);

  const matches = (data || []) as MatchResult[];

  const records = matches.map((match, index) => {
    const playedAt = text(match.played_at ?? match.created_at);
    const winner = text(match.winner_name ?? match.winner_team ?? match.winner, "우승팀 미등록");
    const teamA = text(match.team_a_name, "A팀");
    const teamB = text(match.team_b_name, "B팀");
    const setsA = text(match.team_a_sets);
    const setsB = text(match.team_b_sets);
    const members = list(
      match.winner_members ?? match.winner_players ?? match.team_members ?? match.members
    );

    return {
      id: text(match.id, String(index)),
      winner,
      playedAt,
      playedAtLabel: playedAt ? new Date(playedAt).toLocaleDateString("ko-KR") : "날짜 미등록",
      mvp: text(match.mvp_name ?? match.mvp),
      eventTitle: text(match.title ?? match.event_title ?? match.match_title, "정기내전"),
      eventType: text(match.event_type ?? match.match_type, "정기내전"),
      score: setsA && setsB ? `${teamA} ${setsA} : ${setsB} ${teamB}` : "",
      members
    };
  });

  const winnerCounts = new Map<string, { wins: number; mvps: number }>();
  records.forEach(record => {
    const current = winnerCounts.get(record.winner) || { wins: 0, mvps: 0 };
    current.wins += 1;
    if (record.mvp) current.mvps += 1;
    winnerCounts.set(record.winner, current);
  });

  const rankings = [...winnerCounts.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.wins - a.wins || b.mvps - a.mvps || a.name.localeCompare(b.name, "ko"));

  return (
    <>
      <section className="hall-hero">
        <div>
          <span>HALL OF FAME</span>
          <h1>명예의 전당</h1>
          <p>바위게마을의 역대 우승팀, MVP, 대회 기록을 한눈에 확인합니다.</p>
          <Link className="button hall-admin-link" href="/admin/match-records" prefetch={false}>
            운영진 기록 관리
          </Link>
        </div>
        <div className="hall-trophy">🏆</div>
      </section>

      <HallOfFameClient records={records} rankings={rankings} />
    </>
  );
}
