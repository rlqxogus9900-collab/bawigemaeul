import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AuctionPage() {
  const db = getSupabaseAdmin();

  const { data: poll } = await db
    .from("board_polls")
    .select(`
      id,
      post_id,
      match_at,
      board_posts (title)
    `)
    .eq("poll_type", "regular_match")
    .eq("is_auction_source", true)
    .maybeSingle();

  const { data: attendingOption } = poll
    ? await db
        .from("board_poll_options")
        .select("id")
        .eq("poll_id", poll.id)
        .eq("label", "참가")
        .maybeSingle()
    : { data: null };

  const { data: votes } = attendingOption
    ? await db
        .from("board_poll_votes")
        .select("member_id,member_nickname")
        .eq("poll_id", poll!.id)
        .eq("option_id", attendingOption.id)
    : { data: [] };

  const { data: captains } = poll
    ? await db
        .from("board_poll_captains")
        .select("member_id,member_nickname")
        .eq("poll_id", poll.id)
    : { data: [] };

  const captainIds = new Set((captains || []).map(item => item.member_id));
  const players = (votes || []).filter(item => !captainIds.has(item.member_id));
  const linkedPost = Array.isArray(poll?.board_posts)
    ? poll.board_posts[0]
    : poll?.board_posts;

  return (
    <>
      <section className="auction-link-hero">
        <div>
          <span>LIVE AUCTION</span>
          <h1>실시간 경매</h1>
          <p>관리자가 선택한 정기내전 투표의 참가자에서 팀장을 제외한 명단입니다.</p>
        </div>
        <Link className="button" href="/admin/polls">투표 연동 관리</Link>
      </section>

      <section className="auction-sync-grid">
        <article className="card">
          <span className="auction-sync-label">AUCTION SOURCE</span>
          <h2>{linkedPost?.title || "경매 연동 투표 미선택"}</h2>
          <p>{poll?.match_at ? new Date(poll.match_at).toLocaleString("ko-KR") : "일정 없음"}</p>
          <div className="auction-sync-number">
            <small>경매 대상</small>
            <strong>{players.length}</strong>
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
          <small>팀장 자동 제외</small>
        </div>

        <div className="auction-player-grid">
          {players.map((player, index) => (
            <div key={player.member_id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{player.member_nickname}</b>
            </div>
          ))}
          {!players.length && <p className="muted">경매 대상 선수가 없습니다.</p>}
        </div>
      </section>
    </>
  );
}
