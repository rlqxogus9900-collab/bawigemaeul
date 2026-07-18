import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MemberBulkEditor from "./MemberBulkEditor";
import AddMemberModal from "./AddMemberModal";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const currentUser = await requireStaff();
  const params = await searchParams;
  const db = getSupabaseAdmin();

  const { data: members } = await db
    .from("members")
    .select(`
      id,
      nickname,
      riot_id,
      current_tier,
      highest_tier,
      average_tier,
      match_tier,
      main_line,
      sub_line,
      role,
      activity_status,
      activity_excluded,
      is_active,
      riot_sync_status,
      riot_sync_error,
      last_riot_sync_at,
      last_game_at
    `)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="card">
        <div className="member-page-head">
          <div>
            <span>STAFF ONLY</span>
            <h1>명단 설정</h1>
            <p className="muted">클랜원 명단에 표시할 모든 정보를 한 번에 설정합니다.</p>
          </div>
          <AddMemberModal />
        </div>

        {params.saved && <div className="flash">클랜원을 등록했습니다.</div>}
        {params.error && <div className="error">입력값 또는 중복 정보를 확인하세요.</div>}

        <MemberBulkEditor
          initialMembers={(members || []) as never[]}
          currentUserId={currentUser.id}
        />
      </section>
    </>
  );
}
