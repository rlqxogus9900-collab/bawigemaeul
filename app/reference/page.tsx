import { getSupabaseAdmin } from "@/lib/supabase-admin";
import ReferenceRoster from "./ReferenceRoster";

export const dynamic = "force-dynamic";

export default async function ReferencePage() {
  const { data: members } = await getSupabaseAdmin()
    .from("members")
    .select("id,nickname,riot_id,average_tier,match_tier,main_line,sub_line,reference_note")
    .eq("is_active", true)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="feature-page reference-header">
        <div className="feature-title">
          <div className="feature-icon">☷</div>
          <div>
            <span>AUCTION REFERENCE</span>
            <h1>내전 참고 명단</h1>
            <p>경매 전 참고할 평균티어, 내전티어, 라인과 참고사항을 확인합니다.</p>
          </div>
        </div>
      </section>
      <ReferenceRoster members={(members || []) as never[]} />
    </>
  );
}
