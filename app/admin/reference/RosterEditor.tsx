"use client";

import { useState } from "react";

type Member = {
  id: string;
  nickname: string;
  riot_id: string;
  tier: string | null;
  main_line: string | null;
  sub_line: string | null;
};

const tiers = [
  "언랭크",
  "아이언4","아이언3","아이언2","아이언1",
  "브론즈4","브론즈3","브론즈2","브론즈1",
  "실버4","실버3","실버2","실버1",
  "골드4","골드3","골드2","골드1",
  "플래티넘4","플래티넘3","플래티넘2","플래티넘1",
  "에메랄드4","에메랄드3","에메랄드2","에메랄드1",
  "다이아몬드4","다이아몬드3","다이아몬드2","다이아몬드1",
  "마스터","그랜드마스터","챌린저"
];

const lines = ["미정","탑","정글","미드","원딜","서폿"];

export default function RosterEditor({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(id: string, key: keyof Member, value: string) {
    setMembers(current =>
      current.map(member => member.id === id ? { ...member, [key]: value } : member)
    );
    setMessage("");
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/reference/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members })
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.message || "저장에 실패했습니다.");
      return;
    }

    setMessage("내전 참고 명단을 저장했습니다.");
  }

  return (
    <>
      {message && <div className={message.includes("실패") ? "error" : "flash"}>{message}</div>}

      <div className="table-wrap">
        <table className="roster-admin-table">
          <thead>
            <tr>
              <th>홈페이지 닉네임</th>
              <th>Riot ID</th>
              <th>현재 티어</th>
              <th>주라인</th>
              <th>부라인</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td><b>{member.nickname}</b></td>
                <td>{member.riot_id}</td>
                <td>
                  <select
                    value={member.tier || "언랭크"}
                    onChange={event => update(member.id, "tier", event.target.value)}
                  >
                    {tiers.map(tier => <option key={tier}>{tier}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    value={member.main_line || "미정"}
                    onChange={event => update(member.id, "main_line", event.target.value)}
                  >
                    {lines.map(line => <option key={line}>{line}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    value={member.sub_line || "미정"}
                    onChange={event => update(member.id, "sub_line", event.target.value)}
                  >
                    {lines.map(line => <option key={line}>{line}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="roster-save-bar">
        <button className="button primary" onClick={saveAll} disabled={saving}>
          {saving ? "저장 중..." : "💾 변경사항 모두 저장"}
        </button>
      </div>
    </>
  );
}
