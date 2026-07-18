"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Room = {
  id: string; title: string; status: "ready" | "live" | "finished";
  starting_budget: number; bid_step: number; tier_balance_enabled: boolean; tier_bonus_per_tier: number;
};
type Team = {
  id: string; name: string; captain_nickname: string; captain_match_tier: number | null;
  captain_average_tier: string | null; base_budget: number; tier_bonus: number;
  starting_budget: number; budget: number;
};
type AuctionState = {
  room: Room | null; teams: Team[];
  players: Array<{ id: string; nickname: string; status: string }>;
  bids: Array<{ id: number }>;
};
const roman: Record<number, string> = { 1: "Ⅰ", 2: "Ⅱ", 3: "Ⅲ", 4: "Ⅳ", 5: "Ⅴ" };

export default function AuctionManagerClient() {
  const [state, setState] = useState<AuctionState>({ room: null, teams: [], players: [], bids: [] });
  const [startingBudget, setStartingBudget] = useState(1000);
  const [bidStep, setBidStep] = useState(10);
  const [tierBalanceEnabled, setTierBalanceEnabled] = useState(true);
  const [tierBonusPerTier, setTierBonusPerTier] = useState(100);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [createMode, setCreateMode] = useState<"poll" | "manual">("poll");
  const [manualTitle, setManualTitle] = useState("수동 실시간 경매");
  const [manualCaptains, setManualCaptains] = useState("");
  const [manualPlayers, setManualPlayers] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/auction/state", { cache: "no-store" });
    if (response.ok) setState(await response.json());
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 1500);
    return () => window.clearInterval(timer);
  }, [load]);

  const createRoom = async () => {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/auction/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startingBudget, bidStep, tierBalanceEnabled, tierBonusPerTier, mode: createMode,
        title: manualTitle,
        captains: manualCaptains.split(/[\n,]/).map(v => v.trim()).filter(Boolean),
        players: manualPlayers.split(/[\n,]/).map(v => v.trim()).filter(Boolean)
      })
    });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "새 경매방을 만들었습니다. 모든 경매 화면에 바로 표시됩니다." : result.error || "경매방 생성 실패");
    await load(); setBusy(false);
  };

  const deleteRoom = async () => {
    if (!state.room || deleting) return;
    const confirmed = window.confirm(`현재 경매방과 남아 있는 이전 테스트 경매 기록을 모두 삭제할까요?\n팀, 선수, 입찰 기록도 함께 초기화되며 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setDeleting(true);
    setMessage("");
    const response = await fetch("/api/admin/auction/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: state.room.id })
    });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "현재 경매와 이전 테스트 기록을 모두 삭제했습니다." : result.error || "경매 삭제 실패");
    if (response.ok) setState({ room: null, teams: [], players: [], bids: [] });
    await load();
    setDeleting(false);
  };


  const addPlayer = async () => {
    if (!state.room || !newPlayer.trim() || addingPlayer) return;
    setAddingPlayer(true); setMessage("");
    const response = await fetch("/api/admin/auction/player", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: state.room.id, nickname: newPlayer.trim() })
    });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? `${newPlayer.trim()} 선수를 추가했습니다.` : result.error || "선수 추가 실패");
    if (response.ok) setNewPlayer("");
    await load(); setAddingPlayer(false);
  };

  const active = state.room && state.room.status !== "finished";

  return (
    <div className="auction-admin-grid">
      <section className="card auction-admin-create">
        <div className="dashboard-head"><div><span>ROOM SETTINGS</span><h2>{state.room?.status === "finished" ? "새 경매 시작" : "경매방 만들기"}</h2></div></div>
        <p className="muted">투표 결과를 그대로 적용하거나, 팀장과 선수를 직접 입력해 투표 없이 만들 수 있습니다.</p>
        <div className="auction-create-mode">
          <button type="button" className={createMode === "poll" ? "active" : ""} onClick={() => setCreateMode("poll")}>투표에서 만들기</button>
          <button type="button" className={createMode === "manual" ? "active" : ""} onClick={() => setCreateMode("manual")}>투표 없이 수동 생성</button>
        </div>
        {createMode === "manual" && <div className="auction-manual-create">
          <label>경매 이름<input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} /></label>
          <label>팀장 닉네임 <small>쉼표 또는 줄바꿈, 2명 이상</small><textarea value={manualCaptains} onChange={(e) => setManualCaptains(e.target.value)} placeholder={"팀장1, 팀장2"} /></label>
          <label>선수 닉네임 <small>쉼표 또는 줄바꿈</small><textarea value={manualPlayers} onChange={(e) => setManualPlayers(e.target.value)} placeholder={"선수1, 선수2, 선수3"} /></label>
        </div>}
        <div className="auction-create-row auction-create-admin auction-settings-grid">
          <label>기본 시작 예산<input min={0} type="number" value={startingBudget} onChange={(e) => setStartingBudget(Number(e.target.value))} /></label>
          <label>기본 입찰 단위<input min={1} type="number" value={bidStep} onChange={(e) => setBidStep(Number(e.target.value))} /></label>
          <label>티어당 추가 점수<input min={0} type="number" disabled={!tierBalanceEnabled} value={tierBonusPerTier} onChange={(e) => setTierBonusPerTier(Number(e.target.value))} /></label>
          <label className="auction-tier-toggle"><span>팀장 티어 보정</span><button type="button" className={tierBalanceEnabled ? "enabled" : ""} onClick={() => setTierBalanceEnabled(v => !v)}>{tierBalanceEnabled ? "사용 ON" : "사용 OFF"}</button></label>
        </div>
        <div className="auction-budget-example"><b>계산 방식</b><span>가장 높은 팀장 기준 1티어 차이마다 +{tierBonusPerTier.toLocaleString()}점</span></div>
        <div className="auction-room-setting-actions">
          <button className="button auction-create-main-button" disabled={busy || deleting || Boolean(active)} onClick={createRoom}>
            {busy ? "생성 중..." : active ? "진행 중인 경매가 있습니다" : state.room?.status === "finished" ? "결과 보관 후 새 경매 시작" : "경매방 만들기"}
          </button>
          {state.room && (
            <button type="button" className="button auction-delete-room-button" disabled={busy || deleting} onClick={deleteRoom}>
              {deleting ? "삭제 중..." : "현재 경매 삭제"}
            </button>
          )}
        </div>
        {message && <p className={message.includes("실패") || message.includes("없") ? "form-error" : "form-success"}>{message}</p>}
      </section>

      <section className="card auction-admin-status">
        <div className="dashboard-head"><div><span>CURRENT ROOM</span><h2>현재 경매 상태</h2></div></div>
        {state.room ? <>
          <div className="auction-admin-room-summary">
            <div><span>방 이름</span><b>{state.room.title}</b></div>
            <div><span>상태</span><b>{state.room.status === "ready" ? "시작 대기" : state.room.status === "live" ? "진행 중" : "결과 표시 중"}</b></div>
            <div><span>팀</span><b>{state.teams.length}팀</b></div><div><span>선수</span><b>{state.players.length}명</b></div><div><span>입찰</span><b>{state.bids.length}건</b></div>
          </div>
          <div className="auction-admin-captains">
            {state.teams.map(team => <article key={team.id}>
              <header><span>{team.name} 팀장</span><strong>{team.captain_nickname}</strong></header>
              <p><b>내전 티어</b><span>{team.captain_match_tier ? `${roman[team.captain_match_tier]}티어` : "미정"}</span></p>
              <p><b>롤 티어</b><span>{team.captain_average_tier || "미정"}</span></p>
              <p><b>기본 예산</b><span>{team.base_budget.toLocaleString()}점</span></p>
              <p><b>티어 보너스</b><span>+{team.tier_bonus.toLocaleString()}점</span></p>
              <p><b>총 시작 예산</b><span>{team.starting_budget.toLocaleString()}점</span></p>
              <p><b>현재 예산</b><span>{team.budget.toLocaleString()}점</span></p>
            </article>)}
          </div>
          <div className="auction-manual-player-add">
            <div><b>선수 수동 추가</b><span>경매 생성 후에도 대기 선수 명단에 바로 추가됩니다.</span></div>
            <div><input value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPlayer(); }} placeholder="추가할 선수 닉네임" /><button type="button" disabled={addingPlayer || !newPlayer.trim()} onClick={addPlayer}>{addingPlayer ? "추가 중..." : "선수 추가"}</button></div>
          </div>
          <div className="auction-admin-links">
            <Link className="button" href="/auction">관전 화면 열기</Link>
            <Link className="button secondary" href="/auction/captain">팀장 전용 열기</Link>
            <Link className="button secondary" href="/auction/broadcast" target="_blank">방송 화면 열기</Link>
          </div>
        </> : <p className="empty-copy">아직 만들어진 경매방이 없습니다.</p>}
      </section>
    </div>
  );
}
