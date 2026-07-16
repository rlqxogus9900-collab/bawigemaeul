"use client";

import { useState } from "react";

type Choice = "attending" | "absent" | "undecided";

const labels: Record<Choice, string> = {
  attending: "참가",
  absent: "불참",
  undecided: "미정"
};

export default function MatchVoteButtons({
  eventId,
  initialChoice,
  disabled
}: {
  eventId: string;
  initialChoice: Choice;
  disabled: boolean;
}) {
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [saving, setSaving] = useState(false);

  async function vote(nextChoice: Choice) {
    if (disabled || saving) return;
    setSaving(true);

    const response = await fetch(`/api/regular-match/${eventId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: nextChoice })
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      window.alert(result?.message || "투표 저장에 실패했습니다.");
      return;
    }

    setChoice(nextChoice);
    window.location.reload();
  }

  return (
    <div className="match-vote-buttons">
      {(["attending", "absent", "undecided"] as Choice[]).map(item => (
        <button
          key={item}
          type="button"
          className={`${item} ${choice === item ? "active" : ""}`}
          disabled={disabled || saving}
          onClick={() => vote(item)}
        >
          <span>{item === "attending" ? "✓" : item === "absent" ? "×" : "?"}</span>
          <b>{labels[item]}</b>
        </button>
      ))}
    </div>
  );
}
