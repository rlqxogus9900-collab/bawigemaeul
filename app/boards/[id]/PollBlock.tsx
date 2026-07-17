"use client";

import { useEffect, useMemo, useState } from "react";

type Option = {
  id: string;
  label: string;
  vote_count: number;
};

function formatDateTime(value: string | null) {
  if (!value) return "미정";
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function remainingText(deadline: string | null, now: number) {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - now;
  if (diff <= 0) return "마감됨";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${mins}분 남음`;
  return `${mins}분 남음`;
}

export default function PollBlock({
  postId,
  pollId,
  pollType,
  options,
  selectedOptionIds,
  allowMultiple,
  disabled,
  loggedIn,
  isAuctionSource,
  matchAt,
  voteDeadline,
  isStaff
}: {
  postId: string;
  pollId: string;
  pollType: "general" | "regular_match";
  options: Option[];
  selectedOptionIds: string[];
  allowMultiple: boolean;
  disabled: boolean;
  loggedIn: boolean;
  isAuctionSource: boolean;
  matchAt: string | null;
  voteDeadline: string | null;
  isStaff: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(selectedOptionIds);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const deadlineReached = useMemo(
    () => Boolean(voteDeadline && new Date(voteDeadline).getTime() <= now),
    [voteDeadline, now]
  );

  const actuallyDisabled = disabled || deadlineReached;
  const total = options.reduce(
    (sum, option) => sum + Number(option.vote_count || 0),
    0
  );

  async function vote(optionId: string) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    if (actuallyDisabled || saving) return;

    const next = allowMultiple
      ? selected.includes(optionId)
        ? selected.filter(id => id !== optionId)
        : [...selected, optionId]
      : [optionId];

    setSaving(true);
    const response = await fetch(`/api/boards/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: next, postId })
    });
    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      window.alert(result?.message || "투표 저장에 실패했습니다.");
      return;
    }

    setSelected(next);
    window.location.reload();
  }

  async function setStatus(status: "open" | "closed") {
    const response = await fetch(`/api/admin/polls/${pollId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      window.alert("투표 상태 변경에 실패했습니다.");
      return;
    }

    window.location.reload();
  }

  return (
    <section className={`board-poll-block ${pollType}`}>
      <header>
        <div>
          <span>{pollType === "regular_match" ? "REGULAR MATCH POLL" : "POLL"}</span>
          <h2>{pollType === "regular_match" ? "정기내전 참가 투표" : "투표"}</h2>
        </div>

        <div className="poll-state-badges">
          {allowMultiple && <b>복수 선택</b>}
          {isAuctionSource && <b className="auction-source">경매 연동 중</b>}
          {actuallyDisabled && <b className="closed">🔒 투표 종료</b>}
        </div>
      </header>

      {pollType === "regular_match" && (
        <div className="regular-poll-schedule">
          <div>
            <span>내전 일정</span>
            <b>{formatDateTime(matchAt)}</b>
          </div>
          <div>
            <span>투표 마감</span>
            <b>{formatDateTime(voteDeadline)}</b>
          </div>
          <div className={deadlineReached ? "expired" : ""}>
            <span>남은 시간</span>
            <b>{remainingText(voteDeadline, now)}</b>
          </div>
        </div>
      )}

      <div className="poll-option-list">
        {options.map(option => {
          const active = selected.includes(option.id);
          const percent = total
            ? Math.round((option.vote_count / total) * 100)
            : 0;

          return (
            <button
              type="button"
              key={option.id}
              className={active ? "active" : ""}
              onClick={() => vote(option.id)}
              disabled={actuallyDisabled || saving}
            >
              <div>
                <strong>{option.label}</strong>
                <span>{option.vote_count}표 · {percent}%</span>
              </div>
              <i style={{ width: `${percent}%` }} />
            </button>
          );
        })}
      </div>

      <footer>
        <span>총 {total}표</span>
        {pollType === "regular_match" && (
          <span>참가 선택자 중 팀장은 경매에서 자동 제외됩니다.</span>
        )}
      </footer>

      {isStaff && (
        <div className="poll-staff-controls">
          <button
            type="button"
            className="button"
            onClick={() => setStatus("open")}
          >
            투표 재개
          </button>
          <button
            type="button"
            className="button danger"
            onClick={() => setStatus("closed")}
          >
            즉시 마감
          </button>
        </div>
      )}
    </section>
  );
}
