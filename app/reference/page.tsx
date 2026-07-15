import { getSupabaseAdmin } from "@/lib/supabase-admin";
import ReferenceRoster from "./ReferenceRoster";

export const dynamic = "force-dynamic";

export default async function ReferencePage() {
  const { data: members } = await getSupabaseAdmin()
    .from("members")
    .select("id,nickname,riot_id,match_tier,main_line,sub_line,reference_note,activity_status,is_active")
    .eq("is_active", true)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="feature-page reference-header">
        <div className="feature-title">
          <div className="feature-icon">☷</div>
          <div>
            <span>AUCTION ROSTER</span>
            <h1>내전 참고 명단</h1>
            <p>경매에 사용할 내전 티어, 주라인·부라인과 참고사항을 확인합니다.</p>
          </div>
        </div>
      </section>

      <ReferenceRoster members={(members || []) as never[]} />
    </>
  );
}
