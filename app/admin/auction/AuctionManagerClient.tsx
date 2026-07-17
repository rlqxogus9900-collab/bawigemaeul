"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Room = {
  id: string;
  title: string;
  status: "ready" | "live" | "finished";
  starting_budget: number;
  bid_step: number;
  created_at: string;
};

type AuctionState = {
  room: Room | null;
  teams: Array<{ id: string; name: string; captain_nickname: string; budget: number }>;
  players: Array<{ id: string; nickname: string; status: string }>;
  bids: Array<{ id: number }>;
};

export default function AuctionManagerClient() {
  const [state, setState] = useState<AuctionState>({ room: null, teams: [], players: [], bids: [] });
  const [startingBudget, setStartingBudget] = useState(1000);
  const [bidStep, setBidStep] = useState(10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/auction/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startingBudget, bidStep })
    });
    const result = await response.json().catch(() => ({}));
    setMessage(response.ok ? "경매방을 만들었습니다. 실시간 경매에 바로 표시됩니다." : result.error || "경매방 생성 실패");
    await load();
    setBusy(false);
  };

  const active = state.room && state.room.status !== "finished";

  return (
    <div className="auction-admin-grid">
      <section className="card auction-admin-create">
        <div className="dashboard-head">
          <div><span>ROOM SETTINGS</span><h2>경매방 만들기</h2></div>
        </div>
        <p className="muted">경매 연동으로 지정한 정기내전 투표의 팀장과 참가자를 자동으로 불러옵니다. 팀장은 선수 명단에서 제외됩니다.</p>
        <div className="auction-create-row auction-create-admin">
          <label>팀별 시작 예산<input min={0} type="number" value={startingBudget} onChange={(e) => setStartingBudget(Number(e.target.value))} /></label>
          <label>기본 입찰 단위<input min={1} type="number" value={bidStep} onChange={(e) => setBidStep(Number(e.target.value))} /></label>
          <button className="button" disabled={busy || Boolean(active)} onClick={createRoom}>{busy ? "생성 중..." : active ? "진행 중인 방 있음" : "경매방 만들기"}</button>
        </div>
        {message && <p className={message.includes("실패") || message.includes("없") ? "form-error" : "form-success"}>{message}</p>}
      </section>

      <section className="card auction-admin-status">
        <div className="dashboard-head"><div><span>CURRENT ROOM</span><h2>현재 경매 상태</h2></div></div>
        {state.room ? (
          <>
            <div className="auction-admin-room-summary">
              <div><span>방 이름</span><b>{state.room.title}</b></div>
              <div><span>상태</span><b>{state.room.status === "ready" ? "시작 대기" : state.room.status === "live" ? "진행 중" : "종료"}</b></div>
              <div><span>팀</span><b>{state.teams.length}팀</b></div>
              <div><span>선수</span><b>{state.players.length}명</b></div>
              <div><span>입찰</span><b>{state.bids.length}건</b></div>
            </div>
            <div className="auction-admin-links">
              <Link className="button" href="/auction">관전 화면 열기</Link>
              <Link className="button secondary" href="/auction/captain">팀장 전용 열기</Link>
              <Link className="button secondary" href="/auction/broadcast" target="_blank">방송 화면 열기</Link>
            </div>
          </>
        ) : <p className="empty-copy">아직 만들어진 경매방이 없습니다.</p>}
      </section>
    </div>
  );
}
