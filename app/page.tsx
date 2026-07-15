import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const lineRatios = [
  ["탑", 18],
  ["정글", 22],
  ["미드", 20],
  ["원딜", 25],
  ["서폿", 15]
];

export default async function HomePage() {
  const db = getSupabaseAdmin();

  const [
    { data: notices },
    { data: rules },
    { data: matches },
    { data: members },
    { data: sponsors }
  ] = await Promise.all([
    db.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(4),
    db.from("clan_rules").select("*").order("sort_order").limit(3),
    db.from("regular_match_results").select("*").order("played_at", { ascending: false }).limit(1),
    db.from("members").select("id,nickname,riot_id,activity_status,activity_excluded").order("created_at", { ascending: true }).limit(5),
    db.from("sponsors").select("*").eq("is_visible", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }).limit(12)
  ]);

  const latest = matches?.[0];
  const winner = latest?.winner_name || "미정";
  const score = latest ? `${latest.team_a_sets} : ${latest.team_b_sets}` : "-";
  const playedAt = latest?.played_at
    ? new Date(latest.played_at).toLocaleDateString("ko-KR")
    : "";

  return (
    <>
      <section className="home-hero">
        <div>
          <small>BAWIGEMAEUL CLAN</small>
          <h1>바위게마을</h1>
          <p>
            함께 승리하는 우리들의 마을.<br />
            일반 내전, 정기내전 통계와 챔피언 공략을 한곳에서 확인하세요.
          </p>
          <div className="hero-actions">
            <Link className="card-button" href="/normal-match">일반 내전 시작</Link>
            <Link className="top-button" href="/reference">참고 명단 보기</Link>
          </div>
        </div>
        <img src="/assets/crab-logo.jpg" alt="바위게마을" />
      </section>

      <section className="winner-banner">
        <div className="winner-crown">🏆</div>
        <div className="winner-main">
          <span>최근 대회·내전 우승팀</span>
          <h2>{winner}</h2>
          <p>우승 멤버 등록 전</p>
        </div>
        <div className="winner-score">
          <small>{playedAt}</small>
          <strong>{score}</strong>
          <b>결승 세트 스코어</b>
        </div>
        <Link className="top-button" href="/hall-of-fame">역대 대회 보기</Link>
      </section>

      <section className="home-grid home-grid-v628">
        <article className="home-card">
          <h2>주라인 비율</h2>
          <div className="line-chart">
            <div className="line-donut" aria-label="주라인 비율 원형 차트" />
            <div className="line-legend">
              {lineRatios.map(([line, ratio]) => (
                <div key={line}>
                  <span>{line}</span>
                  <b>{ratio}%</b>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="home-card">
          <div className="card-head">
            <h2>공지사항</h2>
            <Link href="/notices">전체 보기</Link>
          </div>
          <div className="home-list">
            {notices?.length ? notices.map(notice => (
              <div key={notice.id}>
                <span>{notice.is_pinned ? "📌" : "공지"}</span>
                <b>{notice.title}</b>
              </div>
            )) : <p className="muted">등록된 공지가 없습니다.</p>}
          </div>
        </article>

        <article className="home-card rules-card">
          <div className="card-head">
            <h2>📜 클랜 규칙</h2>
            <Link href="/rules">전체 보기</Link>
          </div>
          <div className="rule-preview">
            {rules?.length ? rules.map((rule, index) => (
              <div key={rule.id}>
                <em>{index + 1}</em>
                <span>{rule.content}</span>
              </div>
            )) : <p className="muted">등록된 클랜 규칙이 없습니다.</p>}
          </div>
          <Link className="top-button rule-button" href="/rules">전체 규칙 보기</Link>
        </article>

        <article className="home-card recent-match-card">
          <div className="card-head">
            <h2>최근 정기내전 결과</h2>
            <Link href="/stats">통계 보기</Link>
          </div>
          {latest ? (
            <div className="recent-match-result">
              <small>{playedAt}</small>
              <div>
                <span>{latest.team_a_name}</span>
                <strong>{latest.team_a_sets} : {latest.team_b_sets}</strong>
                <span>{latest.team_b_name}</span>
              </div>
              <b>🏆 {latest.winner_name} 승리</b>
            </div>
          ) : <p className="muted">등록된 결과가 없습니다.</p>}
        </article>

        <article className="home-card stats-wide">
          <div className="card-head">
            <h2>정기내전 승률 TOP</h2>
            <Link href="/stats">전체 통계</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>닉네임</th>
                  <th>승률</th>
                  <th>내전 KDA</th>
                  <th>평균 경매가</th>
                  <th>모스트 3</th>
                </tr>
              </thead>
              <tbody>
                {members?.length ? members.map(member => (
                  <tr key={member.id}>
                    <td>{member.nickname}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>통계 연동 전</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="muted">등록된 클랜원이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="home-card next-schedule-card">
          <h2>다음 일정</h2>
          <div className="next-schedule">
            <time>일정 등록 전</time>
            <b>예정된 일정이 없습니다.</b>
            <p>일정 관리 기능 이식 후 자동으로 표시됩니다.</p>
            <span>참가 0명</span>
          </div>
        </article>

        <article className="home-card custom-card">
          <div className="custom-icon">⭐</div>
          <h2>바위게마을 소식</h2>
          <p>운영진이 홈페이지 관리에서 이 영역을 자유롭게 변경할 수 있습니다.</p>
          <Link className="card-button" href="/notices">클랜 공지 보기</Link>
        </article>

        <article className="home-card custom-card">
          <div className="custom-icon">📖</div>
          <h2>인기 공략</h2>
          <p>클랜원들이 많이 보는 챔피언 공략을 확인하세요.</p>
          <Link className="card-button" href="/guides">공략 보러가기</Link>
        </article>

        <article className="home-card sponsor-card">
          <div className="custom-icon">💖</div>
          <h2>후원 목록</h2>
          <p className="sponsor-intro">
            클랜 이벤트와 운영에 도움을 주신 분들입니다.<br />
            항상 진심으로 감사드립니다. 🦀
          </p>

          <div className="sponsor-list">
            {sponsors?.length ? sponsors.map(sponsor => (
              <span key={sponsor.id}>{sponsor.display_name}</span>
            )) : <span className="muted">등록된 후원자가 없습니다.</span>}
          </div>

          <div className="sponsor-message">
            <b>후원은 전적으로 자율입니다.</b>
            <p>
              부담은 갖지 않으셔도 됩니다.<br />
              응원과 함께해 주시는 마음만으로도 저희에게는 큰 힘이 됩니다. ❤️
            </p>
            <small>바위게마을을 응원해주시는 모든 분들께 감사드립니다.</small>
          </div>
        </article>

        <article className="home-card custom-card">
          <div className="custom-icon">🦀</div>
          <h2>바위게마을 안내</h2>
          <p>운영진이 이벤트, 모집, 대회 안내 등 원하는 내용으로 설정할 수 있습니다.</p>
          <Link className="card-button" href="/schedule">자세히 보기</Link>
        </article>
      </section>
    </>
  );
}
