"use client";

export default function DeleteBoardButton({ message }: { message: string }) {
  return (
    <button
      className="button danger"
      name="_action"
      value="delete"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      삭제
    </button>
  );
}
