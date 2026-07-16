"use client";

import { useState } from "react";

export default function CommentActions({
  commentId,
  postId,
  initialContent
}: {
  commentId: string;
  postId: string;
  initialContent: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        className="comment-inline-editor"
        action={`/api/boards/comments/${commentId}`}
        method="post"
      >
        <input type="hidden" name="_action" value="update" />
        <input type="hidden" name="post_id" value={postId} />
        <textarea
          name="content"
          rows={3}
          maxLength={1000}
          required
          defaultValue={initialContent}
        />
        <div>
          <button
            type="button"
            className="button outline"
            onClick={() => setEditing(false)}
          >
            취소
          </button>
          <button className="button primary" type="submit">
            수정 저장
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="board-comment-actions">
      <button
        className="board-comment-edit"
        type="button"
        onClick={() => setEditing(true)}
      >
        수정
      </button>

      <form
        action={`/api/boards/comments/${commentId}`}
        method="post"
      >
        <input type="hidden" name="_action" value="delete" />
        <input type="hidden" name="post_id" value={postId} />
        <button
          className="board-comment-delete"
          type="submit"
          onClick={(event) => {
            if (!window.confirm("댓글을 삭제할까요?")) {
              event.preventDefault();
            }
          }}
        >
          삭제
        </button>
      </form>
    </div>
  );
}
