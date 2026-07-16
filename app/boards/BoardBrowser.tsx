"use client";
import { useMemo, useState } from "react";

type Subcategory={id:string;category_id:string;name:string;description:string|null;sort_order:number};
type Category={id:string;name:string;icon:string;sort_order:number;board_subcategories:Subcategory[]};
type Post={id:string;title:string;author_nickname:string;is_pinned:boolean;view_count:number;comment_count:number;created_at:string;subcategory_id:string};

export default function BoardBrowser({categories,posts}:{categories:Category[];posts:Post[]}) {
  const [activeCategory,setActiveCategory]=useState(categories[0]?.id||"");
  const [activeSubcategory,setActiveSubcategory]=useState(categories[0]?.board_subcategories?.[0]?.id||"");
  const selected=useMemo(()=>categories.find(c=>c.id===activeCategory),[categories,activeCategory]);
  const visible=useMemo(()=>posts.filter(p=>p.subcategory_id===activeSubcategory),[posts,activeSubcategory]);

  function chooseCategory(category:Category){
    setActiveCategory(category.id);
    setActiveSubcategory(category.board_subcategories?.[0]?.id||"");
  }

  return <>
    <section className="board-category-tabs">
      {categories.map(category=><button key={category.id} type="button" className={category.id===activeCategory?"active":""} onClick={()=>chooseCategory(category)}>
        <span>{category.icon}</span><b>{category.name}</b>
      </button>)}
    </section>

    <section className="board-subcategory-wrap">
      <div className="board-subcategory-tabs">
        {selected?.board_subcategories?.map(sub=><button key={sub.id} type="button" className={sub.id===activeSubcategory?"active":""} onClick={()=>setActiveSubcategory(sub.id)}>{sub.name}</button>)}
      </div>
      <div className="board-subcategory-description">
        {selected?.board_subcategories?.find(item=>item.id===activeSubcategory)?.description||"게시판 설명이 없습니다."}
      </div>
    </section>

    <section className="card">
      <div className="board-list-head">
        <div><span>BOARD</span><h2>{selected?.name||"게시판"} · {selected?.board_subcategories?.find(item=>item.id===activeSubcategory)?.name||""}</h2></div>
        <button className="button primary" type="button">글쓰기</button>
      </div>
      <div className="table-wrap">
        <table className="board-list-table">
          <thead><tr><th>구분</th><th>제목</th><th>작성자</th><th>조회</th><th>댓글</th><th>작성일</th></tr></thead>
          <tbody>
            {visible.map(post=><tr key={post.id}>
              <td>{post.is_pinned?"📌 고정":"일반"}</td><td><b>{post.title}</b></td><td>{post.author_nickname}</td>
              <td>{post.view_count}</td><td>{post.comment_count}</td><td>{new Date(post.created_at).toLocaleDateString("ko-KR")}</td>
            </tr>)}
            {!visible.length&&<tr><td colSpan={6} className="muted">등록된 게시글이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  </>;
}
