import { getSupabaseAdmin } from "@/lib/supabase-admin";
import NormalMatchBalancer from "./NormalMatchBalancer";

export const dynamic = "force-dynamic";

export default async function NormalMatchPage() {
  const { data: members } = await getSupabaseAdmin()
    .from("members")
    .select("id,nickname,riot_id,match_tier,average_tier,current_tier,main_line,sub_line")
    .eq("is_active", true)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="normal-match-hero">
        <div>
          <span>NORMAL MATCH</span>
          <h1>일반 내전 팀 짜기</h1>
          <p>클랜원 명단에서 10명을 불러와 내전티어와 주·부라인을 기준으로 5대5 팀을 자동 배정합니다.</p>
        </div>
      </section>
      <NormalMatchBalancer members={(members || []) as never[]} />
    </>
  );
}
