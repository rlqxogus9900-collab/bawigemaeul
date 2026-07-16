import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AuctionPage() {
  const db = getSupabaseAdmin();

  const { data: event } = await db
    .from("regular_match_events")
    .select("id,title,status,match_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [{ data: votes }, { data: captains }] = event
    ? await Promise.all([
        db
          .from("regular_match_votes")
          .select("member_id,member_nickname")
          .eq("event_id", event.id)
          .eq("choice", "attending"),
        db
          .from("regular_match_captains")
          .select("member_id,member_nickname")
          .eq("event_id", event.id)
      ])
    : [{ data: [] }, { data: [] }];

  const captainIds = new Set((captains || []).map(captain => captain.member_id));
  const auctionPlayers = (votes || []).filter(vote => !captainIds.has(vote.member_id));

  return (
    <>
      <section className="auction-link-hero">
        <div>
          <span>LIVE AUCTION</span>
          <h1>실시간 경매</h1>
          <p>정기내전 참가 명단에서 팀장을 제외한 선수만 경매 대상으로 표시됩니다.</p>
        </div>
        <Link className="button" href="/normal-match">정기내전 모집 보기</Link>
      </section>

      <section className="auction-sync-grid">
        <article className="card">
          <span className="auction-sync-label">LATEST EVENT</span>
          <h2>{event?.title || "정기내전 미등록"}</h2>
          <p>{event?.match_at ? new Date(event.match_at).toLocaleString("ko-KR") : "일정 없음"}</p>
          <div className="auction-sync-number">
            <small>경매 대상</small>
            <strong>{auctionPlayers.length}</strong>
            <b>명</b>
          </div>
        </article>

        <article className="card">
          <h2>팀장</h2>
          <div className="auction-roster-preview captain-preview">
            {(captains || []).map(captain => (
              <span key={captain.member_id}>⭐ {captain.member_nickname}</span>
            ))}
            {!captains?.length && <em>팀장 미지정</em>}
          </div>
        </article>
      </section>

      <section className="card auction-player-card">
        <div className="dashboard-head">
          <div>
            <span>AUCTION PLAYER ROSTER</span>
            <h2>경매 참가 선수</h2>
          </div>
          <small>팀장 자동 제외 적용</small>
        </div>

        <div className="auction-player-grid">
          {auctionPlayers.map((player, index) => (
            <div key={player.member_id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{player.member_nickname}</b>
            </div>
          ))}
          {!auctionPlayers.length && (
            <p className="muted">경매 대상 선수가 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
