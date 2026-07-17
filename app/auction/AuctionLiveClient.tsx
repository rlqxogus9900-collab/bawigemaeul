'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

type Room = { id:string; title:string; status:string; starting_budget:number; bid_step:number; current_player_id:string|null; current_bid:number; current_team_id:string|null };
type Team = { id:string; name:string; captain_nickname:string; budget:number };
type Player = { id:string; nickname:string; status:string; sold_team_id:string|null; sold_price:number|null };
type Bid = { id:number; team_id:string; amount:number; bidder_nickname:string; created_at:string };

export default function AuctionLiveClient({ isStaff }: { isStaff:boolean }) {
  const [state,setState]=useState<{room:Room|null;teams:Team[];players:Player[];bids:Bid[]}>({room:null,teams:[],players:[],bids:[]});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [budget,setBudget]=useState(1000);
  const [step,setStep]=useState(10);

  const load=useCallback(async()=>{
    const r=await fetch("/api/auction/state",{cache:"no-store"});
    if(r.ok) setState(await r.json());
  },[]);
  useEffect(()=>{ load(); const t=setInterval(load,2000); return()=>clearInterval(t); },[load]);

  const act=async(action:string, extra:Record<string,unknown>={})=>{
    if(!state.room) return;
    setBusy(true); setError("");
    const r=await fetch("/api/admin/auction/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({roomId:state.room.id,action,...extra})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) setError(j.error||"처리 실패");
    await load(); setBusy(false);
  };
  const create=async()=>{
    setBusy(true); setError("");
    const r=await fetch("/api/admin/auction/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startingBudget:budget,bidStep:step})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) setError(j.error||"생성 실패");
    await load(); setBusy(false);
  };

  const currentPlayer=state.players.find(p=>p.id===state.room?.current_player_id);
  const leadingTeam=state.teams.find(t=>t.id===state.room?.current_team_id);
  const waiting=state.players.filter(p=>p.status==="waiting"||p.status==="unsold");
  const teamPlayers=useMemo(()=>Object.fromEntries(state.teams.map(t=>[t.id,state.players.filter(p=>p.sold_team_id===t.id)])),[state.teams,state.players]);

  if(!state.room) return <section className="card auction-empty">
    <h2>진행 중인 경매가 없습니다</h2>
    <p>연동된 정기내전 투표의 참가자와 팀장으로 경매방을 생성합니다.</p>
    {isStaff && <div className="auction-create-row">
      <label>팀 예산<input type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))}/></label>
      <label>입찰 단위<input type="number" value={step} onChange={e=>setStep(Number(e.target.value))}/></label>
      <button className="button" disabled={busy} onClick={create}>{busy?"생성 중...":"경매방 생성"}</button>
    </div>}
    {error&&<p className="form-error">{error}</p>}
  </section>;

  return <div className="auction-live-shell">
    <section className="auction-stage card">
      <div className="dashboard-head"><div><span>LIVE AUCTION · {state.room.status.toUpperCase()}</span><h2>{state.room.title}</h2></div><b>2초마다 자동 동기화</b></div>
      <div className="auction-current">
        <small>현재 선수</small>
        <strong>{currentPlayer?.nickname||"선수를 선택하세요"}</strong>
        <div><span>현재가</span><b>{state.room.current_bid.toLocaleString()}점</b></div>
        <em>{leadingTeam ? `${leadingTeam.name} · ${leadingTeam.captain_nickname}` : "입찰 대기"}</em>
      </div>
      {isStaff&&<div className="auction-control-row">
        {state.room.status==="ready"&&<button disabled={busy} onClick={()=>act("start")}>경매 시작</button>}
        {state.teams.map(t=><button key={t.id} disabled={busy||!currentPlayer} onClick={()=>act("bid",{teamId:t.id})}>{t.name} +{state.room!.bid_step}</button>)}
        <button disabled={busy||!leadingTeam} onClick={()=>act("sell")}>낙찰</button>
        <button disabled={busy||!currentPlayer} onClick={()=>act("unsold")}>유찰</button>
        <button disabled={busy} onClick={()=>act("finish")}>경매 종료</button>
      </div>}
      {error&&<p className="form-error">{error}</p>}
    </section>

    <section className="auction-team-board">
      {state.teams.map(t=><article className={"card auction-team-card "+(leadingTeam?.id===t.id?"is-leading":"")} key={t.id}>
        <header><div><span>{t.name}</span><h3>{t.captain_nickname}</h3></div><strong>{t.budget.toLocaleString()}점</strong></header>
        <div className="auction-team-members">{(teamPlayers[t.id]||[]).map(p=><div key={p.id}><b>{p.nickname}</b><span>{p.sold_price}점</span></div>)}{!(teamPlayers[t.id]||[]).length&&<em>낙찰 선수 없음</em>}</div>
      </article>)}
    </section>

    <section className="auction-bottom-grid">
      <article className="card"><div className="dashboard-head"><div><span>WAITING</span><h2>대기 선수</h2></div><small>{waiting.length}명</small></div>
        <div className="auction-waiting-grid">{waiting.map(p=><button key={p.id} className={currentPlayer?.id===p.id?"active":""} disabled={!isStaff||busy} onClick={()=>act("nominate",{playerId:p.id})}>{p.nickname}<small>{p.status==="unsold"?"유찰":""}</small></button>)}</div>
      </article>
      <article className="card"><div className="dashboard-head"><div><span>HISTORY</span><h2>입찰 기록</h2></div></div>
        <div className="auction-bid-history">{state.bids.map(b=><div key={b.id}><b>{state.teams.find(t=>t.id===b.team_id)?.name||"팀"}</b><span>{b.amount.toLocaleString()}점</span><small>{b.bidder_nickname}</small></div>)}{!state.bids.length&&<p className="muted">입찰 기록이 없습니다.</p>}</div>
      </article>
    </section>
  </div>;
}
