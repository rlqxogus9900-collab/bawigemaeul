"use client";

import SponsorNickname from "@/app/components/SponsorNickname";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: string;
  starting_budget: number;
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
  const [soundOn, setSoundOn] = useState(true);
  const previousBid = useRef(0);
  const previousSoldIds = useRef(new Set<string>());
  const soldStateReady = useRef(false);
  const [bidPulse, setBidPulse] = useState(0);
  const [soldFlash, setSoldFlash] = useState<{ nickname: string; team: string; price: number } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/auction/state", { cache: "no-store" });
    if (!r.ok) return;
    const next: AuctionState = await r.json();
    const soldPlayers = next.players.filter((player) => player.status === "sold");
    const newlySold = soldPlayers.find((player) => !previousSoldIds.current.has(player.id));
    if (soldStateReady.current && newlySold) {
      const team = next.teams.find((item) => item.id === newlySold.sold_team_id);
      setSoldFlash({ nickname: newlySold.nickname, team: team?.name || "팀", price: newlySold.sold_price || 0 });
      window.setTimeout(() => setSoldFlash(null), 2200);
    }
    previousSoldIds.current = new Set(soldPlayers.map((player) => player.id));
    soldStateReady.current = true;
    setState(next);
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1200);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const bid = state.room?.current_bid || 0;
    if (previousBid.current > 0 && bid > previousBid.current) {
      setBidPulse((value) => value + 1);
      if (soundOn) {
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


  const room = state.room;
  const currentPlayer = state.players.find((player) => player.id === room?.current_player_id);
  const currentMinimumBid = currentPlayer?.match_tier
    ? Math.max(Number(state.room?.bid_step || 1), Number(state.room?.tier_min_bids?.[String(currentPlayer.match_tier)] || 0))
    : Number(state.room?.bid_step || 1);
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
        <h2>표시할 경매방이 없습니다</h2>
        <p>운영진이 <b>경매 관리</b>에서 방을 만들면 이 화면에 자동으로 표시됩니다.</p>
        {isStaff && <a className="button" href="/admin/auction">경매 관리로 이동</a>}
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

        <div key={`${room.current_player_id || "none"}-${bidPulse}`} className="auction-current auction-current-animated">
          <small>현재 선수</small>
          <strong>{currentPlayer?.nickname || "선수를 선택하세요"}</strong>
          {currentPlayer && <small className="auction-player-profile-line">{currentPlayer.main_line || "미정"} / {currentPlayer.sub_line || "미정"} · {currentPlayer.match_tier ? `${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"][currentPlayer.match_tier]}티어` : "티어 미정"}{currentPlayer.note ? ` · ${currentPlayer.note}` : ""}</small>}
          {currentPlayer && <small className="auction-minimum-bid-copy">최소 입찰 {currentMinimumBid.toLocaleString()}점</small>}
          <div>
            <span>현재가</span>
            <b className="auction-price-pulse">{room.current_bid.toLocaleString()}점</b>
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

        {room.status === "finished" && (
          <section className="auction-final-result">
            <div className="auction-final-title"><span>AUCTION RESULT</span><h3>경매 최종 결과</h3></div>
            <div className="auction-final-grid">
              {state.teams.map((team) => (
                <article key={team.id}>
                  <header><div><span>{team.name}</span><b className="auction-sponsor-name"><SponsorNickname nickname={team.captain_nickname} /></b><small>{team.captain_match_tier ? `내전 ${["","Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][team.captain_match_tier]}티어` : "내전 티어 미정"} · {team.captain_average_tier || "롤 티어 미정"}</small></div><strong>잔여 {team.budget.toLocaleString()}점</strong></header>
                  <div>{(teamPlayers[team.id] || []).map((player: Player) => <p key={player.id}><b className="auction-sponsor-name"><SponsorNickname nickname={player.nickname} /></b><span>{(player.sold_price || 0).toLocaleString()}점</span></p>)}</div>
                </article>
              ))}
            </div>
          {isStaff && <a className="button auction-new-room-link" href="/admin/auction">새 경매 시작</a>}</section>
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
                <h3 className="auction-sponsor-name"><SponsorNickname nickname={team.captain_nickname} /></h3><small>{team.captain_match_tier ? `내전 ${["","Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][team.captain_match_tier]}티어` : "내전 티어 미정"} · {team.captain_average_tier || "롤 티어 미정"}</small>
              </div>
              <strong>{team.budget.toLocaleString()}점</strong>
            </header>

            <div className="auction-team-members">
              {(teamPlayers[team.id] || []).map((player: Player) => (
                <div key={player.id}>
                  <b className="auction-sponsor-name"><SponsorNickname nickname={player.nickname} /></b>
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
              <div className="auction-bid-row" key={auctionBid.id}>
                <b>{state.teams.find((team) => team.id === auctionBid.team_id)?.name || "팀"}</b>
                <span>{auctionBid.amount.toLocaleString()}점</span>
                <small>{auctionBid.bidder_nickname || "입찰자"}</small>
                <time>{new Date(auctionBid.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
              </div>
            ))}
            {!state.bids.length && <p className="muted">입찰 기록이 없습니다.</p>}
          </div>
        </article>
      </section>
      {soldFlash && <div className="auction-sold-flash"><span>SOLD</span><strong className="auction-sponsor-name"><SponsorNickname nickname={soldFlash.nickname} /></strong><p>{soldFlash.team} · {soldFlash.price.toLocaleString()}점</p></div>}
    </div>
  );
}
