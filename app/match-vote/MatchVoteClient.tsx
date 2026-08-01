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

type MemberProfile = {
  id: string;
  nickname: string;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  reference_note: string | null;
};

type Vote = {
  event_id: string;
  member_id: string;
  member_nickname: string;
  choice: "attending" | "absent" | "undecided";
};


function tierLabel(value: number | null | undefined) {
  const roman = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"];
  return value && roman[value] ? `${roman[value]}티어` : "미정";
}

function MemberVoteName({ vote, profile }: { vote: Vote; profile?: MemberProfile }) {
  return (
    <button type="button" className="match-vote-member-trigger" aria-label={`${vote.member_nickname} 상세 정보`}>
      <SponsorNickname nickname={vote.member_nickname} />
      <span className="match-vote-member-tooltip" role="tooltip">
        <strong>{vote.member_nickname}</strong>
        <span><b>내전티어</b><em>{tierLabel(profile?.match_tier)}</em></span>
        <span><b>주라인</b><em>{profile?.main_line || "미정"}</em></span>
        <span><b>부라인</b><em>{profile?.sub_line || "미정"}</em></span>
        <span className="note"><b>참고사항</b><em>{profile?.reference_note || "없음"}</em></span>
      </span>
    </button>
  );
}

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
  isStaff,
  memberProfiles
}: {
  events: EventRow[];
  votes: Vote[];
  currentUserId: string | null;
  isStaff: boolean;
  memberProfiles: MemberProfile[];
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMatchAt, setEditMatchAt] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const now = Date.now();
  const profileById = useMemo(() => new Map(memberProfiles.map(profile => [profile.id, profile])), [memberProfiles]);
  const sorted = useMemo(() => [...events].sort((a, b) => {
    const aOpen = a.status === "open" && (!a.vote_deadline || new Date(a.vote_deadline).getTime() > now);
    const bOpen = b.status === "open" && (!b.vote_deadline || new Date(b.vote_deadline).getTime() > now);
    if (aOpen !== bOpen) return Number(bOpen) - Number(aOpen);
    return new Date(b.match_at || b.vote_deadline || 0).getTime() - new Date(a.match_at || a.vote_deadline || 0).getTime();
  }), [events, now]);


  function toLocalInput(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function openEdit(event: EventRow) {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditMatchAt(toLocalInput(event.match_at));
    setEditDeadline(toLocalInput(event.vote_deadline));
  }

  async function saveEdit() {
    if (!editingEvent || !editTitle.trim() || !editMatchAt || !editDeadline) {
      window.alert("제목, 경기 시간, 투표 마감 시간을 입력해주세요.");
      return;
    }
    setSavingId(editingEvent.id);
    const response = await fetch(`/api/admin/regular-match/${editingEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDescription, matchAt: editMatchAt, voteDeadline: editDeadline })
    });
    setSavingId(null);
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.message || "투표 수정에 실패했습니다.");
      return;
    }
    setEditingEvent(null);
    window.location.reload();
  }

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
                  <div className="match-vote-staff-actions">
                    <button className="button" onClick={() => openEdit(event)}>수정</button>
                    <button className="match-vote-delete" onClick={() => deleteEvent(event)}>삭제</button>
                  </div>
                )}
              </header>

              <div className="match-vote-rosters">
                <section className="attending">
                  <div className="match-vote-roster-title"><span>참가</span><strong>{attending.length}명</strong></div>
                  <div className="match-vote-name-list">
                    {attending.length ? attending.map(vote => (
                      <span key={vote.member_id}><MemberVoteName vote={vote} profile={profileById.get(vote.member_id)} /></span>
                    )) : <p>아직 참가자가 없습니다.</p>}
                  </div>
                </section>
                <section className="undecided">
                  <div className="match-vote-roster-title"><span>미정</span><strong>{undecided.length}명</strong></div>
                  <div className="match-vote-name-list">
                    {undecided.length ? undecided.map(vote => (
                      <span key={vote.member_id}><MemberVoteName vote={vote} profile={profileById.get(vote.member_id)} /></span>
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

      {editingEvent && (
        <div className="match-vote-edit-backdrop" onClick={() => setEditingEvent(null)}>
          <section className="card match-vote-edit-modal" onClick={event => event.stopPropagation()}>
            <h2>정기내전 투표 수정</h2>
            <input value={editTitle} onChange={event => setEditTitle(event.target.value)} placeholder="투표 제목" />
            <label>경기 시간<input type="datetime-local" value={editMatchAt} onChange={event => setEditMatchAt(event.target.value)} /></label>
            <label>투표 마감 시간<input type="datetime-local" value={editDeadline} onChange={event => setEditDeadline(event.target.value)} /></label>
            <textarea rows={4} value={editDescription} onChange={event => setEditDescription(event.target.value)} placeholder="안내사항" />
            <div>
              <button className="button primary" disabled={savingId === editingEvent.id} onClick={saveEdit}>수정 저장</button>
              <button className="button" onClick={() => setEditingEvent(null)}>취소</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
