import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const latestUpdate = {
  version: "1.3.8.11",
  title: "일정 관리 기능 활성화",
  summary: "일정 등록·수정·삭제와 참가·불참, 모집 현황 및 마감 표시 추가"
};


const getCachedHomeSummary = unstable_cache(
  async () => {
    const db = getSupabaseAdmin();

    const [
      { data: rules },
      { data: matches },
      { data: members },
      { data: sponsors }
    ] = await Promise.all([
      db
        .from("clan_rules")
        .select("id,content,sort_order")
        .order("sort_order", { ascending: true })
        .limit(5),
      db
        .from("regular_match_results")
        .select("winner_name,played_at,team_a_name,team_a_sets,team_b_sets,team_b_name")
        .order("played_at", { ascending: false })
        .limit(1),
      db
        .from("members")
        .select("main_line")
        .eq("is_active", true),
      db
        .from("sponsors")
        .select("id,display_name")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
        .limit(10)
    ]);

    const lineCountMap = new Map<string, number>();
    for (const member of members || []) {
      if (!member.main_line) continue;
      lineCountMap.set(
        member.main_line,
        (lineCountMap.get(member.main_line) || 0) + 1
      );
    }

    return {
      rules: rules || [],
      latest: matches?.[0] || null,
      memberCount: members?.length || 0,
      lineCounts: ["탑", "정글", "미드", "원딜", "서폿"].map(line => ({
        line,
        count: lineCountMap.get(line) || 0
      })),
      sponsors: sponsors || []
    };
  },
  ["home-summary-v13717"],
  {
    revalidate: 120,
    tags: ["home-summary"]
  }
);

