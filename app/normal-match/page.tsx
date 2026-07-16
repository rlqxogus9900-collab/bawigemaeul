import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MatchVoteButtons from "./MatchVoteButtons";

export const dynamic = "force-dynamic";

export default async function NormalMatchPage() {
  const user = await getSession();
  const db = getSupabaseAdmin();

  const { data: events } = await db
    .from("regular_match_events")
    .select(`
      id,
      title,
      description,
      match_at,
      vote_deadline,
      status,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  const eventIds = (events || []).map(event => event.id);

  const { data: votes } = eventIds.length
    ? await db
        .from("regular_match_votes")
        .select("event_id,member_id,choice,member_nickname")
        .in("event_id", eventIds)
    : { data: [] };

  const { data: captains } = eventIds.length
    ? await db
        .from("regular_match_captains")
        .select("event_id,member_id,member_nickname")
        .in("event_id", eventIds)
    : { data: [] };

  return (
    <>
      <section className="match-vote-hero">
        <div>
          <span>REGULAR MATCH</span>
          <h1>정기내전 모집</h1>
          <p>참가 여부를 선택하고, 종료된 모집의 참가 명단을 확인합니다.</p>
        </div>
        {user?.role === "staff" && (
          <Link className="button primary" href="/admin/regular-match">
            정기내전 관리
          </Link>
        )}
      </section>

      <section className="match-event-list">
        {(events || []).map(event => {
          const eventVotes = (votes || []).filter(vote => vote.event_id === event.id);
          const eventCaptains = (captains || []).filter(captain => captain.event_id === event.id);
          const myVote = eventVotes.find(vote => vote.member_id === user?.id)?.choice || "undecided";
          const counts = {
            attending: eventVotes.filter(vote => vote.choice === "attending").length,
            absent: eventVotes.filter(vote => vote.choice === "absent").length,
            undecided: eventVotes.filter(vote => vote.choice === "undecided").length
          };
          const isOpen =
            event.status === "open" &&
            (!event.vote_deadline || new Date(event.vote_deadline).getTime() > Date.now());

          return (
            <article className="card match-event-card" key={event.id}>
              <header className="match-event-head">
                <div>
                  <span className={`match-status ${isOpen ? "open" : "closed"}`}>
                    {isOpen ? "모집 중" : "모집 종료"}
                  </span>
                  <h2>{event.title}</h2>
                  <p>{event.description || "정기내전 참가 여부를 선택해주세요."}</p>
                </div>
                <div className="match-event-time">
                  <small>내전 일정</small>
                  <b>{event.match_at ? new Date(event.match_at).toLocaleString("ko-KR") : "미정"}</b>
                  <small>투표 마감</small>
                  <b>{event.vote_deadline ? new Date(event.vote_deadline).toLocaleString("ko-KR") : "미정"}</b>
                </div>
              </header>

              <div className="match-vote-counts">
                <div><span>참가</span><strong>{counts.attending}</strong></div>
                <div><span>불참</span><strong>{counts.absent}</strong></div>
                <div><span>미정</span><strong>{counts.undecided}</strong></div>
              </div>

              {user ? (
                <MatchVoteButtons
                  eventId={event.id}
                  initialChoice={myVote}
                  disabled={!isOpen}
                />
              ) : (
                <div className="match-login-notice">
                  <span>투표하려면 로그인이 필요합니다.</span>
                  <Link className="button" href="/login">로그인</Link>
                </div>
              )}

              <div className="match-roster-columns">
                <div>
                  <h3>참가 명단</h3>
                  <div className="match-name-list">
                    {eventVotes
                      .filter(vote => vote.choice === "attending")
                      .map(vote => (
                        <span key={vote.member_id}>{vote.member_nickname}</span>
                      ))}
                    {!eventVotes.some(vote => vote.choice === "attending") && <em>아직 없음</em>}
                  </div>
                </div>

                <div>
                  <h3>팀장</h3>
                  <div className="match-name-list captain-list">
                    {eventCaptains.map(captain => (
                      <span key={captain.member_id}>⭐ {captain.member_nickname}</span>
                    ))}
                    {!eventCaptains.length && <em>아직 지정되지 않음</em>}
                  </div>
                </div>
              </div>

              {!isOpen && (
                <div className="auction-ready-note">
                  경매 대상은 참가자 중 팀장을 제외한 인원입니다.
                  <b>
                    {Math.max(
                      0,
                      eventVotes.filter(vote => vote.choice === "attending").length -
                      eventCaptains.length
                    )}명
                  </b>
                </div>
              )}
            </article>
          );
        })}

        {!events?.length && (
          <div className="card match-empty">
            아직 등록된 정기내전 모집이 없습니다.
          </div>
        )}
      </section>
    </>
  );
}
