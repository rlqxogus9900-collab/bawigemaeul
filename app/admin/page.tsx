import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const db = getSupabaseAdmin();

  const [
    membersResult,
    activeMembersResult,
    openPollsResult,
    auctionPollResult,
    whistleResult,
    latestNoticeResult
  ] = await Promise.all([
    db.from("members").select("id", { count: "exact", head: true }),
    db
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    db
      .from("board_polls")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    db
      .from("board_polls")
      .select("id,match_at,board_posts(title)")
      .eq("poll_type", "regular_match")
      .eq("is_auction_source", true)
      .maybeSingle(),
    db
      .from("whistle_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("notices")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const auctionPost = Array.isArray(auctionPollResult.data?.board_posts)
    ? auctionPollResult.data?.board_posts[0]
    : auctionPollResult.data?.board_posts;

  const cards = [
    {
      label: "전체 클랜원",
      value: membersResult.count || 0,
      unit: "명",
      icon: "👥",
      href: "/admin/members",
      note: `활성 ${(activeMembersResult.count || 0)}명`
    },
    {
      label: "진행 중 투표",
      value: openPollsResult.count || 0,
      unit: "개",
      icon: "🗳",
      href: "/admin/polls",
      note: "현재 열린 전체 투표"
    },
    {
      label: "미처리 신문고",
      value: whistleResult.count || 0,
      unit: "건",
      icon: "📮",
      href: "/admin/whistle",
      note: "확인이 필요한 제보"
    },
    {
      label: "경매 연동",
      value: auctionPollResult.data ? 1 : 0,
      unit: "개",
      icon: "🔨",
      href: "/admin/polls",
      note: auctionPost?.title || "연동된 투표 없음"
    }
  ];

  const quickLinks = [
    ["/admin/members", "♙", "클랜원 설정", "신규 등록·권한·활동 상태 관리"],
    ["/admin/polls", "🗳", "투표 관리", "정기내전 참가자와 팀장 설정"],
    ["/admin/boards", "🗂", "게시판 관리", "게시판 생성·순서·공개 범위 관리"],
    ["/admin/notices", "✍", "공지 관리", "홈과 공지사항에 노출할 글 관리"],
    ["/admin/match-records", "📝", "내전 기록", "경기 결과와 개인 기록 입력"],
    ["/admin/whistle", "📮", "신문고 관리", "익명 제보 확인 및 처리"]
  ] as const;

  return (
    <>
      <section className="admin-dashboard-hero">
        <div>
          <span>STAFF DASHBOARD</span>
          <h1>{user.nickname}님, 관리자 대시보드입니다.</h1>
          <p>현재 클랜 운영 상태와 자주 쓰는 관리 메뉴를 한곳에서 확인합니다.</p>
        </div>
        <Link className="button primary" href="/">
          홈페이지 보기
        </Link>
      </section>

      <section className="admin-summary-grid">
        {cards.map(card => (
          <Link className="admin-summary-card" href={card.href} key={card.label}>
            <div className="admin-summary-icon">{card.icon}</div>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}<b>{card.unit}</b></strong>
              <small>{card.note}</small>
            </div>
          </Link>
        ))}
      </section>

      <section className="admin-dashboard-layout">
        <article className="card admin-quick-panel">
          <div className="dashboard-head">
            <div>
              <span>QUICK MANAGEMENT</span>
              <h2>빠른 관리</h2>
            </div>
          </div>

          <div className="admin-quick-grid">
            {quickLinks.map(([href, icon, title, description]) => (
              <Link href={href} key={href}>
                <i>{icon}</i>
                <div>
                  <b>{title}</b>
                  <p>{description}</p>
                </div>
                <span>→</span>
              </Link>
            ))}
          </div>
        </article>

        <aside className="card admin-status-panel">
          <div className="dashboard-head">
            <div>
              <span>CURRENT STATUS</span>
              <h2>운영 현황</h2>
            </div>
          </div>

          <dl>
            <div>
              <dt>최근 공지</dt>
              <dd>{latestNoticeResult.data?.title || "등록된 공지 없음"}</dd>
            </div>
            <div>
              <dt>공지 등록일</dt>
              <dd>
                {latestNoticeResult.data?.created_at
                  ? new Date(latestNoticeResult.data.created_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      hour12: false
                    })
                  : "-"}
              </dd>
            </div>
            <div>
              <dt>경매 연동 투표</dt>
              <dd>{auctionPost?.title || "없음"}</dd>
            </div>
            <div>
              <dt>경매 예정일</dt>
              <dd>
                {auctionPollResult.data?.match_at
                  ? new Date(auctionPollResult.data.match_at).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      hour12: false
                    })
                  : "-"}
              </dd>
            </div>
          </dl>
        </aside>
      </section>
    </>
  );
}
