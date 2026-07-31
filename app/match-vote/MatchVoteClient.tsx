"use client";

import { useMemo, useState } from "react";

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
    return Number(bOpen) - Number(aOpen);
  }), [events]);

  async function submitVote(eventId: string, choice: Vote["choice"]) {
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
    if (!window.confirm(`“${event.title}” 투표를 삭제하시겠습니까?`)) return;
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
          <p>관리자가 만든 정기내전 투표에 참가 여부를 선택합니다.</p>
        </div>
      </section>

      <div className="poll-admin-list poll-admin-list-v2">
        {sorted.map(event => {
          const eventVotes = votes.filter(vote => vote.event_id === event.id);
          const attending = eventVotes.filter(vote => vote.choice === "attending");
          const absent = eventVotes.filter(vote => vote.choice === "absent");
          const undecided = eventVotes.filter(vote => vote.choice === "undecided");
          const mine = eventVotes.find(vote => vote.member_id === currentUserId)?.choice;
          const expired = !!event.vote_deadline && new Date(event.vote_deadline).getTime() <= now;
          const isOpen = event.status === "open" && !expired;

          return (
            <article className={isOpen ? "active" : ""} key={event.id}>
              <div className="poll-admin-main">
                <p>{isOpen ? "진행 중" : "마감"} · 경기 {formatDate(event.match_at)} · 투표 마감 {formatDate(event.vote_deadline)}</p>
                <h2>{event.title}</h2>
                <p>{event.description || "정기내전 참가 여부를 선택해주세요."}</p>
                <div className="match-vote-counts">
                  <div><span>참가</span><strong>{attending.length}</strong></div>
                  <div><span>불참</span><strong>{absent.length}</strong></div>
                  <div><span>미정</span><strong>{undecided.length}</strong></div>
                </div>
                <div className="match-vote-buttons">
                  <button className={`attending ${mine === "attending" ? "active" : ""}`} disabled={!isOpen || savingId === event.id} onClick={() => submitVote(event.id, "attending")}>참가</button>
                  <button className={`absent ${mine === "absent" ? "active" : ""}`} disabled={!isOpen || savingId === event.id} onClick={() => submitVote(event.id, "absent")}>불참</button>
                  <button className={mine === "undecided" ? "active" : ""} disabled={!isOpen || savingId === event.id} onClick={() => submitVote(event.id, "undecided")}>미정</button>
                </div>
              </div>
              {isStaff && (
                <div className="poll-admin-actions">
                  <button className="button danger" onClick={() => deleteEvent(event)}>삭제</button>
                </div>
              )}
            </article>
          );
        })}
        {!sorted.length && <div className="card match-empty">등록된 정기내전 투표가 없습니다.</div>}
      </div>
    </>
  );
}
