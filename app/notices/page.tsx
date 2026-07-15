import { getSupabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
export default async function NoticesPage(){
  const {data}=await getSupabaseAdmin().from("notices").select("*").order("is_pinned",{ascending:false}).order("created_at",{ascending:false});
  return <section className="card"><h1>클랜 공지</h1>{data?.map(n=><article key={n.id}><h3>{n.is_pinned?"📌 ":""}{n.title}</h3><p>{n.content}</p><hr/></article>)}</section>
}
