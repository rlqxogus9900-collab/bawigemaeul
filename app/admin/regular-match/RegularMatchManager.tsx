"use client";
import SponsorNickname from "@/app/components/SponsorNickname";

import { useMemo, useState } from "react";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  match_at: string | null;
  vote_deadline: string | null;
  status: "open" | "closed";
};

type Member = {
  id: string;
  nickname: string;
  riot_id: string;
  match_tier: number | null;
  main_line: string | null;
};

type Vote = {
  event_id: string;
  member_id: string;
  member_nickname: string;
  choice: "attending" | "absent" | "undecided";
};

type Captain = {
  event_id: string;
  member_id: string;
  member_nickname: string;
  team_name: string | null;
};

export default function RegularMatchManager({
  events,
  members,
  votes,
  captains
}: {
  events: EventRow[];
  members: Member[];
  votes: Vote[];
  captains: Captain[];
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const selectedEvent = events.find(event => event.id === selectedEventId);
  const eventVotes = votes.filter(vote => vote.event_id === selectedEventId);
  const attending = eventVotes.filter(vote => vote.choice === "attending");
  const eventCaptains = captains.filter(captain => captain.event_id === selectedEventId);
  const captainIds = new Set(eventCaptains.map(captain => captain.member_id));

  const auctionRoster = useMemo(
    () => attending.filter(vote => !captainIds.has(vote.member_id)),
    [attending, eventCaptains]
  );

  async function createEvent(formData: FormData) {
    setSaving(true);
    const response = await fetch("/api/admin/regular-match", {
      method: "POST",
      body: formData
    });
    setSaving(false);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.message || "정기내전 생성에 실패했습니다.");
      return;
    }

    window.location.reload();
  }

  async function setStatus(status: "open" | "closed") {
    if (!selectedEventId) return;
    const response = await fetch(`/api/admin/regular-match/${selectedEventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      window.alert("상태 변경에 실패했습니다.");
      return;
    }
    window.location.reload();
  }

  async function toggleCaptain(member: Member) {
    if (!selectedEventId) return;
    const isCaptain = captainIds.has(member.id);

    const response = await fetch(
      `/api/admin/regular-match/${selectedEventId}/captains`,
      {
        method: isCaptain ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id })
      }
    );

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.message || "팀장 변경에 실패했습니다.");
      return;
    }

    window.location.reload();
  }

  return (
    <>
      <section className="card regular-match-create">
        <div className="member-page-head">
          <div>
            <span>STAFF ONLY</span>
            <h1>정기내전 관리</h1>
            <p className="muted">모집을 생성하고 참가자와 팀장을 관리합니다.</p>
          </div>
        </div>

        <form action={createEvent} className="regular-match-create-form">
          <input name="title" required placeholder="예: 7월 3주차 정기내전" />
          <input name="match_at" type="datetime-local" required />
          <input name="vote_deadline" type="datetime-local" required />
          <textarea name="description" rows={3} placeholder="안내사항" />
          <button className="button primary" disabled={saving}>
            {saving ? "생성 중..." : "정기내전 모집 생성"}
          </button>
        </form>
      </section>

      <section className="card regular-match-admin-card">
        <div className="regular-match-admin-toolbar">
          <select
            value={selectedEventId}
            onChange={event => setSelectedEventId(event.target.value)}
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} · {event.status === "open" ? "모집 중" : "종료"}
              </option>
            ))}
          </select>

          {selectedEvent && (
            <div>
              <button className="button" onClick={() => setStatus("open")}>
                모집 재개
              </button>
              <button className="button danger" onClick={() => setStatus("closed")}>
                모집 종료
              </button>
            </div>
          )}
        </div>

        {selectedEvent ? (
          <div className="regular-match-admin-grid">
            <div className="regular-match-panel">
              <h2>참가 명단 <b>{attending.length}</b></h2>
              <div className="regular-match-member-list">
                {attending.map(vote => {
                  const member = members.find(item => item.id === vote.member_id);
                  const isCaptain = captainIds.has(vote.member_id);

                  return (
                    <article key={vote.member_id}>
                      <div>
                        <strong><SponsorNickname nickname={vote.member_nickname} /></strong>
                        <span>
                          {member?.main_line || "라인 미정"} ·
                          {member?.match_tier ? ` ${member.match_tier}티어` : " 티어 미정"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`button ${isCaptain ? "danger" : ""}`}
                        onClick={() => member && toggleCaptain(member)}
                      >
                        {isCaptain ? "팀장 해제" : "팀장 지정"}
                      </button>
                    </article>
                  );
                })}
                {!attending.length && <p className="muted">참가자가 없습니다.</p>}
              </div>
            </div>

            <div className="regular-match-panel">
              <h2>경매 대상 <b>{auctionRoster.length}</b></h2>
              <p className="muted">참가자 중 팀장을 자동으로 제외한 명단입니다.</p>
              <div className="auction-roster-preview">
                {auctionRoster.map(vote => (
                  <span key={vote.member_id}><SponsorNickname nickname={vote.member_nickname} /></span>
                ))}
                {!auctionRoster.length && <em>경매 대상 없음</em>}
              </div>

              <h3>지정된 팀장</h3>
              <div className="auction-roster-preview captain-preview">
                {eventCaptains.map(captain => (
                  <span key={captain.member_id}>⭐ <SponsorNickname nickname={captain.member_nickname} /></span>
                ))}
                {!eventCaptains.length && <em>팀장 미지정</em>}
              </div>
            </div>
          </div>
        ) : (
          <div className="match-empty">먼저 정기내전 모집을 생성해주세요.</div>
        )}
      </section>
    </>
  );
}
