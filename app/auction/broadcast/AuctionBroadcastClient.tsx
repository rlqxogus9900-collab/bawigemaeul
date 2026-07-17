"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: string;
  current_player_id: string | null;
  current_bid: number;
  current_team_id: string | null;
};

type Team = {
  id: string;
  name: string;
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
};

export default function AuctionBroadcastClient() {
  const [state, setState] = useState<{
    room: Room | null;
    teams: Team[];
    players: Player[];
    bids: Bid[];
  }>({ room: null, teams: [], players: [], bids: [] });

  const [safeArea, setSafeArea] = useState(true);
  const [uiHidden, setUiHidden] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [soldFlash, setSoldFlash] = useState<{ nickname: string; team: string; price: number } | null>(null);

  const previousSold = useRef(new Set<string>());
  const soldStateReady = useRef(false);
  const previousBid = useRef(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/auction/state", { cache: "no-store" });
    if (!response.ok) return;
    const next = await response.json();

    const soldPlayers = (next.players as Player[]).filter((player) => player.status === "sold");
    const newlySold = soldPlayers.find((player) => !previousSold.current.has(player.id));

    if (soldStateReady.current && newlySold) {
      const team = (next.teams as Team[]).find((item) => item.id === newlySold.sold_team_id);
      setSoldFlash({
        nickname: newlySold.nickname,
        team: team?.name || "팀",
        price: newlySold.sold_price || 0
      });
      window.setTimeout(() => setSoldFlash(null), 2600);
    }

    previousSold.current = new Set(soldPlayers.map((player) => player.id));
    soldStateReady.current = true;
    setState(next);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1000);
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
        oscillator.frequency.value = 760;
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.16);
      }
    }
    previousBid.current = bid;
  }, [state.room?.current_bid, soundOn]);

  const room = state.room;
  const currentPlayer = state.players.find((player) => player.id === room?.current_player_id);
  const leadingTeam = state.teams.find((team) => team.id === room?.current_team_id);

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

  return (
    <main className={"auction-broadcast " + (safeArea ? "show-safe-area " : "") + (uiHidden ? "hide-broadcast-ui" : "")}>
      <div className="broadcast-safe-frame" />

      <div className="broadcast-toolbar">
        <button onClick={() => setUiHidden((value) => !value)}>방송 UI {uiHidden ? "표시" : "숨기기"}</button>
        <button onClick={() => setSafeArea((value) => !value)}>세이프 에어리어 {safeArea ? "OFF" : "ON"}</button>
        <button onClick={() => setSoundOn((value) => !value)}>소리 {soundOn ? "ON" : "OFF"}</button>
        <button onClick={() => document.documentElement.requestFullscreen?.()}>전체화면</button>
      </div>

      {!room ? (
        <section className="broadcast-waiting">
          <span>BAWIGEMAEUL LIVE AUCTION</span>
          <h1>경매 시작 대기 중</h1>
        </section>
      ) : (
        <>
          <header className="broadcast-header">
            <span>BAWIGEMAEUL · LIVE AUCTION</span>
            <h1>{room.title}</h1>
            <b>{room.status === "live" ? "LIVE" : room.status.toUpperCase()}</b>
          </header>

          <section className="broadcast-stage">
            <small>현재 경매 선수</small>
            <h2>{currentPlayer?.nickname || "다음 선수 대기"}</h2>
            <div className="broadcast-price">
              <span>현재가</span>
              <strong>{room.current_bid.toLocaleString()}</strong>
              <em>점</em>
            </div>
            <p>{leadingTeam ? `${leadingTeam.name} · ${leadingTeam.captain_nickname}` : "첫 입찰을 기다리는 중"}</p>
          </section>

          <section className="broadcast-team-grid">
            {state.teams.map((team) => (
              <article className={leadingTeam?.id === team.id ? "leading" : ""} key={team.id}>
                <header>
                  <div>
                    <span>{team.name}</span>
                    <h3>{team.captain_nickname}</h3>
                  </div>
                  <strong>{team.budget.toLocaleString()}점</strong>
                </header>
                <div>
                  {(teamPlayers[team.id] || []).map((player: Player) => (
                    <p key={player.id}>
                      <b>{player.nickname}</b>
                      <span>{player.sold_price}점</span>
                    </p>
                  ))}
                  {!(teamPlayers[team.id] || []).length && <em>낙찰 선수 없음</em>}
                </div>
              </article>
            ))}
          </section>

          <footer className="broadcast-history">
            {(state.bids || []).slice(0, 6).map((bid) => (
              <div key={bid.id}>
                <b>{state.teams.find((team) => team.id === bid.team_id)?.name || "팀"}</b>
                <span>{bid.amount.toLocaleString()}점</span>
                <small>{bid.bidder_nickname}</small>
              </div>
            ))}
          </footer>
        </>
      )}

      {soldFlash && (
        <div className="sold-flash">
          <span>SOLD</span>
          <strong>{soldFlash.nickname}</strong>
          <p>{soldFlash.team} · {soldFlash.price.toLocaleString()}점</p>
        </div>
      )}
    </main>
  );
}
