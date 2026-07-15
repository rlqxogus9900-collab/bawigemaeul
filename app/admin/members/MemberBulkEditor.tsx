"use client";

import { useMemo, useState } from "react";

type MemberRow = {
  id: string;
  nickname: string;
  riot_id: string;
  role: "member" | "staff";
  is_active: boolean;
};

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
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      row =>
        row.nickname.toLowerCase().includes(query) ||
        row.riot_id.toLowerCase().includes(query)
    );
  }, [rows, search]);

  function updateRow(id: string, field: keyof MemberRow, value: string | boolean) {
    setRows(current =>
      current.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
    setMessage("");
  }

  async function saveAll() {
    if (saving) return;
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

    setMessage("변경사항을 모두 저장했습니다.");
    window.location.reload();
  }

  async function resetPassword(row: MemberRow) {
    if (!confirm(`${row.nickname}님의 비밀번호를 1234로 초기화할까요?\n다음 로그인 시 새 비밀번호 설정이 필요합니다.`)) return;

    const response = await fetch(`/api/admin/members/${row.id}/reset-password`, {
      method: "POST"
    });

    if (response.ok) {
      setMessage(`${row.nickname}님의 비밀번호를 1234로 초기화했습니다.`);
    } else {
      setMessage("비밀번호 초기화에 실패했습니다.");
    }
  }

  async function deleteMember(row: MemberRow) {
    if (row.id === currentUserId) {
      setMessage("현재 로그인 중인 본인 계정은 삭제할 수 없습니다.");
      return;
    }

    const first = confirm(
      `${row.nickname} 계정을 삭제할까요?\n로그인 정보와 클랜원 정보가 함께 삭제됩니다.`
    );
    if (!first) return;

    const second = confirm(
      `정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!second) return;

    const response = await fetch(`/api/admin/members/${row.id}/delete`, {
      method: "POST"
    });

    if (!response.ok) {
      setMessage("계정 삭제에 실패했습니다.");
      return;
    }

    setRows(current => current.filter(item => item.id !== row.id));
    setMessage(`${row.nickname} 계정을 삭제했습니다.`);
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

      {message && <div className={message.includes("실패") || message.includes("없습니다") ? "error" : "flash"}>{message}</div>}

      <div className="table-wrap">
        <table className="member-bulk-table">
          <thead>
            <tr>
              <th>홈페이지 닉네임</th>
              <th>Riot ID</th>
              <th>권한</th>
              <th>계정 상태</th>
              <th>계정 관리</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => (
              <tr key={row.id}>
                <td>
                  <input
                    value={row.nickname}
                    onChange={event => updateRow(row.id, "nickname", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={row.riot_id}
                    onChange={event => updateRow(row.id, "riot_id", event.target.value)}
                  />
                </td>
                <td>
                  <select
                    value={row.role}
                    disabled={row.id === currentUserId}
                    onChange={event => updateRow(row.id, "role", event.target.value)}
                  >
                    <option value="member">클랜원</option>
                    <option value="staff">운영진</option>
                  </select>
                </td>
                <td>
                  <select
                    value={row.is_active ? "true" : "false"}
                    disabled={row.id === currentUserId}
                    onChange={event => updateRow(row.id, "is_active", event.target.value === "true")}
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </td>
                <td>
                  <div className="actions nowrap-actions">
                    <button className="button" type="button" onClick={() => resetPassword(row)}>
                      비밀번호 초기화
                    </button>
                    <button className="button danger" type="button" onClick={() => deleteMember(row)}>
                      계정 삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="member-save-bar">
        <button className="button primary member-save-all" type="button" onClick={saveAll} disabled={saving}>
          {saving ? "저장 중..." : "💾 변경사항 모두 저장"}
        </button>
      </div>
    </>
  );
}
