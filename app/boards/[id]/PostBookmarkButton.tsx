"use client";

import { useState } from "react";

export default function PostBookmarkButton({
  postId,
  initialBookmarked,
  loggedIn
}: {
  postId: string;
  initialBookmarked: boolean;
  loggedIn: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }

    if (loading) return;
    setLoading(true);

    const response = await fetch(`/api/boards/posts/${postId}/bookmark`, {
      method: "POST"
    });
    const result = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      window.alert(result?.message || "즐겨찾기 처리에 실패했습니다.");
      return;
    }

    setBookmarked(Boolean(result.bookmarked));
  }

  return (
    <button
      type="button"
      className={`post-bookmark-button ${bookmarked ? "bookmarked" : ""}`}
      onClick={toggle}
      disabled={loading}
      aria-pressed={bookmarked}
    >
      <span>{bookmarked ? "★" : "☆"}</span>
      <b>{bookmarked ? "즐겨찾기됨" : "즐겨찾기"}</b>
    </button>
  );
}
