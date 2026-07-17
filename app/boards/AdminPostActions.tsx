"use client";

import { useState } from "react";

export default function AdminPostActions({
  postId,
  isPinned
}: {
  postId: string;
  isPinned: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function run(action: "delete" | "pin") {
    if (loading) return;

    if (
      action === "delete" &&
      !window.confirm("이 게시글을 바로 삭제할까요?")
    ) {
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/admin/boards/posts/${postId}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "pin"
        ? JSON.stringify({ isPinned: !isPinned })
        : undefined
    });

    const result = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      window.alert(result?.message || "처리에 실패했습니다.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="board-admin-quick-actions">
      <button
        type="button"
        title={isPinned ? "고정 해제" : "상단 고정"}
        onClick={() => run("pin")}
        disabled={loading}
      >
        {isPinned ? "📌" : "📍"}
      </button>

      <button
        type="button"
        title="게시글 삭제"
        className="danger"
        onClick={() => run("delete")}
        disabled={loading}
      >
        🗑
      </button>
    </div>
  );
}
