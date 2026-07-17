import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type MatchResult = Record<string, unknown>;

function text(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

export default async function HallOfFamePage() {
  const db = getSupabaseAdmin();

  const [{ data: regular }, { data: detailed }] = await Promise.all([
    db.from("regular_match_results").select("*").order("played_at", { ascending: false }).limit(30),
    db.from("match_records").select("*").order("played_at", { ascending: false }).limit(30)
  ]);

  const matches = ([...(regular || []), ...(detailed || [])] as MatchResult[])
    .sort((a,b) => new Date(String(b.played_at || 0)).getTime() - new Date(String(a.played_at || 0)).getTime())
    .slice(0, 30);

  const winnerCounts = new Map<string, number>();

  matches.forEach(match => {
    const winner = text(
      match.winner_name ?? match.winner_team ?? match.winner,
      ""
    );
    if (winner) {
      winnerCounts.set(winner, (winnerCounts.get(winner) || 0) + 1);
    }
  });

  const rankings = [...winnerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <section className="hall-hero">
        <div>
          <span>HALL OF FAME</span>
          <h1>명예의 전당</h1>
          <p>바위게마을 정기내전의 우승팀과 기록을 확인합니다.</p>
        </div>
        <div className="hall-trophy">🏆</div>
      </section>

      <section className="hall-ranking-grid">
        {rankings.map(([name, wins], index) => (
          <article className="hall-ranking-card" key={name}>
            <span>{index + 1}</span>
            <div>
              <small>누적 우승</small>
              <h2>{name}</h2>
            </div>
            <strong>{wins}회</strong>
          </article>
        ))}

        {!rankings.length && (
          <div className="card hall-empty">
            아직 등록된 우승 기록이 없습니다.
          </div>
        )}
      </section>

      <section className="card hall-history-card">
        <div className="dashboard-head">
          <div>
            <span>WINNER HISTORY</span>
            <h2>최근 우승 기록</h2>
          </div>
          <small>최근 {matches.length}건</small>
        </div>

        <div className="hall-history-list">
          {matches.map((match, index) => {
            const winner = text(
              match.winner_name ?? match.winner_team ?? match.winner,
              "우승팀 미등록"
            );
            const playedAt = match.played_at
              ? new Date(String(match.played_at)).toLocaleDateString("ko-KR")
              : "날짜 미등록";
            const mvp = text(match.mvp_name ?? match.mvp, "");

            return (
              <article key={text(match.id, String(index))}>
                <div className="hall-history-medal">🏆</div>
                <div>
                  <small>{playedAt}</small>
                  <h3>{winner}</h3>
                  {mvp && <p>MVP · {mvp}</p>}
                </div>
                <span>WINNER</span>
              </article>
            );
          })}

          {!matches.length && (
            <div className="hall-empty">
              대회·내전 기록에서 결과를 등록하면 여기에 표시됩니다.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
