"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: "ready" | "live" | "finished";
  bid_step: number;
  current_player_id: string | null;
  current_bid: number;
  current_team_id: string | null;
};
type Team = { id: string; name: string; captain_member_id: string | null; captain_nickname: string; budget: number };
type Player = { id: string; nickname: string; status: string; sold_team_id: string | null; sold_price: number | null };
type Bid = { id: number; team_id: string; amount: number; bidder_nickname: string; created_at: string };
type State = { room: Room | null; teams: Team[]; players: Player[]; bids: Bid[] };

export default function CaptainAuctionClient({
  currentUserId,
  currentNickname,
  isStaff
}: {
  currentUserId: string | null;
  currentNickname: string | null;
  isStaff: boolean;
}) {
  const [state, setState] = useState<State>({ room: null, teams: [], players: [], bids: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/auction/state", { cache: "no-store" });
    if (response.ok) setState(await response.json());
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const room = state.room;
  const myTeam = state.teams.find((team) => team.captain_member_id === currentUserId);
  const currentPlayer = state.players.find((player) => player.id === room?.current_player_id);
  const leadingTeam = state.teams.find((team) => team.id === room?.current_team_id);
  const myPlayers = useMemo(
    () => state.players.filter((player) => player.sold_team_id === myTeam?.id),
    [state.players, myTeam?.id]
  );

  const bid = async () => {
    if (!room || !myTeam) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/auction/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, teamId: myTeam.id })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || "입찰 실패");
    await load();
    setBusy(false);
  };

  if (!currentUserId) {
    return <section className="card captain-denied"><h2>로그인이 필요합니다</h2><p>팀장 계정으로 로그인한 뒤 이용해 주세요.</p></section>;
  }

  if (!room) {
    return <section className="card captain-denied"><h2>진행 중인 경매가 없습니다</h2><p>경매 관리에서 방을 만들면 자동으로 표시됩니다.</p></section>;
  }

  if (!myTeam && !isStaff) {
    return <section className="card captain-denied"><h2>팀장 전용 페이지입니다</h2><p>{currentNickname} 계정은 현재 경매의 팀장으로 지정되지 않았습니다.</p></section>;
  }

  const activeTeam = myTeam || state.teams[0];

  return (
    <div className="captain-auction-shell">
      <section className="captain-bid-stage card">
        <div className="captain-identity">
          <div><span>{activeTeam.name}</span><h2>{activeTeam.captain_nickname}</h2></div>
          <strong>남은 예산 {activeTeam.budget.toLocaleString()}점</strong>
        </div>

        <div className="captain-current-player">
          <small>현재 선수</small>
          <h1>{currentPlayer?.nickname || "선수 지명 대기"}</h1>
          <div><span>현재가</span><strong>{room.current_bid.toLocaleString()}점</strong></div>
          <p>{leadingTeam ? `${leadingTeam.name} 최고 입찰 중` : "입찰 대기"}</p>
        </div>

        <button
          className={"captain-bid-button " + (leadingTeam?.id === activeTeam.id ? "is-leading" : "")}
          disabled={busy || !currentPlayer || room.status !== "live"}
          onClick={bid}
        >
          {busy
            ? "입찰 처리 중..."
            : leadingTeam?.id === activeTeam.id
              ? `현재 최고 입찰 · 추가 ${room.bid_step}점`
              : `${activeTeam.name}으로 +${room.bid_step}점 입찰`}
        </button>
        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="captain-side-grid">
        <article className="card">
          <div className="dashboard-head"><div><span>MY TEAM</span><h2>우리 팀 선수</h2></div></div>
          <div className="captain-player-list">
            {myPlayers.map((player) => (
              <p key={player.id}><b>{player.nickname}</b><span>{(player.sold_price || 0).toLocaleString()}점</span></p>
            ))}
            {!myPlayers.length && <em>아직 낙찰 선수가 없습니다.</em>}
          </div>
        </article>

        <article className="card">
          <div className="dashboard-head"><div><span>RECENT BIDS</span><h2>최근 입찰</h2></div></div>
          <div className="captain-player-list">
            {state.bids.slice(0, 8).map((bidItem) => (
              <p key={bidItem.id}>
                <b>{state.teams.find((team) => team.id === bidItem.team_id)?.name || "팀"}</b>
                <span>{bidItem.amount.toLocaleString()}점 · {bidItem.bidder_nickname}</span>
              </p>
            ))}
            {!state.bids.length && <em>입찰 기록이 없습니다.</em>}
          </div>
        </article>
      </section>
    </div>
  );
}
