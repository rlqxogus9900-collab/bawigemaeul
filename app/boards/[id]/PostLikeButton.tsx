"use client";

import { useState } from "react";

export default function PostLikeButton({
  postId,
  initialCount,
  initialLiked,
  loggedIn
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  loggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }

    if (loading) return;
    setLoading(true);

    const response = await fetch(`/api/boards/posts/${postId}/like`, {
      method: "POST"
    });
    const result = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      window.alert(result?.message || "추천 처리에 실패했습니다.");
      return;
    }

    setLiked(Boolean(result.liked));
    setCount(Number(result.count || 0));
  }

  return (
    <button
      type="button"
      className={`post-like-button ${liked ? "liked" : ""}`}
      onClick={toggle}
      disabled={loading}
    >
      <span>{liked ? "👍" : "♡"}</span>
      <b>{liked ? "추천함" : "추천"}</b>
      <em>{count}</em>
    </button>
  );
}
