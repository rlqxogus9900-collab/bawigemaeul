"use client";
import SponsorNickname from "@/app/components/SponsorNickname";

type PollRow = {
  id: string;
  post_id: string;
  poll_type: string;
  status: string;
  match_at: string | null;
  vote_deadline: string | null;
  is_auction_source: boolean;
  board_posts:
    | {
        title: string;
        author_nickname: string;
      }
    | Array<{
        title: string;
        author_nickname: string;
      }>
    | null;
};

type VoteRow = {
  poll_id: string;
  option_id: string;
  member_id: string;
  member_nickname: string;
};

type CaptainRow = {
  poll_id: string;
  member_id: string;
  member_nickname: string;
};

function postTitle(poll: PollRow) {
  if (Array.isArray(poll.board_posts)) {
    return poll.board_posts[0]?.title || "제목 없음";
  }
  return poll.board_posts?.title || "제목 없음";
}

export default function PollAdminClient({
  polls,
  attendingVotes,
  captains
}: {
  polls: PollRow[];
  attendingVotes: VoteRow[];
  captains: CaptainRow[];
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

  async function updateDeadline(pollId: string) {
    const deadlineDate = window.prompt(
      "새 투표 마감 날짜를 입력하세요. 예: 2026-07-25"
    );
    if (!deadlineDate) return;

    const deadlineTime = window.prompt(
      "새 투표 마감 시간을 입력하세요. 예: 19:30"
    );
    if (!deadlineTime) return;

    const response = await fetch(`/api/admin/polls/${pollId}/deadline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadlineDate, deadlineTime })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.message || "마감시간 변경에 실패했습니다.");
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

  async function toggleCaptain(
    pollId: string,
    memberId: string,
    isCaptain: boolean
  ) {
    const response = await fetch(`/api/admin/polls/${pollId}/captains`, {
      method: isCaptain ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId })
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      window.alert(result?.message || "팀장 변경에 실패했습니다.");
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
          <p className="muted">
            참가자 중 팀장을 지정하고 경매에 사용할 투표를 선택합니다.
          </p>
        </div>
      </div>

      <div className="poll-admin-list poll-admin-list-v2">
        {polls.map(poll => {
          const participants = attendingVotes.filter(
            vote => vote.poll_id === poll.id
          );
          const pollCaptains = captains.filter(
            captain => captain.poll_id === poll.id
          );
          const captainIds = new Set(
            pollCaptains.map(captain => captain.member_id)
          );
          const auctionCount = participants.filter(
            participant => !captainIds.has(participant.member_id)
          ).length;

          return (
            <article
              key={poll.id}
              className={poll.is_auction_source ? "active" : ""}
            >
              <div className="poll-admin-main">
                <div className="poll-admin-summary">
                  <span>
                    {poll.is_auction_source
                      ? "🔨 경매 연동 중"
                      : "정기내전 투표"}
                  </span>
                  <h2>{postTitle(poll)}</h2>
                  <p>
                    내전 ·{" "}
                    {poll.match_at
                      ? new Date(poll.match_at).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                          hour12: false
                        })
                      : "일정 미정"}
                  </p>
                  <p>
                    마감 ·{" "}
                    {poll.vote_deadline
                      ? new Date(poll.vote_deadline).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                          hour12: false
                        })
                      : "마감 미정"}
                  </p>

                  <div className="poll-admin-counts">
                    <b>참가 {participants.length}명</b>
                    <b>팀장 {pollCaptains.length}명</b>
                    <b>경매 {auctionCount}명</b>
                  </div>
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
                    onClick={() => updateDeadline(poll.id)}
                  >
                    마감시간 변경
                  </button>
                  <button
                    className="button"
                    onClick={() =>
                      toggleStatus(
                        poll.id,
                        poll.status === "open" ? "closed" : "open"
                      )
                    }
                  >
                    {poll.status === "open" ? "투표 종료" : "투표 재개"}
                  </button>
                </div>
              </div>

              <section className="captain-manager">
                <div className="captain-manager-head">
                  <div>
                    <b>참가자·팀장 설정</b>
                    <small>
                      팀장으로 지정하면 경매 선수 명단에서 자동 제외됩니다.
                    </small>
                  </div>
                </div>

                <div className="captain-member-grid">
                  {participants.map(participant => {
                    const isCaptain = captainIds.has(participant.member_id);

                    return (
                      <button
                        type="button"
                        key={participant.member_id}
                        className={isCaptain ? "captain" : ""}
                        onClick={() =>
                          toggleCaptain(
                            poll.id,
                            participant.member_id,
                            isCaptain
                          )
                        }
                      >
                        <span>{isCaptain ? "⭐" : "👤"}</span>
                        <b><SponsorNickname nickname={participant.member_nickname} /></b>
                        <small>
                          {isCaptain ? "팀장 해제" : "팀장 지정"}
                        </small>
                      </button>
                    );
                  })}

                  {!participants.length && (
                    <p className="muted">
                      아직 참가를 선택한 클랜원이 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </article>
          );
        })}

        {!polls.length && (
          <p className="muted">정기내전 투표가 없습니다.</p>
        )}
      </div>
    </section>
  );
}
