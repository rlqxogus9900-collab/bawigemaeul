"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MemberProfileLink from "@/app/components/MemberProfileLink";

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
  author_member_id: string | null;
  author_nickname: string;
  is_pinned: boolean;
  view_count: number;
  comment_count: number;
  like_count: number;
  created_at: string;
  subcategory_id: string;
};

export default function BoardBrowser({
  categories,
  posts,
  selectedBoardId,
  query,
  canWrite
}: {
  categories: Category[];
  posts: Post[];
  selectedBoardId: string;
  query: string;
  canWrite: boolean;
}) {
  const router = useRouter();

  const all = categories.flatMap(category =>
    category.board_subcategories.map(sub => ({
      ...sub,
      categoryName: category.name,
      categoryIcon: category.icon
    }))
  );

  const selected =
    all.find(item => item.id === selectedBoardId) || all[0];

  return (
    <>
      <section className="board-current-heading">
        <div className="board-current-icon">
          {selected?.categoryIcon || "💬"}
        </div>
        <div>
          <span>{selected?.categoryName || "게시판"}</span>
          <h1>{selected?.name || "게시판"}</h1>
          <p>{selected?.description || "게시판 설명이 없습니다."}</p>
        </div>
        <select
          value={selected?.id || ""}
          onChange={event =>
            router.push(`/boards?board=${event.target.value}`)
          }
          aria-label="게시판 선택"
        >
          {categories.map(category => (
            <optgroup
              key={category.id}
              label={`${category.icon} ${category.name}`}
            >
              {category.board_subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </section>

      <section className="card board-list-card">
        <div className="board-list-head">
          <div>
            <span>BOARD</span>
            <h2>{selected?.name || "게시판"}</h2>
          </div>

          {canWrite ? (
            <Link
              className="button primary"
              href={`/boards/new?board=${selected?.id || ""}`}
            >
              글쓰기
            </Link>
          ) : (
            <Link className="button" href="/login">
              로그인 후 글쓰기
            </Link>
          )}
        </div>

        <form className="board-search-form" action="/boards" method="get">
          <input
            type="hidden"
            name="board"
            value={selected?.id || ""}
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="제목 또는 작성자 검색"
          />
          <button className="button" type="submit">검색</button>
          {query && (
            <Link
              className="button outline"
              href={`/boards?board=${selected?.id || ""}`}
            >
              초기화
            </Link>
          )}
        </form>

        <div className="table-wrap">
          <table className="board-list-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>제목</th>
                <th>작성자</th>
                <th>조회</th>
                <th>댓글</th>
                <th>추천</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr
                  key={post.id}
                  className={post.is_pinned ? "pinned-row" : ""}
                >
                  <td>{post.is_pinned ? "📌 고정" : "일반"}</td>
                  <td>
                    <Link
                      className="board-post-link"
                      href={`/boards/${post.id}`}
                    >
                      <b>{post.title}</b>
                    </Link>
                  </td>
                  <td>
                    <MemberProfileLink
                      memberId={post.author_member_id}
                      nickname={post.author_nickname}
                    />
                  </td>
                  <td>{post.view_count}</td>
                  <td>{post.comment_count}</td>
                  <td>{post.like_count || 0}</td>
                  <td>
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))}

              {!posts.length && (
                <tr>
                  <td colSpan={7} className="muted">
                    {query
                      ? "검색 결과가 없습니다."
                      : "등록된 게시글이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
