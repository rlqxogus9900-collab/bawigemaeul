"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  sort_order: number;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  board_subcategories: Subcategory[];
};

type Post = {
  id: string;
  title: string;
  author_nickname: string;
  is_pinned: boolean;
  view_count: number;
  comment_count: number;
  created_at: string;
  subcategory_id: string;
};

export default function BoardBrowser({
  categories,
  posts,
  selectedBoardId
}: {
  categories: Category[];
  posts: Post[];
  selectedBoardId: string;
}) {
  const router = useRouter();

  const allSubcategories = categories.flatMap(category =>
    category.board_subcategories.map(subcategory => ({
      ...subcategory,
      categoryName: category.name,
      categoryIcon: category.icon
    }))
  );

  const selected =
    allSubcategories.find(item => item.id === selectedBoardId) ||
    allSubcategories[0];

  const visiblePosts = useMemo(
    () => posts.filter(post => post.subcategory_id === selected?.id),
    [posts, selected?.id]
  );

  return (
    <>
      <section className="board-current-heading">
        <div className="board-current-icon">{selected?.categoryIcon || "💬"}</div>
        <div>
          <span>{selected?.categoryName || "게시판"}</span>
          <h1>{selected?.name || "게시판"}</h1>
          <p>{selected?.description || "게시판 설명이 없습니다."}</p>
        </div>

        <select
          value={selected?.id || ""}
          onChange={event => router.push(`/boards?board=${event.target.value}`)}
          aria-label="모바일 게시판 선택"
        >
          {categories.map(category => (
            <optgroup key={category.id} label={`${category.icon} ${category.name}`}>
              {category.board_subcategories.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </section>

      <section className="card">
        <div className="board-list-head">
          <div>
            <span>BOARD</span>
            <h2>{selected?.name || "게시판"}</h2>
          </div>
          <button className="button primary" type="button">글쓰기</button>
        </div>

        <div className="table-wrap">
          <table className="board-list-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>제목</th>
                <th>작성자</th>
                <th>조회</th>
                <th>댓글</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map(post => (
                <tr key={post.id}>
                  <td>{post.is_pinned ? "📌 고정" : "일반"}</td>
                  <td><b>{post.title}</b></td>
                  <td>{post.author_nickname}</td>
                  <td>{post.view_count}</td>
                  <td>{post.comment_count}</td>
                  <td>{new Date(post.created_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
              {!visiblePosts.length && (
                <tr><td colSpan={6} className="muted">등록된 게시글이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
