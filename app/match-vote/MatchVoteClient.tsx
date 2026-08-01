"use client";

import { useMemo, useState } from "react";
import SponsorNickname from "@/app/components/SponsorNickname";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  match_at: string | null;
  vote_deadline: string | null;
  status: "open" | "closed";
};

type Vote = {
  event_id: string;
  member_id: string;
  member_nickname: string;
  choice: "attending" | "absent" | "undecided";
};

function formatDate(value: string | null) {
  if (!value) return "미정";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

export default function MatchVoteClient({
  events,
  votes,
  currentUserId,
  isStaff
}: {
  events: EventRow[];
  votes: Vote[];
  currentUserId: string | null;
  isStaff: boolean;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const now = Date.now();
  const sorted = useMemo(() => [...events].sort((a, b) => {
    const aOpen = a.status === "open" && (!a.vote_deadline || new Date(a.vote_deadline).getTime() > now);
    const bOpen = b.status === "open" && (!b.vote_deadline || new Date(b.vote_deadline).getTime() > now);
    if (aOpen !== bOpen) return Number(bOpen) - Number(aOpen);
    return new Date(b.match_at || b.vote_deadline || 0).getTime() - new Date(a.match_at || a.vote_deadline || 0).getTime();
  }), [events, now]);

  async function submitVote(eventId: string, choice: "attending" | "undecided") {
    if (!currentUserId) {
      window.alert("로그인이 필요합니다.");
      return;
    }
    setSavingId(eventId);
    const response = await fetch(`/api/regular-match/${eventId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice })
    });
    setSavingId(null);
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.message || "투표 저장에 실패했습니다.");
      return;
    }
    window.location.reload();
  }

  async function deleteEvent(event: EventRow) {
    if (!window.confirm(`“${event.title}” 투표를 삭제하시겠습니까?\n참여 기록과 팀장 지정도 함께 삭제됩니다.`)) return;
    const response = await fetch(`/api/admin/regular-match/${event.id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.message || "삭제에 실패했습니다.");
      return;
    }
    window.location.reload();
  }

  return (
    <>
      <section className="match-vote-hero">
        <div>
          <span>REGULAR MATCH VOTE</span>
          <h1>정기내전 투표</h1>
          <p>참가 또는 미정을 선택하고 현재 참가 명단을 확인합니다.</p>
        </div>
      </section>

      <div className="match-vote-card-list">
        {sorted.map(event => {
          const eventVotes = votes.filter(vote => vote.event_id === event.id);
          const attending = eventVotes.filter(vote => vote.choice === "attending");
          const undecided = eventVotes.filter(vote => vote.choice === "undecided");
          const mine = eventVotes.find(vote => vote.member_id === currentUserId)?.choice;
          const expired = !!event.vote_deadline && new Date(event.vote_deadline).getTime() <= now;
          const isOpen = event.status === "open" && !expired;

          return (
            <article className={`match-vote-card ${isOpen ? "active" : "closed"}`} key={event.id}>
              <header className="match-vote-card-header">
                <div>
                  <div className="match-vote-status-row">
                    <span className={`match-vote-status ${isOpen ? "open" : "closed"}`}>{isOpen ? "진행 중" : "마감"}</span>
                    <span>경기 {formatDate(event.match_at)}</span>
                    <span>투표 마감 {formatDate(event.vote_deadline)}</span>
                  </div>
                  <h2>{event.title}</h2>
                  <p>{event.description || "정기내전 참가 여부를 선택해주세요."}</p>
                </div>
                {isStaff && (
                  <button className="match-vote-delete" onClick={() => deleteEvent(event)}>삭제</button>
                )}
              </header>

              <div className="match-vote-rosters">
                <section className="attending">
                  <div className="match-vote-roster-title"><span>참가</span><strong>{attending.length}명</strong></div>
                  <div className="match-vote-name-list">
                    {attending.length ? attending.map(vote => (
                      <span key={vote.member_id}><SponsorNickname nickname={vote.member_nickname} /></span>
                    )) : <p>아직 참가자가 없습니다.</p>}
                  </div>
                </section>
                <section className="undecided">
                  <div className="match-vote-roster-title"><span>미정</span><strong>{undecided.length}명</strong></div>
                  <div className="match-vote-name-list">
                    {undecided.length ? undecided.map(vote => (
                      <span key={vote.member_id}><SponsorNickname nickname={vote.member_nickname} /></span>
                    )) : <p>미정으로 선택한 인원이 없습니다.</p>}
                  </div>
                </section>
              </div>

              <footer className="match-vote-card-footer">
                <button className={`attending ${mine === "attending" ? "active" : ""}`} disabled={!isOpen || savingId === event.id} onClick={() => submitVote(event.id, "attending")}>참가</button>
                <button className={`undecided ${mine === "undecided" ? "active" : ""}`} disabled={!isOpen || savingId === event.id} onClick={() => submitVote(event.id, "undecided")}>미정</button>
              </footer>
            </article>
          );
        })}
        {!sorted.length && <div className="card match-empty">등록된 정기내전 투표가 없습니다.</div>}
      </div>
    </>
  );
}