async function getLatestNotices() {
  const { data } = await getSupabaseAdmin()
    .from("notices")
    .select("id,title,is_pinned,created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return data || [];
}

export default async function HomePage() {
  const [notices, summary] = await Promise.all([
    getLatestNotices(),
    getCachedHomeSummary()
  ]);

  const {
    rules,
    latest,
    memberCount,
    lineCounts,
    sponsors
  } = summary;

  const maxLine = Math.max(...lineCounts.map(item => item.count), 1);
  const totalAssigned = lineCounts.reduce((sum, item) => sum + item.count, 0);

  const winner = latest?.winner_name || "아직 등록 전";
  const playedAt = latest?.played_at
    ? new Date(latest.played_at).toLocaleDateString("ko-KR")
    : "일정 등록 전";

  return (
    <>
      <section className="new-home-hero hero-layout-v2">
        <Link href="/" className="hero-home-link" aria-label="바위게마을 홈">
          <div className="hero-copy">
            <span className="hero-eyebrow">LEAGUE OF LEGENDS CLAN</span>
            <h1>
              다 같이 즐길 수 있는<br />
              <em>바위게마을</em>
            </h1>
            <p>
              정기내전, 경매, 통계와 클랜 소식을 한곳에서 확인하는
              바위게마을 공식 공간입니다.
            </p>
          </div>

          <div className="hero-logo-area">
            <div className="hero-glow" />
            <div className="hero-logo-fixed">
              <Image
                src="/assets/crab-logo.jpg"
                alt="바위게마을"
                width={280}
                height={280}
                priority
                sizes="(max-width: 700px) 190px, 280px"
              />
            </div>
            <div className="member-count-card">
              <span>현재 클랜원</span>
              <strong>{memberCount}</strong>
              <b>명</b>
            </div>
          </div>
        </Link>

        <aside className="hero-sponsor-box">
          <div className="hero-sponsor-head">
            <div>
              <span>THANK YOU</span>
              <h2>후원 목록</h2>
            </div>
            <i>💖</i>
          </div>

          <p>클랜 이벤트와 운영에 도움을 주신 분들입니다.</p>

          <div className="hero-sponsor-list">
            {sponsors.length ? sponsors.map(sponsor => (
              <span key={sponsor.id}>{sponsor.display_name}</span>
            )) : (
              <span className="empty-copy">등록된 후원자가 없습니다.</span>
            )}
          </div>

          <small>
            후원은 전적으로 자율이며, 함께해 주시는 마음만으로도 충분합니다.
          </small>
        </aside>
      </section>

      <section className="home-quick-grid">
        <Link href="/updates" className="quick-card" prefetch={false}>
          <span>🆕</span>
          <div><small>WHAT&apos;S NEW</small><b>업데이트 내역</b><p>새로 추가된 기능 확인</p></div>
        </Link>
        <Link href="/schedule" className="quick-card" prefetch={false}>
          <span>📅</span>
          <div><small>NEXT SCHEDULE</small><b>다음 일정</b><p>클랜 일정 확인</p></div>
        </Link>
        <Link href="/hall-of-fame" className="quick-card" prefetch={false}>
          <span>🏆</span>
          <div><small>HALL OF FAME</small><b>명예의 전당</b><p>우승 기록 확인</p></div>
        </Link>
        <Link href="/stats" className="quick-card" prefetch={false}>
          <span>📊</span>
          <div><small>CLAN STATS</small><b>정기내전 통계</b><p>승률과 기록 확인</p></div>
        </Link>
      </section>

      <section className="home-dashboard-grid">
        <article className="dashboard-card notices-panel home-important-card">
          <div className="dashboard-head">
            <div><span>NOTICE</span><h2>최근 공지</h2></div>
            <Link href="/notices" prefetch={false}>전체보기</Link>
          </div>

          <div className="polished-list">
            {notices.length ? notices.map(notice => (
              <div key={notice.id}>
                <span>{notice.is_pinned ? "필독" : "공지"}</span>
                <b>{notice.title}</b>
                {Date.now() - new Date(notice.created_at).getTime() < 24 * 60 * 60 * 1000 && (
                  <i className="home-notice-new">NEW</i>
                )}
                <time>{new Date(notice.created_at).toLocaleDateString("ko-KR")}</time>
              </div>
            )) : (
              <p className="empty-copy">등록된 공지가 없습니다.</p>
            )}
          </div>
        </article>

        <article className="dashboard-card rules-panel home-important-card">
          <div className="dashboard-head">
            <div><span>CLAN RULES</span><h2>클랜 규칙</h2></div>
            <Link href="/rules" prefetch={false}>전체보기</Link>
          </div>

          <div className="rule-number-list">
            {rules.length ? rules.map((rule, index) => (
              <div key={rule.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{rule.content}</p>
              </div>
            )) : (
              <p className="empty-copy">등록된 규칙이 없습니다.</p>
            )}
          </div>
        </article>

        <article className="dashboard-card featured-winner">
          <div className="dashboard-label">RECENT WINNER</div>
          <div className="winner-showcase">
            <div className="winner-icon">🏆</div>
            <div>
              <small>{playedAt}</small>
              <h2>{winner}</h2>
              <p>
                {latest
                  ? `${latest.team_a_name} ${latest.team_a_sets} : ${latest.team_b_sets} ${latest.team_b_name}`
                  : "최근 정기내전 결과를 등록해주세요."}
              </p>
            </div>
          </div>
          <Link href="/hall-of-fame" prefetch={false}>전체 기록 보기 →</Link>
        </article>

        <Link href="/updates" className="dashboard-card latest-update-panel" prefetch={false}>
          <div className="latest-update-icon">🆕</div>
          <div className="latest-update-copy">
            <span>LATEST UPDATE</span>
            <strong>v{latestUpdate.version}</strong>
            <h2>{latestUpdate.title}</h2>
            <p>{latestUpdate.summary}</p>
            <b>업데이트 자세히 보기 →</b>
          </div>
        </Link>

        <article className="dashboard-card line-distribution-panel">
          <div className="dashboard-head">
            <div><span>MAIN POSITION DISTRIBUTION</span><h2>라인별 분포도</h2></div>
            <small>{totalAssigned}명 기준</small>
          </div>

          <div className="line-distribution-layout">
            <div className="line-donut" aria-label="라인별 분포도">
              <div className="line-donut-center">
                <strong>{totalAssigned}</strong>
                <span>라인 등록</span>
              </div>
            </div>

            <div className="modern-bars line-bars-large">
              {lineCounts.map(item => {
                const percent = totalAssigned
                  ? Math.round((item.count / totalAssigned) * 100)
                  : 0;

                return (
                  <div key={item.line}>
                    <div>
                      <b>{item.line}</b>
                      <span>{item.count}명 · {percent}%</span>
                    </div>
                    <i>
                      <em style={{ width: `${(item.count / maxLine) * 100}%` }} />
                    </i>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
