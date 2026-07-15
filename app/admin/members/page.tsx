import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MemberBulkEditor from "./MemberBulkEditor";

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
    .select("id,nickname,riot_id,role,is_active")
    .order("created_at", { ascending: false });

  const errorText =
    params.error === "duplicate"
      ? "이미 사용 중인 홈페이지 닉네임 또는 Riot ID입니다."
      : params.error === "invalid"
        ? "닉네임과 Riot ID를 올바르게 입력하세요."
        : params.error
          ? "처리 중 오류가 발생했습니다."
          : "";

  return (
    <>
      <section className="card">
        <h2>신입 클랜원 등록</h2>
        {errorText && <div className="error">{errorText}</div>}
        {params.saved && <div className="flash">신입 클랜원을 등록했습니다.</div>}
        <form className="member-add-row" action="/api/admin/members" method="post">
          <input name="nickname" placeholder="홈페이지 닉네임" required />
          <input name="riot_id" placeholder="Riot ID 예: 바위게#KR1" required />
          <select name="role" defaultValue="member">
            <option value="member">클랜원</option>
            <option value="staff">운영진</option>
          </select>
          <button className="button primary">초기 비밀번호 1234로 등록</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="member-section-title">
          <div>
            <h2>클랜원 명단 및 계정 관리</h2>
            <p className="muted">
              여러 명의 정보를 수정한 뒤 아래 저장 버튼을 한 번만 누르면 됩니다.
            </p>
          </div>
        </div>

        <MemberBulkEditor
          initialMembers={(members || []) as {
            id: string;
            nickname: string;
            riot_id: string;
            role: "member" | "staff";
            is_active: boolean;
          }[]}
          currentUserId={currentUser.id}
        />
      </section>
    </>
  );
}
