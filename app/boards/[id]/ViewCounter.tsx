"use client";

import { useEffect, useState } from "react";

export default function ViewCounter({
  postId,
  initialCount
}: {
  postId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/boards/posts/${postId}/view`, { method: "POST" })
      .then(response => response.json())
      .then(result => {
        if (!cancelled && Number.isFinite(Number(result?.count))) {
          setCount(Number(result.count));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [postId]);

  return <span>조회 {count}</span>;
}
