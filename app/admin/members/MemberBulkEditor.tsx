"use client";

import { useMemo, useState } from "react";

type MemberRow = {
  id: string;
  nickname: string;
  riot_id: string;
  current_tier: string | null;
  highest_tier: string | null;
  average_tier: string | null;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  role: "member" | "staff";
  activity_status: string | null;
  activity_excluded: boolean;
  is_active: boolean;
};

const lines = ["미정", "탑", "정글", "미드", "원딜", "서폿"];

export default function MemberBulkEditor({
  initialMembers,
  currentUserId
}: {
  initialMembers: MemberRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row =>
      row.nickname.toLowerCase().includes(q) ||
      row.riot_id.toLowerCase().includes(q)
    );
  }, [rows, search]);

  function updateRow(id: string, field: keyof MemberRow, value: string | number | boolean | null) {
    setRows(current => current.map(row => row.id === id ? { ...row, [field]: value } : row));
    setMessage("");
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/members/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: rows })
    });

    const result = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.message || "저장에 실패했습니다.");
      return;
    }

    setMessage("명단 설정을 모두 저장했습니다.");
  }

  return (
    <>
      <div className="member-bulk-toolbar">
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="닉네임 또는 Riot ID 검색"
        />
        <span className="muted">총 {rows.length}명</span>
      </div>

      {message && <div className={message.includes("실패") ? "error" : "flash"}>{message}</div>}

      <div className="table-wrap">
        <table className="member-settings-table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>Riot ID</th>
              <th>현재티어</th>
              <th>최고티어</th>
              <th>평균티어</th>
              <th>내전티어</th>
              <th>주라인</th>
              <th>부라인</th>
              <th>권한</th>
              <th>활동여부</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.id}>
                <td><input value={row.nickname} onChange={e => updateRow(row.id, "nickname", e.target.value)} /></td>
                <td><input value={row.riot_id} onChange={e => updateRow(row.id, "riot_id", e.target.value)} /></td>
                <td><input value={row.current_tier || ""} placeholder="예: 다이아4" onChange={e => updateRow(row.id, "current_tier", e.target.value)} /></td>
                <td><input value={row.highest_tier || ""} placeholder="예: 다이아1" onChange={e => updateRow(row.id, "highest_tier", e.target.value)} /></td>
                <td><input value={row.average_tier || ""} placeholder="예: 에메랄드2" onChange={e => updateRow(row.id, "average_tier", e.target.value)} /></td>
                <td>
                  <select value={row.match_tier || 0} onChange={e => updateRow(row.id, "match_tier", Number(e.target.value) || null)}>
                    <option value={0}>미정</option>
                    <option value={1}>1티어</option>
                    <option value={2}>2티어</option>
                    <option value={3}>3티어</option>
                    <option value={4}>4티어</option>
                    <option value={5}>5티어</option>
                  </select>
                </td>
                <td>
                  <select value={row.main_line || "미정"} onChange={e => updateRow(row.id, "main_line", e.target.value)}>
                    {lines.map(line => <option key={line}>{line}</option>)}
                  </select>
                </td>
                <td>
                  <select value={row.sub_line || "미정"} onChange={e => updateRow(row.id, "sub_line", e.target.value)}>
                    {lines.map(line => <option key={line}>{line}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    value={row.role}
                    disabled={row.id === currentUserId}
                    onChange={e => updateRow(row.id, "role", e.target.value)}
                  >
                    <option value="member">클랜원</option>
                    <option value="staff">운영진</option>
                  </select>
                </td>
                <td>
                  <select
                    value={
                      !row.is_active
                        ? "disabled"
                        : row.activity_excluded
                          ? "excluded"
                          : row.activity_status === "active"
                            ? "active"
                            : "inactive"
                    }
                    disabled={row.id === currentUserId}
                    onChange={e => {
                      const value = e.target.value;
                      updateRow(row.id, "is_active", value !== "disabled");
                      updateRow(row.id, "activity_excluded", value === "excluded");
                      updateRow(row.id, "activity_status", value === "active" ? "active" : "inactive");
                    }}
                  >
                    <option value="active">활동</option>
                    <option value="inactive">비활동</option>
                    <option value="excluded">활동 제외</option>
                    <option value="disabled">계정 비활성</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="member-save-bar">
        <button className="button primary" type="button" onClick={saveAll} disabled={saving}>
          {saving ? "저장 중..." : "💾 변경사항 모두 저장"}
        </button>
      </div>
    </>
  );
}
