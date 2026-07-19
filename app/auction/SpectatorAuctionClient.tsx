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
  created_at: string;
};

type State = { room: Room | null; teams: Team[]; players: Player[]; bids: Bid[] };

export default function SpectatorAuctionClient() {
  const [state, setState] = useState<State>({ room: null, teams: [], players: [], bids: [] });
  const [soundOn, setSoundOn] = useState(true);
  const [soldFlash, setSoldFlash] = useState<{ nickname: string; team: string; price: number } | null>(null);
  const previousSold = useRef(new Set<string>());
  const initialized = useRef(false);
  const previousBid = useRef(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/auction/state", { cache: "no-store" });
    if (!response.ok) return;
    const next: State = await response.json();

    const sold = next.players.filter((player) => player.status === "sold");
    const newlySold = sold.find((player) => !previousSold.current.has(player.id));

    if (initialized.current && newlySold) {
      const team = next.teams.find((item) => item.id === newlySold.sold_team_id);
      setSoldFlash({
        nickname: newlySold.nickname,
        team: team?.name || "팀",
        price: newlySold.sold_price || 0
      });
      window.setTimeout(() => setSoldFlash(null), 2600);
    }

    previousSold.current = new Set(sold.map((player) => player.id));
    initialized.current = true;
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
        gain.gain.setValueAtTime(0.055, ctx.currentTime);
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

  if (!room) {
    return (
      <section className="auction-viewer-wait card">
        <span>BAWIGEMAEUL LIVE AUCTION</span>
        <h2>경매방 생성 대기 중</h2>
        <p>운영진이 경매 관리에서 방을 만들면 이 화면에 자동으로 표시됩니다.</p>
      </section>
    );
  }

  return (
    <div className="auction-viewer-shell">
      <div className="auction-viewer-topbar">
        <div>
          <span>BAWIGEMAEUL · LIVE AUCTION</span>
          <h2>{room.title}</h2>
        </div>
        <div>
          <b>{room.status === "live" ? "LIVE" : room.status === "ready" ? "READY" : "FINISHED"}</b>
          <button onClick={() => setSoundOn((value) => !value)}>소리 {soundOn ? "ON" : "OFF"}</button>
        </div>
      </div>

      {room.status === "finished" ? (
        <section className="auction-final-result">
          <div className="auction-final-title">
            <span>FINAL RESULT</span>
            <h2>경매 최종 결과</h2>
            <p>팀별 낙찰 선수와 낙찰 점수</p>
          </div>
          <div className="auction-viewer-team-grid">
            {state.teams.map((team) => (
              <article key={team.id}>
                <header>
                  <div><span>{team.name}</span><h3 className="auction-sponsor-name"><SponsorNickname nickname={team.captain_nickname} /></h3><small>{team.captain_match_tier ? `내전 ${["","Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][team.captain_match_tier]}티어` : "내전 티어 미정"} · {team.captain_average_tier || "롤 티어 미정"}</small></div>
                  <strong>잔여 {team.budget.toLocaleString()}점</strong>
                </header>
                <div className="auction-captain-budget"><span>시작 {team.starting_budget.toLocaleString()}점</span><span>보너스 +{team.tier_bonus.toLocaleString()}점</span><span>사용 {(team.starting_budget-team.budget).toLocaleString()}점</span></div><div>
                  {(teamPlayers[team.id] || []).map((player: Player) => (
                    <p key={player.id}>
                      <b className="auction-sponsor-name"><SponsorNickname nickname={player.nickname} /></b>
                      <span>{(player.sold_price || 0).toLocaleString()}점</span>
                    </p>
                  ))}
                  {!(teamPlayers[team.id] || []).length && <em>낙찰 선수 없음</em>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="auction-viewer-stage">
            <small>현재 경매 선수</small>
            <h1>{currentPlayer ? <SponsorNickname nickname={currentPlayer.nickname} /> : "다음 선수 대기"}</h1>
            <div>
              <span>현재가</span>
              <strong>{room.current_bid.toLocaleString()}</strong><small className="auction-minimum-bid-copy">최소 입찰 {currentMinimumBid.toLocaleString()}점</small>
              <em>점</em>
            </div>
            <p>{leadingTeam ? `${leadingTeam.name} · ${leadingTeam.captain_nickname}` : "첫 입찰을 기다리는 중"}</p>
          </section>

          <section className="auction-viewer-team-grid">
            {state.teams.map((team) => (
              <article className={leadingTeam?.id === team.id ? "leading" : ""} key={team.id}>
                <header>
                  <div><span>{team.name}</span><h3 className="auction-sponsor-name"><SponsorNickname nickname={team.captain_nickname} /></h3><small>{team.captain_match_tier ? `내전 ${["","Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"][team.captain_match_tier]}티어` : "내전 티어 미정"} · {team.captain_average_tier || "롤 티어 미정"}</small></div>
                  <strong>{team.budget.toLocaleString()}점</strong>
                </header>
                <div className="auction-captain-budget"><span>시작 {team.starting_budget.toLocaleString()}점</span><span>보너스 +{team.tier_bonus.toLocaleString()}점</span><span>사용 {(team.starting_budget-team.budget).toLocaleString()}점</span></div><div>
                  {(teamPlayers[team.id] || []).map((player: Player) => (
                    <p key={player.id}>
                      <b className="auction-sponsor-name"><SponsorNickname nickname={player.nickname} /></b>
                      <span>{(player.sold_price || 0).toLocaleString()}점</span>
                    </p>
                  ))}
                  {!(teamPlayers[team.id] || []).length && <em>낙찰 선수 없음</em>}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      <section className="auction-viewer-history">
        <div className="dashboard-head">
          <div><span>BID HISTORY</span><h2>실시간 입찰 기록</h2></div>
        </div>
        <div>
          {state.bids.slice(0, 12).map((bid) => (
            <p key={bid.id}>
              <b>{state.teams.find((team) => team.id === bid.team_id)?.name || "팀"}</b>
              <strong>{bid.amount.toLocaleString()}점</strong>
              <span><SponsorNickname nickname={bid.bidder_nickname} /></span>
              <time>{new Date(bid.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
            </p>
          ))}
          {!state.bids.length && <em>입찰 기록이 없습니다.</em>}
        </div>
      </section>

      {soldFlash && (
        <div className="sold-flash">
          <span>SOLD</span>
          <strong className="auction-sponsor-name"><SponsorNickname nickname={soldFlash.nickname} /></strong>
          <p>{soldFlash.team} · {soldFlash.price.toLocaleString()}점</p>
        </div>
      )}
    </div>
  );
}
