"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: string;
  starting_budget: number;
  bid_step: number;
  current_player_id: string | null;
  current_bid: number;
  current_team_id: string | null;
};

type Team = {
  id: string;
  name: string;
  captain_member_id: string | null;
  captain_nickname: string;
  budget: number;
};

type Player = {
  id: string;
  nickname: string;
  status: string;
  sold_team_id: string | null;
  sold_price: number | null;
};

type Bid = {
  id: number;
  team_id: string;
  amount: number;
  bidder_nickname: string;
  created_at: string;
};

type AuctionState = {
  room: Room | null;
  teams: Team[];
  players: Player[];
  bids: Bid[];
};

export default function AuctionLiveClient({
  currentUserId,
  currentNickname,
  isStaff
}: {
  currentUserId: string | null;
  currentNickname: string | null;
  isStaff: boolean;
}) {
  const [state, setState] = useState<AuctionState>({
    room: null,
    teams: [],
    players: [],
    bids: []
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState(1000);
  const [step, setStep] = useState(10);
  const [soundOn, setSoundOn] = useState(true);
  const previousBid = useRef(0);

  const load = useCallback(async () => {
    const r = await fetch("/api/auction/state", { cache: "no-store" });
    if (r.ok) setState(await r.json());
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1200);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const bid = state.room?.current_bid || 0;
    if (soundOn && previousBid.current > 0 && bid > previousBid.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.frequency.value = 620;
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.12);
      }
    }
    previousBid.current = bid;
  }, [state.room?.current_bid, soundOn]);

  const adminAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!state.room) return;
    setBusy(true);
    setError("");

    const r = await fetch("/api/admin/auction/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: state.room.id, action, ...extra })
    });

    const result = await r.json().catch(() => ({}));
    if (!r.ok) setError(result.error || "처리 실패");
    await load();
    setBusy(false);
  };

  const bid = async (teamId: string) => {
    if (!state.room) return;
    setBusy(true);
    setError("");

    const r = await fetch("/api/auction/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: state.room.id, teamId })
    });

    const result = await r.json().catch(() => ({}));
    if (!r.ok) setError(result.error || "입찰 실패");
    await load();
    setBusy(false);
  };

  const create = async () => {
    setBusy(true);
    setError("");

    const r = await fetch("/api/admin/auction/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startingBudget: budget, bidStep: step })
    });

    const result = await r.json().catch(() => ({}));
    if (!r.ok) setError(result.error || "생성 실패");
    await load();
    setBusy(false);
  };

  const room = state.room;
  const currentPlayer = state.players.find((player) => player.id === room?.current_player_id);
  const leadingTeam = state.teams.find((team) => team.id === room?.current_team_id);
  const myTeam = state.teams.find((team) => team.captain_member_id === currentUserId);
  const waiting = state.players.filter(
    (player) => player.status === "waiting" || player.status === "unsold"
  );

  const teamPlayers = useMemo(
    () =>
      Object.fromEntries(
        state.teams.map((team) => [
          team.id,
          state.players.filter((player) => player.sold_team_id === team.id)
        ])
      ),
    [state.teams, state.players]
  );

  if (!room) {
    return (
      <section className="card auction-empty">
        <h2>진행 중인 경매가 없습니다</h2>
        <p>경매 연동 정기내전 투표의 참가자와 팀장을 자동으로 불러옵니다.</p>

        {isStaff && (
          <div className="auction-create-row">
            <label>
              팀 예산
              <input
                min={0}
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </label>
            <label>
              입찰 단위
              <input
                min={1}
                type="number"
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
              />
            </label>
            <button className="button" disabled={busy} onClick={create}>
              {busy ? "생성 중..." : "경매방 생성"}
            </button>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
      </section>
    );
  }

  return (
    <div className="auction-live-shell">
      <section className="auction-stage card">
        <div className="dashboard-head">
          <div>
            <span>LIVE AUCTION · {room.status.toUpperCase()}</span>
            <h2>{room.title}</h2>
          </div>
          <div className="auction-status-tools">
            <b>1.2초 자동 동기화</b>
            <button type="button" onClick={() => setSoundOn((value) => !value)}>
              소리 {soundOn ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <div className="auction-current">
          <small>현재 선수</small>
          <strong>{currentPlayer?.nickname || "선수를 선택하세요"}</strong>
          <div>
            <span>현재가</span>
            <b>{room.current_bid.toLocaleString()}점</b>
          </div>
          <em>
            {leadingTeam
              ? `${leadingTeam.name} · ${leadingTeam.captain_nickname}`
              : "입찰 대기"}
          </em>
        </div>

        {currentNickname && (
          <div className="auction-user-role">
            <span>{currentNickname}</span>
            <b>
              {isStaff
                ? "운영진 경매 진행 권한"
                : myTeam
                  ? `${myTeam.name} 팀장 · 직접 입찰 가능`
                  : "관전 모드"}
            </b>
          </div>
        )}

        <div className="auction-control-row">
          {isStaff && room.status === "ready" && (
            <button disabled={busy} onClick={() => adminAction("start")}>
              경매 시작
            </button>
          )}

          {state.teams.map((team) => {
            const canBid = isStaff || team.captain_member_id === currentUserId;
            return (
              <button
                key={team.id}
                className={myTeam?.id === team.id ? "my-team-bid" : ""}
                disabled={busy || !currentPlayer || room.status !== "live" || !canBid}
                onClick={() => bid(team.id)}
              >
                {team.name} +{room.bid_step}
              </button>
            );
          })}

          {isStaff && (
            <>
              <button disabled={busy || !leadingTeam} onClick={() => adminAction("sell")}>
                낙찰
              </button>
              <button disabled={busy || !currentPlayer} onClick={() => adminAction("unsold")}>
                유찰
              </button>
              <button disabled={busy} onClick={() => adminAction("finish")}>
                경매 종료
              </button>
            </>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="auction-team-board">
        {state.teams.map((team) => (
          <article
            className={
              "card auction-team-card " +
              (leadingTeam?.id === team.id ? "is-leading " : "") +
              (myTeam?.id === team.id ? "is-my-team" : "")
            }
            key={team.id}
          >
            <header>
              <div>
                <span>{team.name}</span>
                <h3>{team.captain_nickname}</h3>
              </div>
              <strong>{team.budget.toLocaleString()}점</strong>
            </header>

            <div className="auction-team-members">
              {(teamPlayers[team.id] || []).map((player: Player) => (
                <div key={player.id}>
                  <b>{player.nickname}</b>
                  <span>{player.sold_price}점</span>
                </div>
              ))}
              {!(teamPlayers[team.id] || []).length && <em>낙찰 선수 없음</em>}
            </div>
          </article>
        ))}
      </section>

      <section className="auction-bottom-grid">
        <article className="card">
          <div className="dashboard-head">
            <div>
              <span>WAITING</span>
              <h2>대기 선수</h2>
            </div>
            <small>{waiting.length}명</small>
          </div>

          <div className="auction-waiting-grid">
            {waiting.map((player) => (
              <button
                key={player.id}
                className={currentPlayer?.id === player.id ? "active" : ""}
                disabled={!isStaff || busy}
                onClick={() => adminAction("nominate", { playerId: player.id })}
              >
                {player.nickname}
                <small>{player.status === "unsold" ? "유찰" : ""}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="dashboard-head">
            <div>
              <span>HISTORY</span>
              <h2>입찰 기록</h2>
            </div>
          </div>

          <div className="auction-bid-history">
            {state.bids.map((auctionBid) => (
              <div key={auctionBid.id}>
                <b>
                  {state.teams.find((team) => team.id === auctionBid.team_id)?.name || "팀"}
                </b>
                <span>{auctionBid.amount.toLocaleString()}점</span>
                <small>{auctionBid.bidder_nickname}</small>
              </div>
            ))}
            {!state.bids.length && <p className="muted">입찰 기록이 없습니다.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
