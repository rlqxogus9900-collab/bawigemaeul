import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import RosterActivitySync from "./RosterActivitySync";

export const dynamic = "force-dynamic";

const romanTier: Record<number, string> = {
  1: "Ⅰ",
  2: "Ⅱ",
  3: "Ⅲ",
  4: "Ⅳ",
  5: "Ⅴ"
};

export default async function AdminRosterPage() {
  await requireStaff();

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
      is_active,
      riot_sync_status,
      riot_sync_error,
      last_riot_sync_at,
      last_game_at
    `)
    .order("nickname", { ascending: true });

  return (
    <>
      <section className="feature-page reference-header">
        <div className="feature-title">
          <div className="feature-icon">👥</div>
          <div>
            <span>STAFF ONLY</span>
            <h1>클랜원 명단</h1>
            <p>운영진이 클랜원의 전체 정보를 확인하는 관리자 전용 명단입니다.</p>
          </div>
        </div>
      </section>

      <RosterActivitySync />

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
                <th>마지막 클랜 활동</th>
                <th>API 집계</th>
              </tr>
            </thead>
            <tbody>
              {members?.map(member => {
                const syncStatus = String(member.riot_sync_status || "not_synced");
                const activityText =
                  !member.is_active
                    ? "계정 비활성"
                    : member.activity_excluded
                      ? "활동 제외"
                      : syncStatus === "missing_riot_id"
                        ? "집계 안 됨"
                        : member.activity_status === "active"
                          ? "활동"
                          : "비활동";
                const lastGameText = member.last_game_at
                  ? new Date(member.last_game_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })
                  : "기록 없음";
                const syncText = syncStatus === "synced"
                  ? "집계 완료"
                  : syncStatus === "missing_riot_id"
                    ? "API ID 미등록 · 집계 안 됨"
                    : syncStatus === "riot_id_not_found"
                      ? "Riot ID 확인 필요"
                      : syncStatus === "api_error"
                        ? "API 오류"
                        : "아직 집계 안 됨";

                return (
                  <tr key={member.id}>
                    <td><b>{member.nickname}</b></td>
                    <td>{member.riot_id}</td>
                    <td>{member.current_tier || "미정"}</td>
                    <td>{member.highest_tier || "미정"}</td>
                    <td>{member.average_tier || "미정"}</td>
                    <td>
                      <span className={`roman-tier-badge tier-${member.match_tier || 0}`}>
                        {member.match_tier ? romanTier[member.match_tier] : "-"}
                      </span>
                    </td>
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
                    <td><span className="last-activity-cell">{lastGameText}</span></td>
                    <td>
                      <span className={`riot-sync-status ${syncStatus}`}>{syncText}</span>
                      {member.last_riot_sync_at && <small className="riot-sync-time">확인 {new Date(member.last_riot_sync_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</small>}
                      {member.riot_sync_error && syncStatus !== "missing_riot_id" && <small className="riot-sync-error">{member.riot_sync_error}</small>}
                    </td>
                  </tr>
                );
              })}
              {!members?.length && (
                <tr><td colSpan={12} className="muted">등록된 클랜원이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
