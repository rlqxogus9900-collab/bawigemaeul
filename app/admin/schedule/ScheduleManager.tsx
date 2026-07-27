"use client";

import Link from "next/link";
import { useState } from "react";

type EventRow={id:string;title:string;match_at:string|null;vote_deadline:string|null;status:string};

export default function ScheduleManager({events}:{events:EventRow[]}){
 const [busy,setBusy]=useState("");
 async function remove(event:EventRow){
  if(!window.confirm(`'${event.title}' 일정을 삭제하시겠습니까?\n참가 투표와 팀장 정보도 함께 삭제됩니다.`)) return;
  setBusy(event.id);
  const res=await fetch(`/api/admin/regular-match/${event.id}`,{method:"DELETE"});
  setBusy("");
  const result=await res.json().catch(()=>null);
  if(!res.ok){window.alert(result?.message||"일정 삭제에 실패했습니다.");return;}
  window.location.reload();
 }
 return <div className="record-admin-list">{events.map(e=><article key={e.id}><div><b>{e.title}</b><span>{e.match_at?new Date(e.match_at).toLocaleString('ko-KR'):'시간 미정'} · {e.status==='open'?'모집 중':'종료'}</span></div><div className="schedule-admin-actions"><Link className="button" href={`/admin/regular-match?event=${e.id}`}>관리</Link><button className="button danger" disabled={busy===e.id} onClick={()=>remove(e)}>{busy===e.id?'삭제 중...':'삭제'}</button></div></article>)}{!events.length&&<p className="empty-copy">등록된 일정이 없습니다.</p>}</div>
}
