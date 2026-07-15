import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getSupabaseAdmin();
  const [{ data: notices }, { data: rules }, { data: matches }] = await Promise.all([
    db.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(4),
    db.from("clan_rules").select("*").order("sort_order").limit(3),
    db.from("regular_match_results").select("*").order("played_at", { ascending: false }).limit(1)
  ]);
  const latest = matches?.[0];

  return (
    <>
      <section className="home-hero">
        <div><small>BAWIGEMAEUL CLAN</small><h1>바위게마을</h1><p>함께 승리하는 우리들의 마을.</p></div>
        <img src="/assets/crab-logo.jpg" alt="바위게마을" />
      </section>
      <section className="home-grid">
        <article className="home-card">
          <div className="card-head"><h2>📢 공지사항</h2><Link href="/notices">전체 보기</Link></div>
          <div className="home-list">
            {notices?.length ? notices.map(n => <div key={n.id}><span>{n.is_pinned ? "📌" : "•"}</span><b>{n.title}</b></div>) : <p className="muted">등록된 공지가 없습니다.</p>}
          </div>
        </article>
        <article className="home-card rules-card">
          <div className="card-head"><h2>📜 클랜 규칙</h2><Link href="/rules">전체 보기</Link></div>
          <div className="rule-preview">
            {rules?.length ? rules.map((r,i) => <div key={r.id}><em>{i+1}</em><span>{r.content}</span></div>) : <p className="muted">등록된 규칙이 없습니다.</p>}
          </div>
        </article>
        <article className="home-card match-card">
          <div className="card-head"><h2>🏆 최근 정기내전 결과</h2><Link href="/stats">통계 보기</Link></div>
          {latest ? <div className="match-result">
            <div><b>{latest.team_a_name}</b><strong>{latest.team_a_sets}</strong></div><span>:</span>
            <div><strong>{latest.team_b_sets}</strong><b>{latest.team_b_name}</b></div><p>{latest.winner_name} 승리</p>
          </div> : <p className="muted">등록된 결과가 없습니다.</p>}
        </article>
        <article className="home-card custom-card"><div className="custom-icon">⭐</div><h2>바위게마을 소식</h2><p>대회, 이벤트, 모집 안내를 운영진이 설정할 수 있는 홈 카드입니다.</p><Link className="card-button" href="/notices">클랜 공지 보기</Link></article>
        <article className="home-card custom-card"><div className="custom-icon">📖</div><h2>인기 공략</h2><p>클랜원들이 자주 찾는 챔피언 공략을 확인하세요.</p><Link className="card-button" href="/guides">공략 보러가기</Link></article>
        <article className="home-card custom-card"><div className="custom-icon">🦀</div><h2>바위게마을 안내</h2><p>온라인 버전에 V6.2.8 기능을 순서대로 이식하고 있습니다.</p><Link className="card-button" href="/schedule">일정 확인</Link></article>
      </section>
    </>
  );
}
