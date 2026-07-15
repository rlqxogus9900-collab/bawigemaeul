import { getSupabaseAdmin } from "@/lib/supabase-admin";
import ReferenceRoster from "./ReferenceRoster";

export const dynamic = "force-dynamic";

export default async function ReferencePage() {
  const { data: members } = await getSupabaseAdmin()
    .from("members")
    .select("id,nickname,riot_id,tier,main_line,sub_line,activity_status,is_active")
    .eq("is_active", true)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="feature-page reference-header">
        <div className="feature-title">
          <div className="feature-icon">☷</div>
          <div>
            <span>CLAN ROSTER</span>
            <h1>내전 참고 명단</h1>
            <p>클랜원의 티어, 주라인과 부라인을 한눈에 확인합니다.</p>
          </div>
        </div>
      </section>

      <ReferenceRoster members={(members || []) as never[]} />
    </>
  );
}
