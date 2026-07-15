import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getSupabaseAdmin();
  const [{ data: notices }, { data: rules }, { data: matches }] = await Promise.all([
    db.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
    db.from("clan_rules").select("*").order("sort_order").limit(3),
    db.from("regular_match_results").select("*").order("played_at", { ascending: false }).limit(1)
  ]);
  const latest = matches?.[0];

  return (
    <>
      <section className="hero">
        <small>BAWIGEMAEUL CLAN</small>
        <h1>바위게마을</h1>
        <p>함께 승리하는 우리들의 마을.</p>
      </section>
      <section className="grid grid-3">
        <article className="card">
          <h3>📢 공지사항</h3>
          {notices?.length ? notices.map(n => <p key={n.id}>{n.is_pinned ? "📌 " : ""}{n.title}</p>) : <p className="muted">등록된 공지가 없습니다.</p>}
        </article>
        <article className="card">
          <h3>📜 클랜 규칙</h3>
          {rules?.length ? rules.map((r,i) => <p key={r.id}>{i+1}. {r.content}</p>) : <p className="muted">등록된 규칙이 없습니다.</p>}
        </article>
        <article className="card">
          <h3>🏆 최근 정기내전 결과</h3>
          {latest ? <><h2>{latest.team_a_name} {latest.team_a_sets} : {latest.team_b_sets} {latest.team_b_name}</h2><p>{latest.winner_name} 승리</p></> : <p className="muted">등록된 결과가 없습니다.</p>}
        </article>
      </section>
    </>
  );
}
