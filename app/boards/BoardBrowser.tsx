"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Subcategory = { id:string; category_id:string; name:string; description:string|null; sort_order:number };
type Category = { id:string; name:string; icon:string; sort_order:number; board_subcategories:Subcategory[] };
type Post = { id:string; title:string; author_nickname:string; is_pinned:boolean; view_count:number; comment_count:number; created_at:string; subcategory_id:string };

export default function BoardBrowser({ categories, posts, selectedBoardId, canWrite }:{ categories:Category[]; posts:Post[]; selectedBoardId:string; canWrite:boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const allSubcategories = categories.flatMap(category => category.board_subcategories.map(subcategory => ({...subcategory, categoryName:category.name, categoryIcon:category.icon})));
  const selected = allSubcategories.find(item => item.id === selectedBoardId) || allSubcategories[0];
  const visiblePosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return posts.filter(post => post.subcategory_id === selected?.id && (!keyword || post.title.toLowerCase().includes(keyword) || post.author_nickname.toLowerCase().includes(keyword)));
  }, [posts, selected?.id, query]);

  return <>
    <section className="board-current-heading">
      <div className="board-current-icon">{selected?.categoryIcon || "💬"}</div>
      <div><span>{selected?.categoryName || "게시판"}</span><h1>{selected?.name || "게시판"}</h1><p>{selected?.description || "게시판 설명이 없습니다."}</p></div>
      <select value={selected?.id || ""} onChange={event => router.push(`/boards?board=${event.target.value}`)} aria-label="게시판 선택">
        {categories.map(category => <optgroup key={category.id} label={`${category.icon} ${category.name}`}>{category.board_subcategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}</optgroup>)}
      </select>
    </section>

    <section className="card board-list-card">
      <div className="board-list-head">
        <div><span>BOARD</span><h2>{selected?.name || "게시판"}</h2></div>
        <div className="board-list-actions">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="제목 또는 작성자 검색" aria-label="게시글 검색" />
          {canWrite ? <Link className="button primary" href={`/boards/write?board=${selected?.id || ""}`}>글쓰기</Link> : <Link className="button" href="/login">로그인 후 글쓰기</Link>}
        </div>
      </div>

      <div className="table-wrap">
        <table className="board-list-table">
          <thead><tr><th>구분</th><th>제목</th><th>작성자</th><th>조회</th><th>댓글</th><th>작성일</th></tr></thead>
          <tbody>
            {visiblePosts.map(post => <tr key={post.id} className={post.is_pinned ? "pinned-row" : ""}>
              <td>{post.is_pinned ? "📌 고정" : "일반"}</td>
              <td><Link className="board-post-link" href={`/boards/${post.id}?board=${selected?.id || ""}`}><b>{post.title}</b></Link></td>
              <td>{post.author_nickname}</td><td>{post.view_count}</td><td>{post.comment_count}</td><td>{new Date(post.created_at).toLocaleDateString("ko-KR")}</td>
            </tr>)}
            {!visiblePosts.length && <tr><td colSpan={6} className="muted">검색 결과 또는 등록된 게시글이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </>;
}
