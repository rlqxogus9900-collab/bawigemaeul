import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import RosterEditor from "./RosterEditor";

export const dynamic = "force-dynamic";

export default async function AdminReferencePage() {
  await requireStaff();

  const { data: members } = await getSupabaseAdmin()
    .from("members")
    .select("id,nickname,riot_id,match_tier,main_line,sub_line,reference_note")
    .eq("is_active", true)
    .order("nickname", { ascending: true });

  return (
    <section className="card">
      <div className="page-head">
        <div>
          <span>STAFF ONLY</span>
          <h1>내전 참고 명단 관리</h1>
          <p className="muted">경매용 1~5티어, 주라인·부라인과 참고사항을 한 번에 수정합니다.</p>
        </div>
      </div>

      <RosterEditor initialMembers={(members || []) as never[]} />
    </section>
  );
}
