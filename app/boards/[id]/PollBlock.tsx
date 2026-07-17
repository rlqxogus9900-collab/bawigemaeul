"use client";

import { useState } from "react";

type Option = {
  id: string;
  label: string;
  vote_count: number;
};

export default function PollBlock({
  postId,
  pollId,
  pollType,
  options,
  selectedOptionIds,
  allowMultiple,
  disabled,
  loggedIn,
  isAuctionSource
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
}) {
  const [selected, setSelected] = useState<string[]>(selectedOptionIds);
  const [saving, setSaving] = useState(false);

  async function vote(optionId: string) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    if (disabled || saving) return;

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

  const total = options.reduce((sum, option) => sum + Number(option.vote_count || 0), 0);

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
          {disabled && <b className="closed">종료</b>}
        </div>
      </header>

      <div className="poll-option-list">
        {options.map(option => {
          const active = selected.includes(option.id);
          const percent = total ? Math.round((option.vote_count / total) * 100) : 0;

          return (
            <button
              type="button"
              key={option.id}
              className={active ? "active" : ""}
              onClick={() => vote(option.id)}
              disabled={disabled || saving}
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
        총 {total}표
        {pollType === "regular_match" && <span>참가 선택자 중 팀장은 경매에서 자동 제외됩니다.</span>}
      </footer>
    </section>
  );
}
