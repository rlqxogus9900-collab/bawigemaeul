"use client";

import { useState } from "react";

type Member = {
  id: string;
  nickname: string;
  riot_id: string;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  reference_note: string | null;
};

const lines = ["미정","ALL","탑","정글","미드","원딜","서폿"];

export default function RosterEditor({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(id: string, key: keyof Member, value: string | number | null) {
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
        <table className="roster-admin-table roster-admin-table-v2">
          <thead>
            <tr>
              <th>홈페이지 닉네임</th>
              <th>Riot ID</th>
              <th>내전 티어</th>
              <th>주라인</th>
              <th>부라인</th>
              <th>참고사항</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td><b>{member.nickname}</b></td>
                <td>{member.riot_id}</td>
                <td>
                  <select
                    value={member.match_tier || 0}
                    onChange={event => update(member.id, "match_tier", Number(event.target.value) || null)}
                  >
                    <option value={0}>미정</option>
                    <option value={1}>1티어</option>
                    <option value={2}>2티어</option>
                    <option value={3}>3티어</option>
                    <option value={4}>4티어</option>
                    <option value={5}>5티어</option>
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
                <td>
                  <textarea
                    value={member.reference_note || ""}
                    placeholder="예: 원딜 주포지션, 탑 가능 / 팀장 제외"
                    onChange={event => update(member.id, "reference_note", event.target.value)}
                    rows={2}
                  />
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
