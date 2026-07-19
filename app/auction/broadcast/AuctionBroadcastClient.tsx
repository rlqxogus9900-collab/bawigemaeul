"use client";

import SponsorNickname from "@/app/components/SponsorNickname";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: "ready" | "live" | "finished";
  current_player_id: string | null;
  current_bid: number;
  bid_step: number;
  tier_min_bids?: Record<string, number> | null;
  current_team_id: string | null;
};

type Team = {
  id: string;
  name: string;
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
};

type Flash =
  | { kind: "sold"; nickname: string; team: string; price: number }
  | { kind: "unsold"; nickname: string }
  | { kind: "finish" }
  | null;

type AuctionState = { room: Room | null; teams: Team[]; players: Player[]; bids: Bid[] };

export default function AuctionBroadcastClient() {
  const [state, setState] = useState<AuctionState>({ room: null, teams: [], players: [], bids: [] });
  const [safeArea, setSafeArea] = useState(true);
  const [uiHidden, setUiHidden] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  const previousState = useRef<AuctionState | null>(null);
  const stateReady = useRef(false);
  const previousBid = useRef(0);

  const playTone = useCallback((frequency: number, duration: number, volume = 0.06) => {
    if (!soundOn) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }, [soundOn]);

  const load = useCallback(async () => {
    const response = await fetch("/api/auction/state", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as AuctionState;

    if (stateReady.current && previousState.current) {
      const prev = previousState.current;

      if (prev.room?.status !== "finished" && next.room?.status === "finished") {
        setFlash({ kind: "finish" });
        playTone(380, 0.7, 0.09);
        window.setTimeout(() => setFlash(null), 3000);
      } else if (prev.room?.current_player_id && !next.room?.current_player_id) {
        const changed = next.players.find((player) => player.id === prev.room?.current_player_id);
        if (changed?.status === "sold") {
          const team = next.teams.find((item) => item.id === changed.sold_team_id);
          setFlash({
            kind: "sold",
            nickname: changed.nickname,
            team: team?.name || "팀",
            price: changed.sold_price || 0
          });
          playTone(880, 0.32, 0.08);
          window.setTimeout(() => setFlash(null), 2600);
        } else if (changed?.status === "unsold") {
          setFlash({ kind: "unsold", nickname: changed.nickname });
          playTone(180, 0.42, 0.1);
          window.setTimeout(() => setFlash(null), 2200);
        }
      }
    }

    previousState.current = next;
    stateReady.current = true;
    setState(next);
  }, [playTone]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const bid = state.room?.current_bid || 0;
    if (previousBid.current > 0 && bid > previousBid.current) playTone(760, 0.16);
    previousBid.current = bid;
  }, [state.room?.current_bid, playTone]);

  useEffect(() => {
    if (!state.room?.current_player_id || state.room.status !== "live") {
      setTimeLeft(15);
      return;
    }
    setTimeLeft(15);
  }, [state.room?.current_player_id, state.room?.current_bid, state.room?.status]);

  useEffect(() => {
    if (!state.room?.current_player_id || state.room.status !== "live") return;
    const countdown = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [state.room?.current_player_id, state.room?.status, state.room?.current_bid]);

  const room = state.room;
  const currentPlayer = state.players.find((player) => player.id === room?.current_player_id);
  const currentMinimumBid = currentPlayer?.match_tier
    ? Math.max(Number(state.room?.bid_step || 1), Number(state.room?.tier_min_bids?.[String(currentPlayer.match_tier)] || 0))
    : Number(state.room?.bid_step || 1);
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
      ) : room.status === "finished" ? (
        <section className="broadcast-final">
          <header>
            <span>AUCTION RESULT</span>
            <h1>경매 최종 결과</h1>
            <p>새 경매가 시작되기 전까지 결과가 유지됩니다.</p>
          </header>
          <div className="broadcast-final-grid">
            {state.teams.map((team) => (
              <article key={team.id}>
                <header>
                  <div>
                    <span>{team.name}</span>
                    <h2 className="auction-sponsor-name"><SponsorNickname nickname={team.captain_nickname} /></h2>
                    <small>
                      내전 {team.captain_match_tier ? `${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"][team.captain_match_tier]}티어` : "미정"}
                      {" · "}{team.captain_average_tier || "롤 티어 미정"}
                    </small>
                  </div>
                  <strong>{team.budget.toLocaleString()}점</strong>
                </header>
                <div className="broadcast-budget-facts">
                  <span>시작 {team.starting_budget.toLocaleString()}</span>
                  <span>보너스 +{team.tier_bonus.toLocaleString()}</span>
                  <span>사용 {(team.starting_budget - team.budget).toLocaleString()}</span>
                </div>
                <div className="broadcast-final-players">
                  {(teamPlayers[team.id] || []).map((player: Player) => (
                    <p key={player.id}><b className="auction-sponsor-name"><SponsorNickname nickname={player.nickname} /></b><span>{(player.sold_price || 0).toLocaleString()}점</span></p>
                  ))}
                  {!(teamPlayers[team.id] || []).length && <em>낙찰 선수 없음</em>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <header className="broadcast-header">
            <span>BAWIGEMAEUL · LIVE AUCTION</span>
            <h1>{room.title}</h1>
            <b>{room.status === "live" ? "LIVE" : "READY"}</b>
          </header>

          <section className="broadcast-stage">
            <small>현재 경매 선수</small>
            <h2 className="broadcast-player-nickname">{currentPlayer?.nickname || "다음 선수 대기"}</h2>
            <div className={`broadcast-countdown ${timeLeft <= 5 ? "urgent" : ""} ${timeLeft === 0 ? "expired" : ""}`}>
              <span>{timeLeft === 0 ? "시간 종료" : "남은 시간"}</span>
              <strong>{timeLeft}</strong><em>초</em>
            </div>
            <div className="broadcast-price">
              <span>현재가</span>
              <strong>{room.current_bid.toLocaleString()}</strong><small className="auction-minimum-bid-copy">최소 입찰 {currentMinimumBid.toLocaleString()}점</small>
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
                    <h3 className="auction-sponsor-name"><SponsorNickname nickname={team.captain_nickname} /></h3>
                    <small>
                      내전 {team.captain_match_tier ? `${["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"][team.captain_match_tier]}티어` : "미정"}
                      {" · "}{team.captain_average_tier || "롤 티어 미정"}
                    </small>
                  </div>
                  <strong>{team.budget.toLocaleString()}점</strong>
                </header>
                <div className="broadcast-budget-facts">
                  <span>시작 {team.starting_budget.toLocaleString()}</span>
                  <span>보너스 +{team.tier_bonus.toLocaleString()}</span>
                  <span>사용 {(team.starting_budget - team.budget).toLocaleString()}</span>
                </div>
                <div>
                  {(teamPlayers[team.id] || []).map((player: Player) => (
                    <p key={player.id}>
                      <b className="auction-sponsor-name"><SponsorNickname nickname={player.nickname} /></b>
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
                <small><SponsorNickname nickname={bid.bidder_nickname} /></small>
              </div>
            ))}
          </footer>
        </>
      )}

      {flash?.kind === "sold" && (
        <div className="auction-event-flash auction-event-sold">
          <span>SOLD</span><strong className="auction-sponsor-name"><SponsorNickname nickname={flash.nickname} /></strong><p>{flash.team} · {flash.price.toLocaleString()}점 낙찰</p>
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
    </main>
  );
}
