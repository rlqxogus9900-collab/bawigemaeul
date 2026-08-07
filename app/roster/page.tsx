import { getSupabaseAdmin } from "@/lib/supabase-admin";
import ReferenceRoster from "@/app/reference/ReferenceRoster";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const db = getSupabaseAdmin();
  const [{ data: members }, { data: vacations }] = await Promise.all([
    db.from("members")
    .select("id,nickname,riot_id,average_tier,match_tier,main_line,sub_line,reference_note")
    .eq("is_active", true)
    .order("nickname", { ascending: true }),
    db.from("member_vacations").select("member_id,start_date,end_date,reason")
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const vacationByMember = new Map((vacations || [])
    .filter(v => v.end_date >= today)
    .map(v => [v.member_id, v]));

  return (
    <>
      <section className="feature-page reference-header">
        <div className="feature-title">
          <div className="feature-icon">👥</div>
          <div>
            <span>CLAN ROSTER</span>
            <h1>클랜원 명단</h1>
            <p>현재 활동 중인 클랜원의 닉네임, 티어와 주·부라인을 확인합니다.</p>
          </div>
        </div>
      </section>
      <ReferenceRoster members={(members || []).map(member => ({ ...member, vacation: vacationByMember.get(member.id) || null })) as never[]} />
    </>
  );
}
