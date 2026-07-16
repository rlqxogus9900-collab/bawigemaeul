"use client";

export default function CommentDeleteButton() {
  return (
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
  );
}
