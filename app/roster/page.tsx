import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const { data: members } = await getSupabaseAdmin()
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
      is_active
    `)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="feature-page reference-header">
        <div className="feature-title">
          <div className="feature-icon">👥</div>
          <div>
            <span>CLAN MEMBER ROSTER</span>
            <h1>클랜원 명단</h1>
            <p>클랜원의 계정, 티어, 라인, 권한과 활동 상태를 확인합니다.</p>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="full-roster-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>Riot ID</th>
                <th>현재티어</th>
                <th>최고티어</th>
                <th>평균티어</th>
                <th>내전티어</th>
                <th>주라인</th>
                <th>부라인</th>
                <th>권한</th>
                <th>활동여부</th>
              </tr>
            </thead>
            <tbody>
              {members?.map(member => {
                const activityText =
                  !member.is_active
                    ? "계정 비활성"
                    : member.activity_excluded
                      ? "활동 제외"
                      : member.activity_status === "active"
                        ? "활동"
                        : "비활동";

                return (
                  <tr key={member.id}>
                    <td><b>{member.nickname}</b></td>
                    <td>{member.riot_id}</td>
                    <td>{member.current_tier || "미정"}</td>
                    <td>{member.highest_tier || "미정"}</td>
                    <td>{member.average_tier || "미정"}</td>
                    <td>{member.match_tier ? `${member.match_tier}티어` : "미정"}</td>
                    <td>{member.main_line || "미정"}</td>
                    <td>{member.sub_line || "미정"}</td>
                    <td>{member.role === "staff" ? "운영진" : "클랜원"}</td>
                    <td>
                      <span className={
                        activityText === "활동"
                          ? "status-active"
                          : activityText === "비활동"
                            ? "status-idle"
                            : "status-neutral"
                      }>
                        {activityText}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {!members?.length && (
                <tr><td colSpan={10} className="muted">등록된 클랜원이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
