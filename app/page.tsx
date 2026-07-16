import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

const getHomeData = unstable_cache(
  async () => {
    const db = getSupabaseAdmin();

    const [
      { data: notices },
      { data: rules },
      { data: matches },
      { data: members },
      { data: sponsors }
    ] = await Promise.all([
      db.from("notices").select("id,title,is_pinned,created_at").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
      db.from("clan_rules").select("id,content,sort_order").order("sort_order").limit(4),
      db.from("regular_match_results").select("*").order("played_at", { ascending: false }).limit(1),
      db.from("members").select("id,nickname,main_line,is_active,activity_status").eq("is_active", true),
      db.from("sponsors").select("id,display_name").eq("is_visible", true).order("sort_order", { ascending: true }).limit(10)
    ]);

    return {
      notices: notices || [],
      rules: rules || [],
      latest: matches?.[0] || null,
      members: members || [],
      sponsors: sponsors || []
    };
  },
  ["home-dashboard-v2"],
  { revalidate: 60, tags: ["home-dashboard"] }
);

export default async function HomePage() {
  const { notices, rules, latest, members, sponsors } = await getHomeData();

  const activeMembers = members.filter(member => member.activity_status === "active").length;
  const lineCounts = ["탑", "정글", "미드", "원딜", "서폿"].map(line => ({
    line,
    count: members.filter(member => member.main_line === line).length
  }));
  const maxLine = Math.max(...lineCounts.map(item => item.count), 1);

  const winner = latest?.winner_name || "아직 등록 전";
  const playedAt = latest?.played_at
    ? new Date(latest.played_at).toLocaleDateString("ko-KR")
    : "일정 등록 전";

  return (
    <>
      <section className="new-home-hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">LEAGUE OF LEGENDS CLAN</span>
          <h1>
            같이 즐기고,<br />
            같이 강해지는 <em>바위게마을</em>
          </h1>
          <p>
            정기내전, 경매, 통계와 클랜 소식을 한곳에서 확인하는
            바위게마을 공식 공간입니다.
          </p>
          <div className="hero-actions">
            <Link href="/reference" className="hero-primary" prefetch>내전 참고 명단</Link>
            <Link href="/updates" className="hero-secondary" prefetch>최근 업데이트</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-glow" />
          <img src="/assets/crab-logo.jpg" alt="바위게마을" />
          <div className="hero-floating-stat stat-one">
            <span>클랜원</span><b>{members.length}명</b>
          </div>
          <div className="hero-floating-stat stat-two">
            <span>활동 중</span><b>{activeMembers}명</b>
          </div>
        </div>
      </section>

      <section className="home-quick-grid">
        <Link href="/updates" className="quick-card update" prefetch>
          <span>🆕</span><div><small>WHAT'S NEW</small><b>업데이트 내역</b><p>새로 추가된 기능 확인</p></div>
        </Link>
        <Link href="/schedule" className="quick-card schedule" prefetch>
          <span>📅</span><div><small>NEXT SCHEDULE</small><b>다음 일정</b><p>클랜 일정 확인</p></div>
        </Link>
        <Link href="/hall-of-fame" className="quick-card hall" prefetch>
          <span>🏆</span><div><small>HALL OF FAME</small><b>명예의 전당</b><p>우승 기록 확인</p></div>
        </Link>
        <Link href="/stats" className="quick-card stats" prefetch>
          <span>📊</span><div><small>CLAN STATS</small><b>정기내전 통계</b><p>승률과 기록 확인</p></div>
        </Link>
      </section>

      <section className="home-dashboard-grid">
        <article className="dashboard-card featured-winner">
          <div className="dashboard-label">RECENT WINNER</div>
          <div className="winner-showcase">
            <div className="winner-icon">🏆</div>
            <div>
              <small>{playedAt}</small>
              <h2>{winner}</h2>
              <p>{latest ? `${latest.team_a_name} ${latest.team_a_sets} : ${latest.team_b_sets} ${latest.team_b_name}` : "최근 정기내전 결과를 등록해주세요."}</p>
            </div>
          </div>
          <Link href="/hall-of-fame" prefetch>전체 기록 보기 →</Link>
        </article>

        <article className="dashboard-card notices-panel">
          <div className="dashboard-head">
            <div><span>NOTICE</span><h2>최근 공지</h2></div>
            <Link href="/notices" prefetch>전체보기</Link>
          </div>
          <div className="polished-list">
            {notices.length ? notices.map(notice => (
              <div key={notice.id}>
                <span>{notice.is_pinned ? "필독" : "공지"}</span>
                <b>{notice.title}</b>
                <time>{new Date(notice.created_at).toLocaleDateString("ko-KR")}</time>
              </div>
            )) : <p className="empty-copy">등록된 공지가 없습니다.</p>}
          </div>
        </article>

        <article className="dashboard-card line-panel">
          <div className="dashboard-head">
            <div><span>MAIN POSITION</span><h2>주라인 현황</h2></div>
            <small>{members.length}명 기준</small>
          </div>
          <div className="modern-bars">
            {lineCounts.map(item => (
              <div key={item.line}>
                <div><b>{item.line}</b><span>{item.count}명</span></div>
                <i><em style={{ width: `${(item.count / maxLine) * 100}%` }} /></i>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card rules-panel">
          <div className="dashboard-head">
            <div><span>CLAN RULES</span><h2>클랜 규칙</h2></div>
            <Link href="/rules" prefetch>전체보기</Link>
          </div>
          <div className="rule-number-list">
            {rules.length ? rules.map((rule, index) => (
              <div key={rule.id}><span>{String(index + 1).padStart(2, "0")}</span><p>{rule.content}</p></div>
            )) : <p className="empty-copy">등록된 규칙이 없습니다.</p>}
          </div>
        </article>

        <article className="dashboard-card sponsor-panel">
          <div className="dashboard-head">
            <div><span>THANK YOU</span><h2>후원 목록</h2></div>
            <span>💖</span>
          </div>
          <p className="sponsor-copy">클랜 이벤트와 운영에 도움을 주신 분들입니다.</p>
          <div className="polished-sponsors">
            {sponsors.length ? sponsors.map(sponsor => (
              <span key={sponsor.id}>{sponsor.display_name}</span>
            )) : <span className="empty-copy">등록된 후원자가 없습니다.</span>}
          </div>
          <small>후원은 전적으로 자율이며, 함께해 주시는 마음만으로도 충분합니다.</small>
        </article>

        <article className="dashboard-card activity-panel">
          <div className="dashboard-label">CLAN STATUS</div>
          <div className="activity-big">
            <strong>{activeMembers}</strong>
            <span>현재 활동 인원</span>
          </div>
          <div className="activity-meta">
            <div><b>{members.length}</b><span>전체 클랜원</span></div>
            <div><b>{members.length - activeMembers}</b><span>비활동</span></div>
          </div>
        </article>
      </section>
    </>
  );
}
