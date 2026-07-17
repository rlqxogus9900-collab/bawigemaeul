"use client";

export default function PollAdminClient({
  polls
}: {
  polls: Array<{
    id: string;
    post_id: string;
    poll_type: string;
    status: string;
    match_at: string | null;
    vote_deadline: string | null;
    is_auction_source: boolean;
    board_posts: {
      title: string;
      author_nickname: string;
    } | null;
  }>;
}) {
  async function setAuctionSource(pollId: string) {
    const response = await fetch(`/api/admin/polls/${pollId}/auction-source`, {
      method: "POST"
    });
    if (!response.ok) {
      window.alert("경매 연동 설정에 실패했습니다.");
      return;
    }
    window.location.reload();
  }

  async function toggleStatus(pollId: string, status: string) {
    const response = await fetch(`/api/admin/polls/${pollId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      window.alert("투표 상태 변경에 실패했습니다.");
      return;
    }
    window.location.reload();
  }

  return (
    <section className="card poll-admin-page">
      <div className="member-page-head">
        <div>
          <span>STAFF ONLY</span>
          <h1>정기내전 투표 관리</h1>
          <p className="muted">정기내전 투표 중 경매에 사용할 투표를 선택합니다.</p>
        </div>
      </div>

      <div className="poll-admin-list">
        {polls.map(poll => (
          <article key={poll.id} className={poll.is_auction_source ? "active" : ""}>
            <div>
              <span>{poll.is_auction_source ? "🔨 경매 연동 중" : "정기내전 투표"}</span>
              <h2>{poll.board_posts?.title || "제목 없음"}</h2>
              <p>
                {poll.match_at ? new Date(poll.match_at).toLocaleString("ko-KR") : "일정 미정"}
              </p>
            </div>
            <div className="poll-admin-actions">
              <button
                className="button primary"
                onClick={() => setAuctionSource(poll.id)}
              >
                경매에 사용
              </button>
              <button
                className="button"
                onClick={() => toggleStatus(poll.id, poll.status === "open" ? "closed" : "open")}
              >
                {poll.status === "open" ? "투표 종료" : "투표 재개"}
              </button>
            </div>
          </article>
        ))}
        {!polls.length && <p className="muted">정기내전 투표가 없습니다.</p>}
      </div>
    </section>
  );
}
