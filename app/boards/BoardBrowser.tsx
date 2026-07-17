"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MemberProfileLink from "@/app/components/MemberProfileLink";
import AdminPostActions from "./AdminPostActions";

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
  post_type: string;
  created_at: string;
  subcategory_id: string;
};

export default function BoardBrowser({
  categories,
  posts,
  selectedBoardId,
  query,
  canWrite,
  isStaff,
  currentPage,
  totalCount,
  postsPerPage,
  sort
}: {
  categories: Category[];
  posts: Post[];
  selectedBoardId: string;
  query: string;
  canWrite: boolean;
  isStaff: boolean;
  currentPage: number;
  totalCount: number;
  postsPerPage: number;
  sort: string;
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

  const totalPages = Math.max(1, Math.ceil(totalCount / postsPerPage));
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter(page =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 2
    );

  function boardUrl(page: number) {
    const params = new URLSearchParams();
    if (selected?.id) params.set("board", selected.id);
    if (query) params.set("q", query);
    if (sort !== "latest") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    return `/boards?${params.toString()}`;
  }

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

          <div className="board-list-head-actions">
            {canWrite && (
              <Link className="button" href="/boards/bookmarks">
                ★ 내 즐겨찾기
              </Link>
            )}
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
        </div>

        <nav className="board-sort-tabs" aria-label="게시글 정렬">
          {[
            ["latest", "최신순"],
            ["popular", "추천순"],
            ["views", "조회순"],
            ["comments", "댓글순"]
          ].map(([value, label]) => {
            const params = new URLSearchParams();
            if (selected?.id) params.set("board", selected.id);
            if (query) params.set("q", query);
            if (value !== "latest") params.set("sort", value);
            return (
              <Link
                key={value}
                className={sort === value ? "active" : ""}
                href={`/boards?${params.toString()}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <form className="board-search-form" action="/boards" method="get">
          <input
            type="hidden"
            name="board"
            value={selected?.id || ""}
          />
          {sort !== "latest" && <input type="hidden" name="sort" value={sort} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="제목 또는 작성자 검색"
          />
          <button className="button" type="submit">검색</button>
          {query && (
            <Link
              className="button outline"
              href={`/boards?board=${selected?.id || ""}${sort !== "latest" ? `&sort=${sort}` : ""}`}
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
                <th>작성일</th>{isStaff && <th>관리</th>}
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr
                  key={post.id}
                  className={post.is_pinned ? "pinned-row" : ""}
                >
                  <td>{post.is_pinned ? "📌 고정" : post.post_type === "poll" ? "📊 투표" : "일반"}</td>
                  <td>
                    <Link
                      className="board-post-link"
                      href={`/boards/${post.id}`}
                    >
                      <b>{post.title}</b>
                      {Date.now() - new Date(post.created_at).getTime() < 24 * 60 * 60 * 1000 && (
                        <span className="board-new-badge">NEW</span>
                      )}
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
                  {isStaff && (
                    <td>
                      <AdminPostActions
                        postId={post.id}
                        isPinned={post.is_pinned}
                      />
                    </td>
                  )}
                </tr>
              ))}

              {!posts.length && (
                <tr>
                  <td colSpan={isStaff ? 8 : 7} className="muted">
                    {query
                      ? "검색 결과가 없습니다."
                      : "등록된 게시글이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav className="board-pagination" aria-label="게시판 페이지 이동">
            <Link
              className={`button ${currentPage === 1 ? "disabled" : ""}`}
              href={currentPage === 1 ? boardUrl(1) : boardUrl(currentPage - 1)}
              aria-disabled={currentPage === 1}
            >
              이전
            </Link>

            <div className="board-page-numbers">
              {pageNumbers.map((page, index) => {
                const previous = pageNumbers[index - 1];
                return (
                  <span key={page}>
                    {previous && page - previous > 1 && <i>…</i>}
                    <Link
                      className={page === currentPage ? "active" : ""}
                      href={boardUrl(page)}
                    >
                      {page}
                    </Link>
                  </span>
                );
              })}
            </div>

            <Link
              className={`button ${currentPage === totalPages ? "disabled" : ""}`}
              href={currentPage === totalPages ? boardUrl(totalPages) : boardUrl(currentPage + 1)}
              aria-disabled={currentPage === totalPages}
            >
              다음
            </Link>
          </nav>
        )}

        <p className="board-result-count">
          전체 {totalCount}개 · {currentPage}/{totalPages} 페이지
        </p>
      </section>
    </>
  );
}
