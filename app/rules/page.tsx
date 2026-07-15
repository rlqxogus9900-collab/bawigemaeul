import { getSupabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
export default async function RulesPage(){
  const {data}=await getSupabaseAdmin().from("clan_rules").select("*").order("sort_order");
  return <section className="card"><h1>클랜 규칙</h1>{data?.map((r,i)=><p key={r.id}>{i+1}. {r.content}</p>)}</section>
}
