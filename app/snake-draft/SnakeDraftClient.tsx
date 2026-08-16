"use client";
import { useEffect, useMemo, useState } from "react";

type Member={id:string;nickname:string;riot_id:string|null;main_line:string|null;sub_line:string|null;match_tier:number|null};
type Player=Member&{member_id:string;team_no:number|null;pick_order:number|null};
type Team={team_no:number;name:string};
type State={settings:{team_count:number;current_pick:number;expected_team:number};teams:Team[];players:Player[];members:Member[]};
const roman=["","Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ"];

export default function SnakeDraftClient({isStaff}:{isStaff:boolean}){
 const [state,setState]=useState<State|null>(null); const [query,setQuery]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 async function load(){const r=await fetch("/api/snake-draft",{cache:"no-store"}); const j=await r.json(); if(r.ok)setState(j); else setMessage(j.message||"불러오기 실패");}
 useEffect(()=>{load(); const id=setInterval(()=>{if(document.visibilityState==="visible") load();},5000); return()=>clearInterval(id)},[]);
 async function act(payload:any){setBusy(true);setMessage("");const r=await fetch("/api/snake-draft",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const j=await r.json().catch(()=>null);setBusy(false);if(!r.ok){setMessage(j?.message||"처리 실패");return false;} await load();return true;}
 const added=new Set((state?.players||[]).map(p=>p.member_id));
 const normalizedQuery=query.trim().toLowerCase();
 const searchResults=useMemo(()=>{
  if(!state||!normalizedQuery)return[];
  return state.members.filter(m=>{
   const nickname=(m.nickname||"").toLowerCase();
   const riotId=(m.riot_id||"").toLowerCase();
   return nickname.includes(normalizedQuery)||riotId.includes(normalizedQuery);
  }).slice(0,8);
 },[state,normalizedQuery]);
 const waiting=(state?.players||[]).filter(p=>p.team_no==null);
 const sequence=useMemo(()=>{if(!state)return[]; const n=state.settings.team_count; const arr:number[]=[]; for(let round=0;round<4;round++){const base=Array.from({length:n},(_,i)=>i+1); arr.push(...(round%2===0?base:base.reverse()));} return arr;},[state]);
 function drop(teamNo:number|null,e:React.DragEvent){e.preventDefault(); const id=e.dataTransfer.getData("text/member-id"); if(id&&isStaff) act({action:"assign",memberId:id,teamNo});}
 if(!state)return <section className="card"><h1>🐍 스네이크 픽</h1><p>{message||"불러오는 중..."}</p></section>;
 return <div className="snake-page">
  <section className="card snake-head"><div><span>INHOUSE DRAFT</span><h1>🐍 스네이크 픽</h1><p className="muted">운영진이 참가자를 검색해 추가하고 현재 픽 차례 팀으로 선수를 드래그합니다.</p></div><div className="snake-turn"><small>현재 픽</small><b>{state.teams.find(t=>t.team_no===state.settings.expected_team)?.name||`${state.settings.expected_team}팀`}</b><em>#{state.settings.current_pick+1}</em></div></section>
  {message&&<div className="error">{message}</div>}
  {isStaff&&<section className="card snake-controls">
   <div className="snake-control-row"><label>팀 수<select value={state.settings.team_count} onChange={e=>act({action:"configure",teamCount:Number(e.target.value)})} disabled={busy}>{[2,3,4].map(n=><option key={n} value={n}>{n}팀</option>)}</select></label><button className="button" onClick={()=>confirm("픽 배정을 전부 초기화할까요?")&&act({action:"reset"})}>픽 초기화</button></div>
   <div className="snake-search-picker">
    <label className="snake-search-label">참가자 검색
     <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="닉네임 또는 Riot ID 검색" autoComplete="off" />
    </label>
    {normalizedQuery&&<div className="snake-search-results">
      {searchResults.map(m=>{const isAdded=added.has(m.id);return <div className="snake-search-result" key={m.id}>
       <div><b>{m.nickname}</b>{m.riot_id&&<small>{m.riot_id}</small>}<p><span>주 {m.main_line||"미정"}</span><span>부 {m.sub_line||"미정"}</span><span>내전 {m.match_tier?`${roman[m.match_tier]}티어`:"미정"}</span></p></div>
       <button className="button primary" disabled={isAdded||busy} onClick={async()=>{if(await act({action:"addMembers",memberIds:[m.id]}))setQuery("")}}>{isAdded?"추가됨":"추가"}</button>
      </div>})}
      {!searchResults.length&&<p className="muted">검색 결과가 없습니다.</p>}
    </div>}
   </div>
  </section>}
  <section className="card snake-sequence"><b>픽 순서</b><div>{sequence.map((n,i)=><span key={i} className={i===state.settings.current_pick?"active":i<state.settings.current_pick?"done":""}>{state.teams.find(t=>t.team_no===n)?.name||`${n}팀`}</span>)}</div></section>
  <div className="snake-board">
   <section className="card snake-pool" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(null,e)}><header><div><span>대기 선수</span><h2>{waiting.length}명</h2></div></header><div className="snake-player-list">{waiting.map(p=><PlayerCard key={p.member_id} p={p} isStaff={isStaff} onRemove={()=>act({action:"removeMember",memberId:p.member_id})}/>) }{!waiting.length&&<p className="muted">대기 선수가 없습니다.</p>}</div></section>
   <div className="snake-teams">{state.teams.map(team=>{const ps=state.players.filter(p=>p.team_no===team.team_no).sort((a,b)=>(a.pick_order||999)-(b.pick_order||999)); const active=team.team_no===state.settings.expected_team; return <section key={team.team_no} className={`card snake-team ${active?"active":""}`} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(team.team_no,e)}><header><div><small>{active?"현재 픽 차례":"TEAM"}</small>{isStaff?<input defaultValue={team.name} onBlur={e=>e.target.value.trim()&&e.target.value!==team.name&&act({action:"renameTeam",teamNo:team.team_no,name:e.target.value.trim()})}/>:<h2>{team.name}</h2>}</div><strong>{ps.length}명</strong></header><div className="snake-player-list">{ps.map(p=><PlayerCard key={p.member_id} p={p} isStaff={isStaff}/>) }{!ps.length&&<p className="muted">여기로 선수를 드래그하세요.</p>}</div></section>})}</div>
  </div>
 </div>
}
function PlayerCard({p,isStaff,onRemove}:{p:Player;isStaff:boolean;onRemove?:()=>void}){return <article className="snake-player" draggable={isStaff} onDragStart={e=>e.dataTransfer.setData("text/member-id",p.member_id)}><div><b>{p.nickname}</b>{p.pick_order&&<em>#{p.pick_order}</em>}</div><p><span>주 {p.main_line||"미정"}</span><span>부 {p.sub_line||"미정"}</span><span>내전 {p.match_tier?`${roman[p.match_tier]}티어`:"미정"}</span></p>{onRemove&&<button onClick={onRemove} aria-label="명단 제거">×</button>}</article>}
