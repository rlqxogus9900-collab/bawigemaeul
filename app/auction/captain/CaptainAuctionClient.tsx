"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: "ready" | "live" | "finished";
  bid_step: number;
  current_player_id: string | null;
  current_bid: number;
  tier_min_bids?: Record<string, number> | null;
  current_team_id: string | null;
};
type Team = {
  id: string;
  name: string;
  captain_member_id: string | null;
  captain_nickname: string;
  captain_match_tier: number | null;
  captain_average_tier: string | null;
  base_budget: number;
  tier_bonus: number;
  starting_budget: number;
  budget: number;
};
type Player = {
  id: string;
  nickname: string;
  status: string;
  sold_team_id: string | null;
  sold_price: number | null;
  main_line?: string | null;
  sub_line?: string | null;
  match_tier?: number | null;
  note?: string | null;
};
type Bid = {
  id: number;
  team_id: string;
  amount: number;
  bidder_nickname: string;
  created_at: string;
};
type State = { room: Room | null; teams: Team[]; players: Player[]; bids: Bid[] };
type Flash =
  | { kind: "unsold"; nickname: string }
  | { kind: "finish" }
  | null;

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
  const [staffTeamId, setStaffTeamId] = useState<string>("");
  const [finishOpen, setFinishOpen] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const previousState = useRef<State | null>(null);
  const stateReady = useRef(false);
  const autoUnsoldPlayerId = useRef<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/auction/state", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as State;

    if (stateReady.current && previousState.current) {
      const prev = previousState.current;
      if (prev.room?.status !== "finished" && next.room?.status === "finished") {
        setFlash({ kind: "finish" });
        window.setTimeout(() => setFlash(null), 2800);
      } else if (prev.room?.current_player_id && !next.room?.current_player_id) {
        const changed = next.players.find((player) => player.id === prev.room?.current_player_id);
        if (changed?.status === "unsold") {
          setFlash({ kind: "unsold", nickname: changed.nickname });
          window.setTimeout(() => setFlash(null), 2100);
        }
      }
    }

    previousState.current = next;
    stateReady.current = true;
    setState(next);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (isStaff && state.teams.length && !state.teams.some((team) => team.id === staffTeamId)) {
      const own = state.teams.find((team) => team.captain_member_id === currentUserId);
      setStaffTeamId(own?.id || state.teams[0].id);
    }
  }, [isStaff, state.teams, staffTeamId, currentUserId]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFinishOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    autoUnsoldPlayerId.current = null;
    if (!state.room?.current_player_id || state.room.status !== "live") {
      setTimeLeft(15);
      return;
    }
    setTimeLeft(15);
  }, [state.room?.current_player_id, state.room?.current_bid, state.room?.status]);

  useEffect(() => {
    if (!state.room?.current_player_id || state.room.status !== "live") return;
    const countdown = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(countdown);
  }, [state.room?.current_player_id, state.room?.current_bid, state.room?.status]);

  useEffect(() => {
    const room = state.room;
    const playerId = room?.current_player_id;
    if (!isStaff || !room || room.status !== "live" || !playerId || timeLeft !== 0) return;
    if (autoUnsoldPlayerId.current === playerId) return;

    autoUnsoldPlayerId.current = playerId;
    void (async () => {
      setBusy(true);
      setError("");
      const response = await fetch("/api/admin/auction/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, action: "unsold" })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        autoUnsoldPlayerId.current = null;
        setError(result.error || "자동 유찰 처리 실패");
      }
      await load();
      setBusy(false);
    })();
  }, [timeLeft, isStaff, state.room, load]);

  const room = state.room;
  const myTeam = state.teams.find((team) => team.captain_member_id === currentUserId);
  const activeTeam = isStaff
    ? state.teams.find((team) => team.id === staffTeamId) || myTeam || state.teams[0]
    : myTeam;
  const currentPlayer = state.players.find((player) => player.id === room?.current_player_id);
  const currentMinimumBid = currentPlayer?.match_tier
    ? Math.max(Number(state.room?.bid_step || 1), Number(state.room?.tier_min_bids?.[String(currentPlayer.match_tier)] || 0))
    : Number(state.room?.bid_step || 1);
  const leadingTeam = state.teams.find((team) => team.id === room?.current_team_id);
  const activePlayers = useMemo(
    () => state.players.filter((player) => player.sold_team_id === activeTeam?.id),
    [state.players, activeTeam?.id]
  );
  const waitingPlayers = state.players.filter(
    (player) => player.status === "waiting" || player.status === "unsold"
  );

  const adminAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!room || !isStaff) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/auction/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, action, ...extra })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || "경매 처리 실패");
    await load();
    setBusy(false);
  };

  const bid = async () => {
    if (!room || !activeTeam) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/auction/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, teamId: activeTeam.id })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || "입찰 실패");
    await load();
    setBusy(false);
  };

  const finishAuction = async () => {
    setFinishOpen(false);
    await adminAction("finish");
  };

  if (!currentUserId) {
    return <section className="card captain-denied"><h2>로그인이 필요합니다</h2><p>팀장 계정으로 로그인한 뒤 이용해 주세요.</p></section>;
  }

  if (!room) {
    return <section className="card captain-denied"><h2>진행 중인 경매가 없습니다</h2><p>경매 관리에서 방을 만들면 자동으로 표시됩니다.</p></section>;
  }

  if (!activeTeam && !isStaff) {
    return <section className="card captain-denied"><h2>팀장 전용 페이지입니다</h2><p>{currentNickname} 계정은 현재 경매의 팀장으로 지정되지 않았습니다.</p></section>;
  }

  return (
    <div className="captain-auction-shell">
      {isStaff && (
        <section className="card captain-admin-panel">
          <div className="dashboard-head">
            <div><span>ADMIN CONTROL</span><h2>관리자 경매 진행</h2></div>
            <b>팀장 전용 화면에서 전체 운영 가능</b>
          </div>

          <div className="captain-admin-team-select">
            <label>
              관리자 입찰 팀
              <select value={activeTeam?.id || ""} onChange={(event) => setStaffTeamId(event.target.value)}>
                {state.teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name} · {team.captain_nickname}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="captain-admin-controls">
            {room.status === "finished" ? (
              <a className="captain-new-auction-button" href="/admin/auction">새 경매 시작</a>
            ) : (
              <>
                {room.status === "ready" && (
                  <button disabled={busy} onClick={() => adminAction("start")}>경매 시작</button>
                )}
                <button disabled={busy || !leadingTeam || room.status !== "live"} onClick={() => adminAction("sell")}>낙찰</button>
                <button disabled={busy || !currentPlayer || room.status !== "live"} onClick={() => adminAction("unsold")}>유찰</button>
                <button className="danger" disabled={busy} onClick={() => setFinishOpen(true)}>경매 종료</button>
              </>
            )}
          </div>

          <div className="captain-admin-nominate">
            <span>선수 지명</span>
            <div>
              {waitingPlayers.map((player) => (
                <button
                  key={player.id}
                  className={currentPlayer?.id === player.id ? "active" : ""}
                  disabled={busy || room.status === "finished"}
                  onClick={() => adminAction("nominate", { playerId: player.id })}
                >
                  {player.nickname}{player.status === "unsold" ? " · 유찰" : ""}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="captain-bid-stage card">
        <div className="captain-identity">
          <div>
            <span>{activeTeam?.name || "팀 미정"}</span>
            <h2>{activeTeam?.captain_nickname || currentNickname}</h2>
            {activeTeam && (
              <small>
                내전 {activeTeam.captain_match_tier ? `${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"][activeTeam.captain_match_tier]}티어` : "미정"}
                {" · "}{activeTeam.captain_average_tier || "롤 티어 미정"}
              </small>
            )}
          </div>
          <strong>남은 예산 {(activeTeam?.budget || 0).toLocaleString()}점</strong>
        </div>

        <div className="captain-current-player">
          <small>현재 선수</small>
          <h1 className="captain-player-nickname">{currentPlayer?.nickname || (room.status === "finished" ? "경매 종료" : "선수 지명 대기")}</h1>
          {currentPlayer && <p className="auction-player-profile-line">주라인 {currentPlayer.main_line || "미정"} · 부라인 {currentPlayer.sub_line || "미정"} · 내전티어 {currentPlayer.match_tier ? `${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"][currentPlayer.match_tier]}티어` : "미정"}{currentPlayer.note ? ` · ${currentPlayer.note}` : ""}</p>}
          {currentPlayer && <p className="auction-minimum-bid-copy">최소 입찰 {currentMinimumBid.toLocaleString()}점</p>}
          {room.status === "live" && currentPlayer && (
            <div className={`captain-countdown ${timeLeft <= 5 ? "urgent" : ""} ${timeLeft === 0 ? "expired" : ""}`}>
              <span>{timeLeft === 0 ? "시간 종료" : "남은 시간"}</span><strong>{timeLeft}</strong><em>초</em>
            </div>
          )}
          <div><span>현재가</span><strong>{room.current_bid.toLocaleString()}점</strong></div>
          <p>{leadingTeam ? `${leadingTeam.name} 최고 입찰 중` : "입찰 대기"}</p>
        </div>

        <button
          className={"captain-bid-button " + (leadingTeam?.id === activeTeam?.id ? "is-leading" : "")}
          disabled={busy || !activeTeam || !currentPlayer || room.status !== "live"}
          onClick={bid}
        >
          {busy
            ? "처리 중..."
            : leadingTeam?.id === activeTeam?.id
              ? `현재 최고 입찰 · 추가 ${room.bid_step}점`
              : `${activeTeam?.name || "팀"}으로 +${room.bid_step}점 입찰`}
        </button>
        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="captain-side-grid">
        <article className="card">
          <div className="dashboard-head"><div><span>SELECTED TEAM</span><h2>{isStaff ? "선택 팀 선수" : "우리 팀 선수"}</h2></div></div>
          <div className="captain-player-list">
            {activePlayers.map((player) => (
              <p key={player.id}><b>{player.nickname}</b><span>{(player.sold_price || 0).toLocaleString()}점</span></p>
            ))}
            {!activePlayers.length && <em>아직 낙찰 선수가 없습니다.</em>}
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

      {finishOpen && (
        <div className="auction-modal-backdrop" role="presentation" onMouseDown={() => setFinishOpen(false)}>
          <section
            className="auction-finish-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auction-finish-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span>AUCTION FINISH</span>
            <h2 id="auction-finish-title">경매를 종료하시겠습니까?</h2>
            <p>종료하면 모든 화면에 종료 애니메이션이 나온 뒤 최종 결과 화면으로 전환됩니다.</p>
            <div>
              <button className="cancel" onClick={() => setFinishOpen(false)}>취소</button>
              <button className="confirm" onClick={finishAuction}>경매 종료</button>
            </div>
          </section>
        </div>
      )}

      {flash?.kind === "unsold" && (
        <div className="auction-event-flash auction-event-unsold">
          <span>NO BID</span><strong>유찰</strong><p>{flash.nickname}</p>
        </div>
      )}
      {flash?.kind === "finish" && (
        <div className="auction-event-flash auction-event-finish">
          <span>AUCTION COMPLETE</span><strong>경매 종료</strong><p>최종 결과를 집계합니다</p>
        </div>
      )}
    </div>
  );
}
