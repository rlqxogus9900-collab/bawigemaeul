import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  await requireStaff();
  const params = await searchParams;
  const db = getSupabaseAdmin();
  const { data: members } = await db
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  const errorText =
    params.error === "duplicate"
      ? "이미 사용 중인 홈페이지 닉네임 또는 Riot ID입니다."
      : params.error === "invalid"
        ? "닉네임과 Riot ID를 올바르게 입력하세요."
        : params.error === "self"
          ? "현재 로그인 중인 본인 계정을 비활성화하거나 삭제할 수 없습니다."
          : params.error
            ? "처리 중 오류가 발생했습니다."
            : "";

  return (
    <>
      <section className="card">
        <h2>신입 클랜원 등록</h2>
        {errorText && <div className="error">{errorText}</div>}
        {params.saved && <div className="flash">클랜원 정보를 저장했습니다.</div>}
        <form className="form" action="/api/admin/members" method="post">
          <input name="nickname" placeholder="홈페이지 닉네임" required />
          <input name="riot_id" placeholder="Riot ID 예: 바위게#KR1" required />
          <select name="role">
            <option value="member">클랜원</option>
            <option value="staff">운영진</option>
          </select>
          <button className="button primary">초기 비밀번호 1234로 등록</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2>클랜원 명단 및 계정 수정</h2>
        <p className="muted">
          홈페이지 닉네임을 수정하면 다음 로그인부터 새 닉네임을 사용해야 합니다.
        </p>

        <div className="member-edit-list">
          {members?.map((m) => (
            <article className="member-edit-card" key={m.id}>
              <form className="form" action={`/api/admin/members/${m.id}/update`} method="post">
                <div className="grid member-edit-grid">
                  <label>
                    홈페이지 닉네임
                    <input name="nickname" defaultValue={m.nickname} required />
                  </label>

                  <label>
                    Riot ID
                    <input name="riot_id" defaultValue={m.riot_id} required />
                  </label>

                  <label>
                    권한
                    <select name="role" defaultValue={m.role}>
                      <option value="member">클랜원</option>
                      <option value="staff">운영진</option>
                    </select>
                  </label>

                  <label>
                    계정 상태
                    <select name="is_active" defaultValue={m.is_active ? "true" : "false"}>
                      <option value="true">활성</option>
                      <option value="false">비활성</option>
                    </select>
                  </label>
                </div>

                <div className="actions">
                  <button className="button primary">정보 수정 저장</button>
                </div>
              </form>

              <div className="actions member-danger-actions">
                <form action={`/api/admin/members/${m.id}/reset-password`} method="post">
                  <button className="button">비밀번호 1234 초기화</button>
                </form>
                <form action={`/api/admin/members/${m.id}/delete`} method="post">
                  <button className="button danger">계정 삭제</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
