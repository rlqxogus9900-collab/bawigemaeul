import { getSupabaseAdmin } from "@/lib/supabase-admin";
import BoardBrowser from "./BoardBrowser";
export const dynamic="force-dynamic";

export default async function BoardsPage(){
  const db=getSupabaseAdmin();
  const [{data:categories},{data:posts}]=await Promise.all([
    db.from("board_categories").select(`id,name,icon,sort_order,board_subcategories(id,category_id,name,description,sort_order)`).order("sort_order",{ascending:true}),
    db.from("board_posts").select("id,title,author_nickname,is_pinned,view_count,comment_count,created_at,subcategory_id").order("is_pinned",{ascending:false}).order("created_at",{ascending:false})
  ]);
  const normalized=(categories||[]).map(category=>({...category,board_subcategories:[...(category.board_subcategories||[])].sort((a,b)=>a.sort_order-b.sort_order)}));
  return <>
    <section className="feature-page reference-header"><div className="feature-title"><div className="feature-icon">💬</div><div><span>BAWIGEMAEUL COMMUNITY</span><h1>게시판</h1><p>대분류와 소분류 탭으로 원하는 게시판을 빠르게 찾을 수 있습니다.</p></div></div></section>
    <BoardBrowser categories={normalized as never[]} posts={(posts||[]) as never[]}/>
  </>;
}
